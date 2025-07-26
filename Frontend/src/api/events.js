import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchEvents = async () => {
  const res = await axios.get(`${API_URL}/api/events?status=approved`, {
    headers: getAuthHeader(),
  });
  return res.data.data.events;
};

export const fetchEvent = async (id) => {
  const res = await axios.get(`${API_URL}/api/events/${id}`, {
    headers: getAuthHeader(),
  });
  return res.data.data.event;
};

export const fetchEventById = async (id) => {
  const res = await axios.get(`${API_URL}/api/events/${id}`, {
    headers: getAuthHeader(),
  });
  return res.data.data.event;
};

export const createEvent = async (eventData) => {
  let hasFile = eventData.image && eventData.image instanceof File;
  let payload, headers;
  if (hasFile) {
    payload = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (key === "image" && value) {
        payload.append("image", value);
      } else {
        payload.append(key, value);
      }
    });
    headers = { ...getAuthHeader() };
  } else {
    payload = eventData;
    headers = { ...getAuthHeader(), "Content-Type": "application/json" };
  }
  const res = await axios.post(`${API_URL}/api/events`, payload, {
    headers,
  });
  return res.data.data.event;
};

export const updateEvent = async (id, eventData) => {
  let hasFile = eventData.image && eventData.image instanceof File;
  let payload, headers;
  if (hasFile) {
    payload = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (key === "image" && value) {
        payload.append("image", value);
      } else {
        payload.append(key, value);
      }
    });
    headers = { ...getAuthHeader() };
  } else {
    payload = eventData;
    headers = { ...getAuthHeader(), "Content-Type": "application/json" };
  }
  const res = await axios.put(`${API_URL}/api/events/${id}`, payload, {
    headers,
  });
  return res.data.data.event;
};

export const deleteEvent = async (id) => {
  const res = await axios.delete(`${API_URL}/api/events/${id}`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const fetchOrganizerEvents = async (organizerId) => {
  const res = await axios.get(
    `${API_URL}/api/events/organizer/${organizerId}`,
    {
      headers: getAuthHeader(),
    }
  );
  return res.data.events || res.data.data?.events || [];
};
