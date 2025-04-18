import axios from 'axios';
import { LoginCredentials } from '../types/farm';
import { storeToken } from '../utils/tokenHelper';

// Create a separate instance specifically for login
const loginAPI = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

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
                // Use improved token storage with expiry time
                // If remember is true, set a longer expiry time (7 days), otherwise 12 hours
                storeToken(
                    response.data.token,
                    credentials.remember ? 168 : 12 // 168 hours = 7 days
                );
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
