import axios from 'axios';

// URL por defecto para desarrollo local
const DEV_API_URL = 'http://localhost:3001/api';

// Determinar la URL base según el entorno
// Production URL MUST be set via VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || DEV_API_URL;

// Helper para extraer data anidada del backend
export function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos para dar tiempo al backend de Render de despertar
});

// Request interceptor para agregar token y logging
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
    // Manejar timeout específicamente
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(new Error('El servidor está tardando en responder. Por favor intente nuevamente.'));
    }

    // Manejar errores de red (backend no disponible)
    if (!error.response) {
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verifique su conexión o intente más tarde.'));
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }

    // Extraer mensaje de error del backend si está disponible
    const backendMessage = error.response?.data?.error || error.response?.data?.message;
    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }

    return Promise.reject(error);
  }
);
