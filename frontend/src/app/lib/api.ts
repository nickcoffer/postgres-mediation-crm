export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Auto-login with default credentials
export async function ensureLoggedIn() {
  // Check if we're in the browser
  if (typeof window === "undefined") {
    return null;
  }
  
  // Check if we already have a token
  const existingToken = localStorage.getItem("access_token");
  if (existingToken) {
    return existingToken;
  }

  // Auto-login with default credentials
  try {
    const res = await fetch(`${API_BASE}/api/auth/jwt/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin" })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      return data.access;
    }
  } catch (error) {
    console.error("Auto-login failed:", error);
  }
  
  return null;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/jwt/create/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password })
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function getCases(token: string) {
  const res = await fetch(`${API_BASE}/api/cases/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function getCase(id: string, token: string) {
  const res = await fetch(`${API_BASE}/api/cases/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to fetch case");
  return res.json();
}
