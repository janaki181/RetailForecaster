const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("rf_token");
}

export async function apiFetch(path, options = {}) {
  const { method = "GET", body, auth = true, headers = {} } = options;
  const finalHeaders = { ...headers };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.detail || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export { API_BASE };
