import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginAPI = (username) => api.post("/auth/login", { username });

export default api;
