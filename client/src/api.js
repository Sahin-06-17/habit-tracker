import axios from "axios";

const api = axios.create({
  baseURL: "https://habit-tracker-835v.onrender.com",
});

// Helper to attach token
const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getHabits = async (token) => {
  if (!token) throw new Error("No token provided to API");
  const response = await api.get("/habits", getAuthHeaders(token));
  return response.data;
};

export const createHabit = async (habitData, token) => {
  return await api.post("/habits", habitData, getAuthHeaders(token));
};

export const checkInHabit = async (habitId, token) => {
  return await api.post(`/habits/${habitId}/check`, {}, getAuthHeaders(token));
};

export const useStreakFreeze = async (habitId, token) => {
  return await api.post(`/habits/${habitId}/freeze`, {}, getAuthHeaders(token));
};

export const getUserStats = async (token) => {
    const response = await api.get("/user/stats", getAuthHeaders(token));
    return response.data;
};

export const watchAd = async (token) => {
    return await api.post("/user/watch-ad", {}, getAuthHeaders(token));
};