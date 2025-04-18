/**
 * Token Helper Utility
 *
 * A set of functions to handle authentication tokens more reliably
 */

// Store token with expiry time (default 12 hours)
export const storeToken = (token: string, expiryHours: number = 12): void => {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + expiryHours);

    const tokenData = {
        token,
        expires: expiryTime.getTime(),
    };

    localStorage.setItem('access_token', token);
    localStorage.setItem('token_data', JSON.stringify(tokenData));

    console.log(`Token stored with expiry in ${expiryHours} hours (${expiryTime.toLocaleString()})`);
};

// Get token, checking if it's expired
export const getToken = (): string | null => {
    try {
        // Check if we have token data with expiry
        const tokenDataString = localStorage.getItem('token_data');

        if (tokenDataString) {
            const tokenData = JSON.parse(tokenDataString);
            const now = new Date().getTime();

            // If token is expired, remove it
            if (tokenData.expires && now > tokenData.expires) {
                console.log('Token expired, removing from storage');
                removeToken();
                return null;
            }

            // Otherwise return the token
            return tokenData.token;
        }

        // Fallback to direct token access (for backward compatibility)
        return localStorage.getItem('access_token');
    } catch (error) {
        console.error('Error getting token:', error);
        return localStorage.getItem('access_token');
    }
};

// Remove token and all related data
export const removeToken = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_data');
};

// Check if token is valid
export const isTokenValid = async (): Promise<boolean> => {
    const token = getToken();

    if (!token) {
        return false;
    }

    try {
        // Try a call to the user endpoint to verify authentication
        const response = await fetch('http://localhost:8000/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`Token validation failed with status ${response.status}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
};

// Redirect to login
export const redirectToLogin = (returnPath?: string): void => {
    const redirect = returnPath || window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
};

// Handle authentication errors
export const handleAuthError = (): void => {
    removeToken();
    redirectToLogin();
};

export default {
    storeToken,
    getToken,
    removeToken,
    isTokenValid,
    redirectToLogin,
    handleAuthError
};
