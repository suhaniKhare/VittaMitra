import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5050/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to dynamically inject JWT tokens
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
