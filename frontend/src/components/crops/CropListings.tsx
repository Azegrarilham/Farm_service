import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService, CropService, FarmService } from '../../services/api';

const CropListings = () => {
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [organicOnly, setOrganicOnly] = useState(false);
    const [sortBy, setSortBy] = useState('date');
    const [refreshFlag, setRefreshFlag] = useState(Date.now());

    // Utility
    const [showUtility, setShowUtility] = useState(false);
    const [availableFarms, setAvailableFarms] = useState([]);
    const [associating, setAssociating] = useState(false);
    const [associationMessage, setAssociationMessage] = useState(null);

    // Debug: Log component state on each render
    console.log('CropListings render state:', {
        cropCount: crops.length,
        loading,
        error,
        hasCurrentUser: !!currentUser,
        currentUserId: currentUser?.id,
        refreshFlag
    });

    // For debugging: forcefully trigger refresh
    const forceRefresh = () => {
        console.log('Manually forcing refresh of crop data');
        setRefreshFlag(Date.now());
    };

    // Debug function to check user auth and data
    const checkUserAuthAndData = async () => {
        console.log('Checking user authentication and data');
        try {
            // 1. Check current user
            const userData = await AuthService.getUser();
            console.log('Current user:', userData);

            // 2. Check user farms
            const farmsData = await FarmService.getUserFarms();
            console.log('User farms:', farmsData);

            // 3. If user has farms, check their crops
            if (farmsData.length > 0) {
                console.log(`User has ${farmsData.length} farms. Checking crops...`);
                // This will log the crops returned from API
                await CropService.getUserCrops();

                // Set a note about detected farms
                setError(`Debug: Found ${farmsData.length} farms for user ${userData.id}, but no crops were returned from the API. This might be a data association issue.`);
            } else {
                setError(`Debug: User ${userData.id} has no farms registered. Create a farm first.`);
            }
        } catch (err) {
            console.error('Error checking user data:', err);
            setError('Debug: Failed to check user data. See console for details.');
        }
    };

    // Debug function to load all farms for potential association
    const loadAllFarms = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/debug/all-farms');
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('All farms in system:', data);
            setAvailableFarms(data);
            setShowUtility(true);
        } catch (err) {
            console.error('Error loading all farms:', err);
            setError('Failed to load farms. See console for details.');
        }
    };

    // Function to associate a farm with the current user
    const associateFarm = async (farmId) => {
        try {
            setAssociating(true);
            setAssociationMessage(null);

            const response = await fetch(`http://localhost:8000/api/debug/fix-farm-association/${farmId}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Association result:', data);

            setAssociationMessage({
                type: 'success',
                text: `Successfully associated farm "${data.farm.name}" with your account. ${data.crops_count} crops are now available.`
            });

            // Refresh the crop list
            setTimeout(() => {
                setRefreshFlag(Date.now());
                setShowUtility(false);
            }, 2000);

        } catch (err) {
            console.error('Error associating farm:', err);
            setAssociationMessage({
                type: 'error',
                text: `Failed to associate farm: ${err.message}`
            });
        } finally {
            setAssociating(false);
        }
    };

    // Debug function to directly check server auth status
    const checkServerAuth = async () => {
        try {
            setError('Running auth diagnostics...');
            const token = localStorage.getItem('access_token');

            if (!token) {
                setError('No authentication token found in localStorage');
                return;
            }

            // First try the debug endpoint
            try {
                const response = await fetch('http://localhost:8000/api/debug/auth', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();
                console.log('Debug auth endpoint response:', data);

                if (data.authenticated) {
                    setError(`Server reports you are: User #${data.user.id} (${data.user.name}). You have ${data.farms.count} farms with ${data.crops.count} crops.`);

                    // If farms exist but no crops, check specific farms
                    if (data.farms.count > 0 && data.crops.count === 0) {
                        setError(prev => `${prev} Farms exist but no crops found. This may be a data association issue.`);

                        // DEBUG: Add farm-crop check to help diagnose the issue
                        try {
                            const farmsResponse = await fetch('http://localhost:8000/api/farms/user', {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': 'application/json'
                                }
                            });

                            if (farmsResponse.ok) {
                                const farmsData = await farmsResponse.json();
                                if (Array.isArray(farmsData) && farmsData.length > 0) {
                                    // We have farms, so check if we have crop records
                                    setError(prev => `${prev} DEBUG: Found ${farmsData.length} farms.`);

                                    // Try to create a test crop if needed
                                    setShowUtility(true);
                                }
                            }
                        } catch (e) {
                            console.error('Error checking farms:', e);
                        }
                    }
                } else {
                    setError(`Server says you are NOT authenticated. ${data.tip || 'Make sure you\'re logged in and sending the correct token.'}`);

                    // Force re-login if authentication failed
                    localStorage.removeItem('access_token');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 3000);
                }
            } catch (err) {
                console.error('Error checking debug auth endpoint:', err);
                setError('Failed to check auth status with debug endpoint. Trying raw API endpoints...');

                // If debug endpoint fails, try the regular user endpoint
                try {
                    const userResponse = await fetch('http://localhost:8000/api/user', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });

                    if (!userResponse.ok) {
                        throw new Error(`Server returned ${userResponse.status}: ${userResponse.statusText}`);
                    }

                    const userData = await userResponse.json();
                    console.log('User API response:', userData);

                    setError(`API reports you are: User #${userData.id} (${userData.name})`);

                    // Now check farms
                    const farmsResponse = await fetch('http://localhost:8000/api/farms/user', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });

                    if (!farmsResponse.ok) {
                        throw new Error(`Farms API returned ${farmsResponse.status}`);
                    }

                    const farmsData = await farmsResponse.json();
                    console.log('Farms API response:', farmsData);

                    if (Array.isArray(farmsData) && farmsData.length > 0) {
                        setError(prev => `${prev}. You have ${farmsData.length} farms.`);

                        // Check crops directly
                        const cropsResponse = await fetch('http://localhost:8000/api/crops/user', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json',
                                'Cache-Control': 'no-cache, no-store',
                                'Pragma': 'no-cache'
                            }
                        });

                        if (!cropsResponse.ok) {
                            console.error(`Crops API error: ${cropsResponse.status} - ${cropsResponse.statusText}`);
                            const errorText = await cropsResponse.text();
                            console.error('Error details:', errorText);
                            setError(prev => `${prev} Error accessing crops: ${cropsResponse.status}`);
                        } else {
                            const cropsData = await cropsResponse.text();
                            console.log('Raw crops response:', cropsData);

                            try {
                                const parsedCrops = JSON.parse(cropsData);
                                if (Array.isArray(parsedCrops)) {
                                    setError(prev => `${prev} API reports ${parsedCrops.length} crops.`);
                                } else {
                                    setError(prev => `${prev} API returned non-array crops data: ${typeof parsedCrops}`);
                                }
                            } catch (e) {
                                setError(prev => `${prev} Could not parse crops response as JSON.`);
                            }
                        }
                    } else {
                        setError(prev => `${prev}. No farms found for your account.`);
                    }
                } catch (apiErr) {
                    console.error('Error checking API endpoints:', apiErr);
                    setError(`Authentication diagnostic failed: ${apiErr.message}`);
                }
            }
        } catch (err) {
            console.error('Main error in auth diagnostics:', err);
            setError(`Main auth diagnostic error: ${err.message}`);
        }
    };

    // Ultra force refresh - direct fetch approach
    const ultraForceRefresh = async () => {
        try {
            setLoading(true);
            setError('Performing ultra force refresh...');

            // Step 1: Get current auth token
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('No authentication token found for refresh');
                setLoading(false);
                return;
            }

            // Step 2: Get user details to confirm auth
            const userResp = await fetch('http://localhost:8000/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!userResp.ok) {
                setError(`User authentication failed: ${userResp.status}`);
                setLoading(false);
                return;
            }

            const userData = await userResp.json();
            console.log('User check success:', userData);

            // Step 3: Direct fetch from crops/user endpoint
            const cropsResp = await fetch('http://localhost:8000/api/crops/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!cropsResp.ok) {
                console.error(`Crops API error: ${cropsResp.status} - ${cropsResp.statusText}`);
                const errorText = await cropsResp.text();
                console.error('Error details:', errorText);
                setError(`Failed to fetch crops: ${cropsResp.status} ${cropsResp.statusText}`);
                setLoading(false);
                return;
            }

            const cropsData = await cropsResp.text();
            console.log('Ultra refresh - Raw crops response:', cropsData);

            let cropsDataParsed = [];
            try {
                // Try to parse, but handle empty responses
                if (cropsData && cropsData.trim()) {
                    cropsDataParsed = JSON.parse(cropsData);
                    if (!Array.isArray(cropsDataParsed)) {
                        console.error('Crops data is not an array:', cropsDataParsed);
                        cropsDataParsed = Array.isArray(cropsDataParsed.data) ? cropsDataParsed.data : [];
                    }
                }
            } catch (e) {
                console.error('Error parsing crops response:', e);
                setError(`Failed to parse crops data: ${e.message}`);
                setLoading(false);
                return;
            }

            console.log('Ultra refresh - Parsed crops data:', cropsDataParsed);

            // Update state with directly fetched data
            setCrops(cropsDataParsed);
            setError(cropsDataParsed.length === 0
                ? `Ultra refresh complete - No crops found (User ID: ${userData.id})`
                : `Ultra refresh complete - Found ${cropsDataParsed.length} crops`);

        } catch (err) {
            console.error('Error in ultra force refresh:', err);
            setError(`Ultra refresh error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get user data to ensure we're authenticated
                const userData = await AuthService.getUser();
                setCurrentUser(userData);

                // Check if token is valid and working
                const token = localStorage.getItem('access_token');
                if (!token || !userData) {
                    setError('No valid authentication token found. Please log in again.');
                    navigate('/login');
                    return;
                }

                console.log('Current user data:', userData);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Authentication error. Please log in again.');
                localStorage.removeItem('access_token');
                navigate('/login');
            }
        };

        fetchUserData();

        // Listen for the refresh event
        const handleRefreshEvent = () => {
            console.log('Refresh crops event received');
            setRefreshFlag(Date.now());
        };

        window.addEventListener('refreshCrops', handleRefreshEvent);

        // Check for timestamp in localStorage
        const storedTimestamp = localStorage.getItem('crops_refresh_timestamp');
        if (storedTimestamp) {
            const timestamp = parseInt(storedTimestamp);
            const currentTimestamp = Date.now();
            const timeDiff = currentTimestamp - timestamp;

            // If timestamp is recent (less than 5 seconds old), trigger refresh
            if (timeDiff < 5000) {
                console.log('Recent crops_refresh_timestamp found, refreshing data');
                setRefreshFlag(currentTimestamp);
                // Clear the timestamp
                localStorage.removeItem('crops_refresh_timestamp');
            }
        }

        return () => {
            // Clean up event listener
            window.removeEventListener('refreshCrops', handleRefreshEvent);
        };
    }, [navigate]);

    useEffect(() => {
        const fetchCrops = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('Attempting to fetch user crops...');
                // Fetch only the current user's crops from the API
                const cropData = await CropService.getUserCrops();
                console.log('Raw crop data returned:', cropData);

                // Check if we actually got an array
                if (!Array.isArray(cropData)) {
                    console.error('Expected array but got:', typeof cropData, cropData);
                    setCrops([]);
                    setError('Received invalid data format from server');
                    return;
                }

                console.log('Fetched user crops:', cropData, 'Length:', cropData.length);

                if (cropData && cropData.length > 0) {
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

                    console.log('Setting filtered crops:', filteredCrops.length);
                    setCrops(filteredCrops);
                } else {
                    // If API returns empty, show empty state
                    console.log('No crops found or empty array returned');
                    setCrops([]);
                }
            } catch (err) {
                console.error('Error fetching crops:', err);
                setError('Failed to load your crop listings. Please try again.');
                setCrops([]);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch crops when we have a current user
        if (currentUser) {
            console.log('Current user found, fetching crops:', currentUser.id);
            fetchCrops();
        } else {
            console.log('No current user, not fetching crops');
        }
    }, [searchTerm, organicOnly, sortBy, currentUser, refreshFlag]);

    const handleAddListing = () => {
        navigate('/sell-crops/add');
    };

    const handleEditListing = (id: number) => {
        navigate(`/sell-crops/${id}/edit`);
    };

    // Check if the current user is the seller of the crop
    const isOwner = (crop) => {
        return currentUser && crop.farm && crop.farm.user_id === currentUser.id;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Utility Panel for Farm Association */}
            {showUtility && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Fix Farm Association</h3>
                            <button
                                onClick={() => setShowUtility(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="mb-4 text-sm text-gray-700">
                            This utility allows you to associate existing farms with your account for testing.
                            In a production environment, you would need to create your own farms.
                        </p>

                        {associationMessage && (
                            <div className={`p-3 rounded mb-4 ${associationMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {associationMessage.text}
                            </div>
                        )}

                        <div className="divide-y">
                            {availableFarms.map(farm => (
                                <div key={farm.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{farm.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Owner: User #{farm.user_id}
                                            {currentUser && farm.user_id === currentUser.id && ' (You)'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => associateFarm(farm.id)}
                                        disabled={associating || (currentUser && farm.user_id === currentUser.id)}
                                        className={`btn btn-sm ${currentUser && farm.user_id === currentUser.id ? 'btn-disabled' : 'btn-primary'}`}
                                    >
                                        {currentUser && farm.user_id === currentUser.id ? 'Already Yours' : 'Associate'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Your Crop Listings</h1>
                <div className="space-x-2 flex">
                    <button
                        onClick={forceRefresh}
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
                        <p>Last refresh: {new Date(refreshFlag).toLocaleTimeString()}</p>
                        {error && <p className="text-red-500">{error}</p>}
                        <div className="mt-3 space-x-2">
                            <button
                                onClick={checkUserAuthAndData}
                                className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-xs"
                            >
                                Run Diagnostic
                            </button>
                            <button
                                onClick={loadAllFarms}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                                Fix Farm Association
                            </button>
                            <button
                                onClick={checkServerAuth}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs"
                            >
                                Check Auth Status
                            </button>
                            <button
                                onClick={ultraForceRefresh}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs"
                            >
                                Ultra Refresh
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {crops.map(crop => (
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

export default CropListings;
