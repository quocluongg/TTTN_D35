import axios from "axios";
import Cookies from "js-cookie";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api",
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return Promise.reject(error.response?.data || error);
  }
);

export default http;
