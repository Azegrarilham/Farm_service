import React from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../services/auth';

interface LogoutButtonProps {
    className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await Auth.logout();
        navigate('/login');
    };

    return (
        <button
            onClick={handleLogout}
            className={`text-red-600 hover:text-red-800 ${className || ''}`}
        >
            Logout
        </button>
    );
};

export default LogoutButton;
