import axios from 'axios';

// Forcer l'URL de Render avec /api
const API_URL = 'https://andremed-backend.onrender.com/api';
console.log('🔧 API_URL utilisée:', API_URL);

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default api;