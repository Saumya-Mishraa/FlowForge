// Resolves a dot/bracket path like "user.roles[0].name" against an object.
// Returns undefined (never throws) when any segment along the way is
// missing, so callers can treat "not found" uniformly whether the object,
// an intermediate key, or the final key is absent.
function getByPath(obj, path) {
  if (obj === undefined || obj === null || !path) return undefined;

  const normalized = String(path).replace(/\[(\d+)\]/g, '.$1');
  const segments = normalized.split('.').filter(Boolean);

  let current = obj;
  for (const segment of segments) {
    if (current === undefined || current === null) return undefined;
    current = current[segment];
  }
  return current;
}

function setByPath(obj, path, value) {
  const normalized = String(path).replace(/\[(\d+)\]/g, '.$1');
  const segments = normalized.split('.').filter(Boolean);
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (typeof current[seg] !== 'object' || current[seg] === null) {
      current[seg] = {};
    }
    current = current[seg];
  }
  current[segments[segments.length - 1]] = value;
  return obj;
}

module.exports = { getByPath, setByPath };
