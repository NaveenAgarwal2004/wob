import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// SWR fetcher
export const fetcher = (url: string) => api.get(url).then(res => res.data);

// API functions
export const navigationAPI = {
  getAll: () => api.get('/navigations'),
  getById: (id: string) => api.get(`/navigations/${id}`),
  scrape: (id: string) => api.post(`/navigations/${id}/scrape`),
};

export const categoryAPI = {
  getByNavigation: (navigationId: string) => api.get(`/categories/navigation/${navigationId}`),
  getById: (id: string) => api.get(`/categories/${id}`),
  scrape: (id: string) => api.post(`/categories/${id}/scrape`),
};

export const productAPI = {
  getByCategory: (categoryId: string, page = 1, limit = 20) =>
    api.get(`/products/category/${categoryId}?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get(`/products/${id}`),
  scrape: (id: string) => api.post(`/products/${id}/scrape`),
};
