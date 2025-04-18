import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Constants
const API_URL = 'http://localhost:8000';

const NewCropListings = () => {
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [organicOnly, setOrganicOnly] = useState(false);
    const [sortBy, setSortBy] = useState('date');

    // Create robust instance for API calls
    const secureApi = axios.create({
        baseURL: `${API_URL}/api`,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    });

    // Add token to all requests
    secureApi.interceptors.request.use(config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Handle auth errors
    secureApi.interceptors.response.use(
        response => response,
        error => {
            if (error.response?.status === 401) {
                console.log('Authentication error detected. Redirecting to login...');
                setError('Session expired. Please log in again.');
                localStorage.removeItem('access_token');
                setTimeout(() => {
                    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                }, 1500);
            }
            return Promise.reject(error);
        }
    );

    // Check authentication first
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    setError('Not authenticated. Please log in.');
                    setLoading(false);
                    setTimeout(() => {
                        navigate('/login');
                    }, 1500);
                    return;
                }

                // Verify token is valid
                const userResponse = await secureApi.get('/user');
                setCurrentUser(userResponse.data);
                console.log('Authentication verified. User:', userResponse.data);

                // Now load the data
                fetchCrops();
            } catch (err) {
                console.error('Authentication check failed:', err);
                setError('Authentication failed. Please log in again.');
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    // Fetch crops with robust error handling
    const fetchCrops = async () => {
        setLoading(true);
        try {
            console.log('Fetching crops...');

            // Get farms first to verify user has farms
            const farmsResponse = await secureApi.get('/farms/user');
            const farms = farmsResponse.data;

            if (!farms || farms.length === 0) {
                setError('You need to create a farm before you can sell crops.');
                setCrops([]);
                setLoading(false);
                return;
            }

            console.log(`Found ${farms.length} farms. Fetching crops...`);

            // Now get crops with cache-busting headers
            const cropsResponse = await secureApi.get('/crops/user', {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            let cropData = cropsResponse.data;

            // Ensure we have an array
            if (!Array.isArray(cropData)) {
                console.warn('Crops data is not an array:', cropData);
                if (cropData && Array.isArray(cropData.data)) {
                    cropData = cropData.data;
                } else {
                    cropData = [];
                }
            }

            console.log(`Fetched ${cropData.length} crops`);

            // Apply filters
            let filteredCrops = [...cropData];

            if (searchTerm) {
                filteredCrops = filteredCrops.filter(crop =>
                    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    crop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (crop.farm?.name && crop.farm.name.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            if (organicOnly) {
                filteredCrops = filteredCrops.filter(crop => crop.is_organic);
            }

            // Apply sorting
            switch (sortBy) {
                case 'price-low':
                    filteredCrops.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filteredCrops.sort((a, b) => b.price - a.price);
                    break;
                case 'name':
                    filteredCrops.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'date':
                default:
                    filteredCrops.sort((a, b) => {
                        const dateA = new Date(b.created_at || b.createdAt || 0);
                        const dateB = new Date(a.created_at || a.createdAt || 0);
                        return dateA.getTime() - dateB.getTime();
                    });
                    break;
            }

            setCrops(filteredCrops);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching crops:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to load crops. Please try again.'
            );
            setCrops([]);
        } finally {
            setLoading(false);
        }
    };

    // Force refresh current data
    const handleRefresh = () => {
        fetchCrops();
    };

    // Navigate to add new crop
    const handleAddListing = () => {
        navigate('/sell-crops/add');
    };

    // Navigate to edit crop
    const handleEditListing = (id: number) => {
        navigate(`/sell-crops/${id}/edit`);
    };

    // Check if current user owns the crop
    const isOwner = (crop: any) => {
        return currentUser && crop.farm && crop.farm.user_id === currentUser.id;
    };

    // Debug function to check auth status
    const checkAuthStatus = async () => {
        try {
            setError('Checking authentication status...');
            const token = localStorage.getItem('access_token');

            if (!token) {
                setError('No token found');
                return;
            }

            const response = await fetch(`${API_URL}/api/debug/auth`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.authenticated) {
                setError(`Authenticated as ${data.user.name}. You have ${data.farms.count} farms with ${data.crops.count} crops.`);
            } else {
                setError(`Not authenticated: ${data.error || 'Unknown error'}`);

                // Offer to refresh token
                if (confirm('Authentication failed. Would you like to log in again?')) {
                    localStorage.removeItem('access_token');
                    navigate('/login');
                }
            }
        } catch (err: any) {
            setError(`Auth check error: ${err.message}`);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Your Crop Listings</h1>
                <div className="space-x-2 flex">
                    <button
                        onClick={handleRefresh}
                        className="btn btn-secondary flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        onClick={handleAddListing}
                        className="btn btn-primary flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Add New Crop
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            id="search"
                            placeholder="Search crops, farms..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            id="sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="form-input"
                        >
                            <option value="date">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name">Name</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={organicOnly}
                                onChange={(e) => setOrganicOnly(e.target.checked)}
                                className="h-4 w-4 text-farm-green-600 focus:ring-farm-green-500 border-gray-300 rounded mr-2"
                            />
                            <span className="text-sm text-gray-700">Organic Only</span>
                        </label>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
                </div>
            ) : crops.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h2 className="text-xl font-medium text-gray-900 mb-2">You don't have any crop listings yet</h2>
                    <p className="text-gray-500 mb-6">Click "Add New Crop" to list your crops for sale</p>

                    <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">Important</h3>
                        <p className="text-yellow-700 mb-4">
                            To sell crops, you need to have at least one farm registered. You can add a farm first, then add crops to it.
                        </p>
                        <button
                            onClick={() => navigate('/farms/add')}
                            className="btn btn-warning"
                        >
                            Create a Farm First
                        </button>
                    </div>

                    <div className="text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded">
                        <p>Debug info: User ID: {currentUser?.id || 'Not logged in'}</p>
                        <div className="mt-3 space-x-2">
                            <button
                                onClick={checkAuthStatus}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs"
                            >
                                Check Auth Status
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {crops.map((crop: any) => (
                        <div key={crop.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="h-48 bg-gray-200 relative">
                                <img
                                    src={crop.images && crop.images.length > 0
                                        ? `/storage/${crop.images[0]}`
                                        : 'https://via.placeholder.com/300x200?text=No+Image'}
                                    alt={crop.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                    }}
                                />
                                {crop.is_organic && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                        Organic
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-medium text-gray-900">{crop.name}</h3>
                                    <span className="text-xl font-bold text-farm-green-600">${crop.price.toFixed(2)}<span className="text-sm font-normal text-gray-500">/{crop.unit}</span></span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{crop.description}</p>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    {crop.farm?.name || 'Unknown Farm'}
                                </div>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    Available: {crop.quantity} {crop.unit}
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <button
                                        onClick={() => navigate(`/sell-crops/${crop.id}`)}
                                        className="btn btn-outline btn-sm"
                                    >
                                        View Details
                                    </button>

                                    {isOwner(crop) ? (
                                        <button
                                            onClick={() => handleEditListing(crop.id)}
                                            className="btn btn-sm btn-primary"
                                        >
                                            Edit Crop Listing
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/sell-crops/${crop.id}`)}
                                            className="btn btn-sm btn-outline"
                                        >
                                            View More
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewCropListings;
