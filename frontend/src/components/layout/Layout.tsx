import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../../services/api';
import { AuthUser } from '../../types/farm';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await AuthService.getUser();
                setUser(userData);
            } catch (error) {
                // If user data can't be fetched, user is likely not logged in
                if (
                    !location.pathname.includes('/login') &&
                    !location.pathname.includes('/register') &&
                    !location.pathname.includes('/forgot-password') &&
                    !location.pathname.includes('/reset-password')
                ) {
                    navigate('/login');
                }
            }
        };

        fetchUser();
    }, [navigate, location.pathname]);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await AuthService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Check if we're on an auth page
    const isAuthPage =
        location.pathname.includes('/login') ||
        location.pathname.includes('/register') ||
        location.pathname.includes('/forgot-password') ||
        location.pathname.includes('/reset-password');

    if (isAuthPage) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-white shadow-sm py-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center">
                            <Link to="/" className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-farm-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span className="ml-2 text-xl font-bold text-gray-900">Farm Manager</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex items-center justify-center p-4">
                    {children}
                </main>

                <footer className="bg-white py-4 border-t">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-gray-500 text-sm">
                            © {new Date().getFullYear()} Farm Manager. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/" className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-farm-green-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">Farm Manager</span>
                                </Link>
                            </div>

                            {/* Desktop navigation */}
                            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    to="/dashboard"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${location.pathname === '/dashboard' ? 'border-farm-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/farms"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${location.pathname.includes('/farms') ? 'border-farm-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                                >
                                    Farms
                                </Link>
                                <Link
                                    to="/supplies"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${location.pathname.includes('/supplies') ? 'border-farm-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                                >
                                    Products
                                </Link>
                                <Link
                                    to="/sell-crops"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${location.pathname.includes('/sell-crops') ? 'border-farm-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                                >
                                    Sell Crops
                                </Link>
                                <Link
                                    to="/crop-troubleshooter"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${location.pathname.includes('/crop-troubleshooter') ? 'border-farm-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                                >
                                    Crop Troubleshooter
                                </Link>
                            </nav>
                        </div>

                        {/* Profile dropdown */}
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center space-x-2 text-sm focus:outline-none"
                                >
                                    {user?.profilePicture ? (
                                        <img
                                            className="h-8 w-8 rounded-full object-cover"
                                            src={user.profilePicture}
                                            alt={user.name}
                                        />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-farm-green-100 flex items-center justify-center">
                                            <span className="text-farm-green-800 font-medium text-sm">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <span>{user?.name}</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'transform rotate-180' : ''}`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Your Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="sm:hidden">
                        <div className="pt-2 pb-3 space-y-1">
                            <Link
                                to="/dashboard"
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${location.pathname === '/dashboard' ? 'border-farm-green-500 text-farm-green-700 bg-farm-green-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/farms"
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${location.pathname.includes('/farms') ? 'border-farm-green-500 text-farm-green-700 bg-farm-green-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            >
                                Farms
                            </Link>
                            <Link
                                to="/supplies"
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${location.pathname.includes('/supplies') ? 'border-farm-green-500 text-farm-green-700 bg-farm-green-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            >
                                Products
                            </Link>
                            <Link
                                to="/sell-crops"
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${location.pathname.includes('/sell-crops') ? 'border-farm-green-500 text-farm-green-700 bg-farm-green-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            >
                                Sell Crops
                            </Link>
                            <Link
                                to="/crop-troubleshooter"
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${location.pathname.includes('/crop-troubleshooter') ? 'border-farm-green-500 text-farm-green-700 bg-farm-green-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            >
                                Crop Troubleshooter
                            </Link>
                        </div>

                        <div className="pt-4 pb-3 border-t border-gray-200">
                            <div className="flex items-center px-4">
                                {user?.profilePicture ? (
                                    <img
                                        className="h-10 w-10 rounded-full object-cover"
                                        src={user.profilePicture}
                                        alt={user.name}
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-farm-green-100 flex items-center justify-center">
                                        <span className="text-farm-green-800 font-medium">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">{user?.name}</div>
                                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Your Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            <footer className="bg-white py-4 border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-500 text-sm">
                        © {new Date().getFullYear()} Farm Manager. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
