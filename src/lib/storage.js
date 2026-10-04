// Every access is wrapped: storage throws in private windows, with blocked
// site data, and does not exist during the prerender.
const PREFIX = 'vm-cv2.';

export function readStore(key, fallback, allowed) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v && (!allowed || allowed.includes(v)) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // not persisted
  }
}

export function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(PREFIX + key));
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  writeStore(key, JSON.stringify(value));
}

export function urlRole() {
  try {
    const r = new URLSearchParams(window.location.search).get('role');
    return r === 'embedded' || r === 'software' ? r : null;
  } catch {
    return null;
  }
}

export function writeUrlRole(role) {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set('role', role);
    window.history.replaceState(window.history.state, '', u.toString());
  } catch {
    // address bar not updated
  }
}
