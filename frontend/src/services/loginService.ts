import axios from 'axios';
import { LoginCredentials } from '../types/farm';

// Create a separate instance specifically for login
const loginAPI = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Helper to store the token
export const storeToken = (token: string): void => {
    localStorage.setItem('access_token', token);
};

/**
 * Login service specifically for login page
 * This is separate from the main auth service to avoid circular dependencies
 */
export const LoginService = {
    login: async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            console.log('Attempting login with:', { email: credentials.email, remember: credentials.remember });
            const response = await loginAPI.post('/api/login', credentials);
            console.log('Login response:', response);

            if (response.data && response.data.token) {
                // Store token for future requests
                storeToken(response.data.token);
                return true;
            } else {
                console.warn('Login response missing token:', response.data);
                return false;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Login error details:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            } else {
                console.error('Login failed with non-Axios error:', error);
            }
            return false;
        }
    }
};
