import axios from "axios";

// Create a global Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
});

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Automatically handle 401 Unauthorized across the entire app
        if (error.response && error.response.status === 401) {
            console.warn("Unauthorized! Redirecting to login...");
            // Instead of doing this manually in every component, we do it here.
            // If we are not already on login, redirect.
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
