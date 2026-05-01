const API_BASE = 'http://localhost:5001/api';//'/api';

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const cleanEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;
    console.log("API CALL →", `${API_BASE}${cleanEndpoint}`);
  const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}
