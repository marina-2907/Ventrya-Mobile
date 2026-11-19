
import axios from 'axios';

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
