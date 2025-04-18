import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Auth from '../services/auth';
import { getToken, isTokenValid, redirectToLogin } from '../utils/tokenHelper';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    redirectTo = '/login'
}) => {
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            // Get token and check if it's valid
            const token = getToken();

            if (!token) {
                console.log('No token found in ProtectedRoute');
                setIsAuthenticated(false);
                setIsChecking(false);
                return;
            }

            try {
                // First use the faster token validation method
                const tokenValid = await isTokenValid();

                if (!tokenValid) {
                    console.log('Token validation failed, trying Auth.initialize fallback');
                    // Fall back to Auth.initialize for backward compatibility
                    const authenticated = await Auth.initialize();
                    setIsAuthenticated(authenticated);
                } else {
                    console.log('Token validation succeeded');
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, []);

    // Show loading state while checking authentication
    if (isChecking) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        // Add the current path as a redirect parameter
        const loginPath = `${redirectTo}?redirect=${encodeURIComponent(location.pathname)}`;
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // Render children if authenticated
    return <>{children}</>;
};

export default ProtectedRoute;
