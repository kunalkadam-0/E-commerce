// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Your backend URL

const getToken = () => localStorage.getItem('token');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json', // Default for most API calls
    },
});

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ LOGIN
export const loginUser = (email, password) => {
    return api.post('/users/login', { email, password });
};

// ✅ DASHBOARD
export const getDashboardData = () => {
    return api.get('/dashboard');
};

// ✅ CATEGORIES
export const getCategories = () => {
    return api.get('/categories');
};

// ✅ PRODUCTS
export const getProducts = (categoryId = '') => {
    return api.get(`/products${categoryId ? `?category_id=${categoryId}` : ''}`);
};

export const getProductById = (productId) => {
    return api.get(`/products/${productId}`);
};

export const addProduct = (formData) => {
    return axios.post(`${API_BASE_URL}/products`, formData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
};

// --- UPDATED: updateProduct FUNCTION to handle FormData ---
export const updateProduct = (productId, formData) => {
    return axios.put(`${API_BASE_URL}/products/${productId}`, formData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            // Axios automatically sets 'Content-Type': 'multipart/form-data' when FormData is used.
        },
    });
};
// --- END UPDATED updateProduct FUNCTION ---

export const deleteProduct = (productId) => {
    return api.delete(`/products/${productId}`);
};


// ✅ Get all users (admin only)
export const getAllUsers = () => {
  return api.get('/users'); // This hits your backend GET /api/users route
};

// ✅ Update a user’s role (admin only)
export const updateUserRole = (userId, newRole) => {
  return api.put(`/users/${userId}/role`, { role: newRole });
};


// FIX: Corrected the API call to use the 'api' instance with the correct relative path
export const updateProductPopularity = (productId, isPopular) => {
  return api.put(`/products/${productId}/toggle-popular`, { is_popular: isPopular });
};


// ✅ NEW: Delete a user (admin only)
export const deleteUser = (userId) => {
    return api.delete(`/users/${userId}`); // This hits your backend DELETE /api/users/:user_id route
};