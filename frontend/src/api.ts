const isProd = import.meta.env.PROD;

export const API_BASE_URL = isProd
  ? import.meta.env.VITE_API_BASE_URL
  : `${window.location.protocol}//${window.location.hostname}:8080`;