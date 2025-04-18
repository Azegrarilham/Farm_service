import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Auth from '../services/auth';

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
            // Get token from localStorage
            const token = localStorage.getItem('access_token');

            if (!token) {
                setIsAuthenticated(false);
                setIsChecking(false);
                return;
            }

            try {
                // Initialize auth service and check authentication
                const authenticated = await Auth.initialize();
                setIsAuthenticated(authenticated);
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
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Render children if authenticated
    return <>{children}</>;
};

export default ProtectedRoute;
