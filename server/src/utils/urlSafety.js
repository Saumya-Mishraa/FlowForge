const dns = require('dns').promises;
const net = require('net');
const { env } = require('../config/env');
const ApiError = require('./ApiError');

// Private/reserved ranges the executor refuses to call when
// EXECUTOR_BLOCK_PRIVATE_NETWORKS is true (the default). This is a defense
// against using FlowForge as an SSRF pivot to reach internal services
// (cloud metadata endpoints, internal admin panels, localhost, etc.).
const BLOCKED_V4_RANGES = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16', // includes 169.254.169.254 cloud metadata
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '224.0.0.0/4',
  '240.0.0.0/4',
];

function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpInCidr(ip, cidr) {
  const [range, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
}

function isBlockedIPv4(ip) {
  return BLOCKED_V4_RANGES.some((cidr) => isIpInCidr(ip, cidr));
}

function isBlockedIPv6(ip) {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' || // loopback
    normalized.startsWith('fe80:') || // link-local
    normalized.startsWith('fc') || // unique local fc00::/7
    normalized.startsWith('fd') ||
    normalized.startsWith('::ffff:') // IPv4-mapped, re-check as v4 below
  );
}

// Resolves the hostname and throws if any resolved address is in a blocked
// range. Called right before executing a request, not just at validation
// time, so a DNS answer can't be swapped between check and use (basic
// TOCTOU mitigation — not perfect, but meaningfully raises the bar).
async function assertUrlIsSafeToFetch(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw ApiError.badRequest('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw ApiError.badRequest(`Unsupported protocol: ${parsed.protocol}`);
  }

  if (!env.executorBlockPrivateNetworks) {
    return parsed;
  }

  const hostname = parsed.hostname;

  if (net.isIP(hostname)) {
    const isV4 = net.isIP(hostname) === 4;
    if ((isV4 && isBlockedIPv4(hostname)) || (!isV4 && isBlockedIPv6(hostname))) {
      throw ApiError.forbidden('Requests to private/internal network addresses are not allowed');
    }
    return parsed;
  }

  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw ApiError.forbidden('Requests to localhost are not allowed');
  }

  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw ApiError.badRequest(`Could not resolve host: ${hostname}`);
  }

  for (const { address, family } of addresses) {
    if (family === 4 && isBlockedIPv4(address)) {
      throw ApiError.forbidden('Requests to private/internal network addresses are not allowed');
    }
    if (family === 6 && isBlockedIPv6(address)) {
      throw ApiError.forbidden('Requests to private/internal network addresses are not allowed');
    }
  }

  return parsed;
}

module.exports = { assertUrlIsSafeToFetch, isBlockedIPv4, isBlockedIPv6 };
