import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Trips
export const tripAPI = {
  getById: (id) => api.get(`/trips/${id}`),
  create: (trip) => api.post("/trips", trip),
  update: (id, trip) => api.put(`/trips/${id}`, trip),
  delete: (id) => api.delete(`/trips/${id}`),
  // Access code endpoints
  checkCodeAvailability: (code) => api.get(`/trips/check-code/${code}`),
  getByCode: (code) => api.get(`/trips/code/${code}`),
  verifySecurity: (tripId, securityAnswer) => api.post("/trips/verify-security", { tripId, securityAnswer }),
  recoverCode: (name, destination, recoveryAnswer) => api.post("/trips/recover", { name, destination, recoveryAnswer }),

};

// Places
export const placesAPI = {
  getAll: (tripId) => {
    const url = tripId ? `/places?trip_id=${tripId}` : "/places";
    return api.get(url);
  },
  getById: (id) => api.get(`/places/${id}`),
  create: (place) => api.post("/places", place),
  update: (id, place) => api.put(`/places/${id}`, place),
  delete: (id) => api.delete(`/places/${id}`),
};

// Itinerary
export const itineraryAPI = {
  getByTrip: (tripId) => api.get(`/itinerary/${tripId}`),
  createDayPlan: (data) => api.post("/itinerary", data),
  updateDayPlan: (dayPlanId, data) => api.put(`/itinerary/${dayPlanId}`, data),
  deleteDayPlan: (dayPlanId) => api.delete(`/itinerary/${dayPlanId}`),
  addPlaceToDay: (dayPlanId, data) =>
    api.post(`/itinerary/${dayPlanId}/places`, data),
  updatePlaceInDay: (dayPlanId, id, data) =>
    api.put(`/itinerary/${dayPlanId}/places/${id}`, data),
  removePlaceFromDay: (dayPlanId, id) =>
    api.delete(`/itinerary/${dayPlanId}/places/${id}`),
  reorderPlaces: (dayPlanId, order) =>
    api.put(`/itinerary/${dayPlanId}/reorder`, { order }),
};

// Health
export const healthAPI = {
  check: () => api.get("/health"),
};

// Payment Users
export const paymentUsersAPI = {
  getAll: (tripId) => {
    const url = tripId ? `/payment_users?trip_id=${tripId}` : "/payment_users";
    return api.get(url);
  },
  getById: (id) => api.get(`/payment_users/${id}`),
  create: (user) => api.post("/payment_users", user),
  update: (id, user) => api.put(`/payment_users/${id}`, user),
  delete: (id) => api.delete(`/payment_users/${id}`),
};

// Expenses
export const expensesAPI = {
  getAll: () => api.get("/expenses"),
  getByTrip: (tripId) => api.get(`/expenses?tripId=${tripId}`),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expense) => api.post("/expenses", expense),
  update: (id, expense) => api.put(`/expenses/${id}`, expense),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Ledger
export const ledgerAPI = {
  getAll: (tripId) => {
    const url = tripId ? `/ledger?trip_id=${tripId}` : "/ledger";
    return api.get(url);
  },
};

export default api;
