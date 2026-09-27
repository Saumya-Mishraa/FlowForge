const axios = require('axios');
const net = require('net');
const { env } = require('../config/env');
const { assertUrlIsSafeToFetch, isBlockedIPv4, isBlockedIPv6 } = require('../utils/urlSafety');
const { resolveString } = require('./environmentService');

// Builds the final URL (with resolved query params) and axios config from a
// FlowForge request definition + a resolved variable map. Shared by the API
// Tester's "Send" endpoint and, eventually, the workflow engine's apiRequest
// node — one place that knows how to turn a stored request into an HTTP call.
function buildAxiosConfig({ method, url, params = [], headers = [], auth = {}, body = {} }, variables) {
  const resolvedUrl = resolveString(url, variables);
  const urlObj = new URL(resolvedUrl);

  for (const p of params) {
    if (p.enabled === false || !p.key) continue;
    urlObj.searchParams.set(resolveString(p.key, variables), resolveString(p.value, variables));
  }

  const finalHeaders = {};
  for (const h of headers) {
    if (h.enabled === false || !h.key) continue;
    finalHeaders[resolveString(h.key, variables)] = resolveString(h.value, variables);
  }

  applyAuth(auth, finalHeaders, urlObj, variables);

  let data;
  if (body?.mode === 'json') {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
    const resolved = resolveString(body.json || '', variables);
    try {
      data = resolved ? JSON.parse(resolved) : undefined;
    } catch {
      data = resolved;
    }
  } else if (body?.mode === 'raw') {
    data = resolveString(body.raw || '', variables);
  } else if (body?.mode === 'urlencoded') {
    const usp = new URLSearchParams();
    for (const kv of body.urlencoded || []) {
      if (kv.enabled === false || !kv.key) continue;
      usp.append(resolveString(kv.key, variables), resolveString(kv.value, variables));
    }
    data = usp.toString();
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/x-www-form-urlencoded';
  } else if (body?.mode === 'formData') {
    const usp = new URLSearchParams();
    for (const kv of body.formData || []) {
      if (kv.enabled === false || !kv.key) continue;
      usp.append(resolveString(kv.key, variables), resolveString(kv.value, variables));
    }
    data = usp.toString();
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/x-www-form-urlencoded';
  }

  return {
    method,
    url: urlObj.toString(),
    headers: finalHeaders,
    data,
    timeout: env.executorTimeoutMs,
    maxContentLength: env.executorMaxResponseBytes,
    maxBodyLength: env.executorMaxResponseBytes,
    validateStatus: () => true,
    maxRedirects: 5,
    beforeRedirect: env.executorBlockPrivateNetworks ? guardRedirect : undefined,
  };
}

// axios's beforeRedirect hook is synchronous — it can't await a DNS lookup,
// so a full re-check like assertUrlIsSafeToFetch can't run here. Instead we
// synchronously block the cases we *can* check without DNS: the redirect
// target is a literal IP in a blocked range, or is literally "localhost" /
// a ".local" name. A malicious server redirecting to an internal hostname
// that resolves to a private IP (rather than a literal IP) is not caught by
// this hook — see README "Security notes" for that limitation. Throwing
// here aborts the redirect (axios propagates the thrown error).
function guardRedirect(options) {
  const hostname = options.hostname;

  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('Redirect to localhost is not allowed');
  }

  const ipFamily = net.isIP(hostname);
  if (ipFamily === 4 && isBlockedIPv4(hostname)) {
    throw new Error('Redirect to a private/internal network address is not allowed');
  }
  if (ipFamily === 6 && isBlockedIPv6(hostname)) {
    throw new Error('Redirect to a private/internal network address is not allowed');
  }
}

function applyAuth(auth, headers, urlObj, variables) {
  if (!auth || auth.type === 'none') return;

  if (auth.type === 'bearer') {
    headers.Authorization = `Bearer ${resolveString(auth.bearerToken || '', variables)}`;
  } else if (auth.type === 'basic') {
    const user = resolveString(auth.basicUsername || '', variables);
    const pass = resolveString(auth.basicPassword || '', variables);
    headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  } else if (auth.type === 'apiKey') {
    const name = resolveString(auth.apiKeyName || '', variables);
    const value = resolveString(auth.apiKeyValue || '', variables);
    if (!name) return;
    if (auth.apiKeyIn === 'query') {
      urlObj.searchParams.set(name, value);
    } else {
      headers[name] = value;
    }
  }
  // 'oauth2' — architecture only in this build; see README limitations.
}

async function executeRequest(requestDef, variables) {
  await assertUrlIsSafeToFetch(resolveString(requestDef.url, variables));

  const config = buildAxiosConfig(requestDef, variables);
  const startedAt = Date.now();

  try {
    const response = await axios(config);
    const durationMs = Date.now() - startedAt;
    const responseSizeBytes = estimateSize(response.data, response.headers);

    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      durationMs,
      responseSizeBytes,
      resolvedUrl: config.url,
      errorMessage: '',
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    let errorMessage = err.message;
    if (err.code === 'ECONNABORTED') errorMessage = `Request timed out after ${env.executorTimeoutMs}ms`;
    if (err.code === 'ENOTFOUND') errorMessage = 'Could not resolve host';
    if (err.code === 'ECONNREFUSED') errorMessage = 'Connection refused';

    return {
      ok: false,
      status: 0,
      statusText: '',
      headers: {},
      data: null,
      durationMs,
      responseSizeBytes: 0,
      resolvedUrl: config.url,
      errorMessage,
    };
  }
}

function estimateSize(data, headers) {
  const declared = headers?.['content-length'];
  if (declared) return parseInt(declared, 10);
  try {
    return Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data ?? ''));
  } catch {
    return 0;
  }
}

module.exports = { executeRequest, buildAxiosConfig };
