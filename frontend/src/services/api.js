import axios from 'axios';
import { validateFrontendEnv } from '../config/validateEnv';

validateFrontendEnv();

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api');
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ отправляем/получаем cookies (refresh_token)
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getFileUrl(filePath) {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${API_ORIGIN}${filePath}`;
}

// ✅ подставляем Bearer token во все запросы
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ✅ авто-refresh при 401 и повтор запроса
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const resp = await api.post('/auth/refresh');
        setAccessToken(resp.data.accessToken);
        return api(original);
      } catch {
        clearAccessToken();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
