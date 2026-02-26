import axios from 'axios';

// URL por defecto para desarrollo local
const DEV_API_URL = 'http://localhost:3001/api';

// URL de producción (Render)
const PROD_API_URL = 'https://pachanga-api.onrender.com/api';

// Determinar la URL base según el entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? PROD_API_URL : DEV_API_URL);

// Helper para extraer data anidada del backend
export function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor para agregar token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para manejar errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
