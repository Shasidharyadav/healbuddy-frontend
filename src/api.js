import axios from 'axios';

// Create an Axios instance with the base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // Fallback to localhost if the env variable is missing
});

// Add a request interceptor to include authorization headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle errors globally
        console.error('API Error:', error.response);
        return Promise.reject(error);
    }
);

export default api;
