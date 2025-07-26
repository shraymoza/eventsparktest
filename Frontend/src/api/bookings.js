import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// Get available seats for an event
export const getAvailableSeats = async (eventId) => {
  try {
    const response = await createAuthInstance().get(
      `/api/bookings/event/${eventId}/seats`
    );
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch available seats";
  }
};

// Create a new booking
export const createBooking = async (eventId, seatNumber) => {
  try {
    const response = await createAuthInstance().post("/api/bookings/create", {
      eventId,
      seatNumber,
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to create booking";
  }
};

// Process payment for a booking
export const processPayment = async (bookingId, paymentMethod) => {
  try {
    const response = await createAuthInstance().post(
      `/api/bookings/${bookingId}/payment`,
      { paymentMethod }
    );
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Payment failed";
  }
};

// Process bulk payment for multiple bookings
export const processBulkPayment = async (bookingIds, paymentMethod) => {
  try {
    const response = await createAuthInstance().post(
      `/api/bookings/bulk-payment`,
      { bookingIds, paymentMethod }
    );
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Payment failed";
  }
};

// Get user's bookings
export const getUserBookings = async () => {
  try {
    const response = await createAuthInstance().get("/api/bookings/my");
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch bookings";
  }
};

// Get booking details
export const getBookingDetails = async (bookingId) => {
  try {
    const response = await createAuthInstance().get(
      `/api/bookings/${bookingId}`
    );
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch booking details";
  }
};

// Bulk create bookings for multiple seats
export const bulkCreateBooking = async (eventId, seatNumbers) => {
  try {
    const response = await createAuthInstance().post(
      "/api/bookings/bulk-create",
      { eventId, seatNumbers }
    );
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to reserve seats";
  }
};
