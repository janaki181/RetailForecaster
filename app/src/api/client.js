// Central API utility — every fetch in the app goes through here.
// Attaches JWT Bearer token automatically to every request.

const BASE_URL = "http://localhost:8000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("rf_token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Token expired — clear everything and force re-login
    localStorage.removeItem("rf_token");
    localStorage.removeItem("rf_auth");
    localStorage.removeItem("rf_user");
    window.location.href = "/";
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get:    (path)        => apiFetch(path),
  post:   (path, body)  => apiFetch(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body)  => apiFetch(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)        => apiFetch(path, { method: "DELETE" }),
};

// Trigger a file download (CSV / XML) using the auth token
export function downloadFile(path, filename) {
  const token = localStorage.getItem("rf_token");
  fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a  = document.createElement("a");
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(console.error);
}
