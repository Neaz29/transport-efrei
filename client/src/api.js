const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Erreur API (${response.status})`);
  }

  if (options.skipJson) {
    return undefined;
  }
  return response.json();
}

export function getHealth() {
  return request('/health');
}

// Auth
export function registerUser(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  return request('/auth/logout', { method: 'POST', skipJson: true });
}

export function getMe() {
  return request('/auth/me');
}

// Rides (trajets)
export function getRides(futureOnly = true) {
  return request(`/rides?futureOnly=${futureOnly}`);
}

export function createRide(payload) {
  return request('/rides', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRide(id, payload) {
  return request(`/rides/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteRide(id) {
  return request(`/rides/${id}`, {
    method: 'DELETE',
  });
}

// Bookings
export function createBooking(payload) {
  return request('/bookings', { method: 'POST', body: JSON.stringify(payload) });
}

export function getBookings() {
  return request('/bookings');
}

export function cancelBooking(id) {
  return request(`/bookings/${id}`, { method: 'DELETE' });
}

// Profile summary
export function getProfileSummary() {
  return request('/me/summary');
}
