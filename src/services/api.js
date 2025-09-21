import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Trip API functions
export const tripAPI = {
  // Get all trips
  getAll: () => api.get('/trips'),
  
  // Get trip by ID
  getById: (id) => api.get(`/trips/${id}`),
  
  // Create new trip
  create: (tripData) => api.post('/trips', tripData),
  
  // Update trip
  update: (id, tripData) => api.put(`/trips/${id}`, tripData),
  
  // Delete trip
  delete: (id) => api.delete(`/trips/${id}`),
};

// Places API functions
export const placesAPI = {
  // Get all places
  getAll: () => api.get('/places'),
  
  // Get place by ID
  getById: (id) => api.get(`/places/${id}`),
  
  // Create new place
  create: (placeData) => api.post('/places', placeData),
  
  // Update place
  update: (id, placeData) => api.put(`/places/${id}`, placeData),
  
  // Delete place
  delete: (id) => api.delete(`/places/${id}`),
  
  // Search places
  search: (query) => api.get(`/places/search?q=${encodeURIComponent(query)}`),
  
  // Get places by category
  getByCategory: (category) => api.get(`/places/category/${category}`),
};

// Itinerary API functions
export const itineraryAPI = {
  // Get trip itinerary
  getByTrip: (tripId) => api.get(`/itinerary/${tripId}`),
  
  // Create day plan
  createDayPlan: (dayPlanData) => api.post('/itinerary', dayPlanData),
  
  // Update day plan
  updateDayPlan: (dayPlanId, dayPlanData) => api.put(`/itinerary/${dayPlanId}`, dayPlanData),
  
  // Delete day plan
  deleteDayPlan: (dayPlanId) => api.delete(`/itinerary/${dayPlanId}`),
  
  // Add place to day plan
  addPlaceToDay: (dayPlanId, placeData) => api.post(`/itinerary/${dayPlanId}/places`, placeData),
  
  // Update place in day plan
  updatePlaceInDay: (dayPlanId, placeId, placeData) => 
    api.put(`/itinerary/${dayPlanId}/places/${placeId}`, placeData),
  
  // Remove place from day plan
  removePlaceFromDay: (dayPlanId, placeId) => 
    api.delete(`/itinerary/${dayPlanId}/places/${placeId}`),
  
  // Reorder places in day plan
  reorderPlaces: (dayPlanId, newOrder) => 
    api.put(`/itinerary/${dayPlanId}/reorder`, { order: newOrder }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Helper functions for error handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 404:
        return 'Resource not found';
      case 400:
        return data.message || 'Invalid request';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.message || 'An unexpected error occurred';
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Unable to connect to server. Please check your connection.';
  } else {
    // Error in request setup
    return 'Request failed. Please try again.';
  }
};

// Data validation helpers
export const validateTripData = (tripData) => {
  const errors = {};
  
  if (!tripData.locationOfStay?.trim()) {
    errors.locationOfStay = 'Location of stay is required';
  }
  
  if (!tripData.checkInDate) {
    errors.checkInDate = 'Check-in date is required';
  }
  
  if (!tripData.checkOutDate) {
    errors.checkOutDate = 'Check-out date is required';
  }
  
  if (tripData.checkInDate && tripData.checkOutDate && 
      new Date(tripData.checkInDate) >= new Date(tripData.checkOutDate)) {
    errors.checkOutDate = 'Check-out date must be after check-in date';
  }
  
  if (!tripData.travelMode) {
    errors.travelMode = 'Travel mode is required';
  }
  
  if (tripData.numberOfPeople && tripData.numberOfPeople < 1) {
    errors.numberOfPeople = 'Number of people must be at least 1';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validatePlaceData = (placeData) => {
  const errors = {};
  
  if (!placeData.name?.trim()) {
    errors.name = 'Place name is required';
  }
  
  if (!placeData.category) {
    errors.category = 'Category is required';
  }
  
  if (placeData.estimatedDuration && placeData.estimatedDuration < 5) {
    errors.estimatedDuration = 'Estimated duration should be at least 5 minutes';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Export the default axios instance for custom requests
export default api;