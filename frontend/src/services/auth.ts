import { AuthService } from './api';
import { AuthUser } from '../types/farm';

class AuthManager {
    private user: AuthUser | null = null;
    private isAuthenticated: boolean = false;
    private loading: boolean = false;
    private initialized: boolean = false;

    /**
     * Initialize the authentication state
     * This should only be called from protected routes
     */
    async initialize(): Promise<boolean> {
        // Don't initialize multiple times
        if (this.initialized) {
            return this.isAuthenticated;
        }

        // Skip initialization on auth pages
        const path = window.location.pathname;
        if (path === '/login' || path === '/register' || path === '/forgot-password') {
            return false;
        }

        this.loading = true;
        this.initialized = true;

        try {
            // If token exists, try to get user info
            const token = localStorage.getItem('access_token');

            if (token) {
                const user = await AuthService.getUser();
                this.user = user;
                this.isAuthenticated = true;
                return true;
            }
        } catch (error) {
            console.error('Authentication check failed', error);
            this.cleanupAuth();
        } finally {
            this.loading = false;
        }

        return false;
    }

    /**
     * Login the user
     * This should not be used directly in login page
     * Use LoginService instead
     */
    async login(email: string, password: string, remember: boolean = false): Promise<boolean> {
        try {
            const response = await AuthService.login({ email, password, remember });
            this.user = response.user;
            this.isAuthenticated = true;
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    }

    /**
     * Register a new user
     */
    async register(name: string, email: string, password: string, passwordConfirmation: string): Promise<boolean> {
        try {
            const response = await AuthService.register({
                name,
                email,
                password,
                passwordConfirmation
            });
            this.user = response.user;
            this.isAuthenticated = true;
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Registration failed', error);
            return false;
        }
    }

    /**
     * Logout the user
     */
    async logout(): Promise<void> {
        try {
            // Only call the logout API if user is authenticated
            if (this.isAuthenticated) {
                await AuthService.logout();
            }
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            this.cleanupAuth();
        }
    }

    /**
     * Clean up authentication state without API call
     */
    private cleanupAuth(): void {
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('access_token');
    }

    /**
     * Get the current user
     */
    getUser(): AuthUser | null {
        return this.user;
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Check if authentication is still loading
     */
    isLoading(): boolean {
        return this.loading;
    }
}

// Create a singleton instance
const Auth = new AuthManager();

export default Auth;
