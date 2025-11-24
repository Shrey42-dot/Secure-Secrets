// src/api/secretsapi.js

export async function createSecret(body) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchSecret(token) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets/${token}`);

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  return res.json();
}
