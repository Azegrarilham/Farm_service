import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getToken } from '../../services/api';

/**
 * Crop Troubleshooter Component
 *
 * This component helps diagnose and fix issues with crops in the system
 */
const CropTroubleshooter = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [needsLogin, setNeedsLogin] = useState(false);

    // Check if token exists at component load
    useEffect(() => {
        const token = getToken();
        if (!token) {
            setError('Authentication required. Please log in to use the troubleshooter.');
            setNeedsLogin(true);
        }
    }, []);

    // Handle redirect to login
    const handleLogin = () => {
        const returnUrl = encodeURIComponent(window.location.pathname);
        navigate(`/login?redirect=${returnUrl}`);
    };

    // Run diagnostics
    const runDiagnostics = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Running crop diagnostics on endpoint: /debug/crops');

            // Using the configured API instance which already has the token in headers
            const response = await api.get('/debug/crops');

            console.log('Crop diagnostics API call successful:', {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });

            setResults(response.data);
            console.log('Crop diagnostics results:', response.data);
        } catch (err: any) {
            console.error('Diagnostics error:', err);

            // Detailed error logging
            if (err.response) {
                console.error('Response error data:', {
                    status: err.response.status,
                    data: err.response.data,
                    headers: err.response.headers
                });

                // Show specific API error message if available
                if (err.response.data?.error) {
                    setError(`API Error: ${err.response.data.error}`);
                    return;
                }

                if (err.response.data?.message) {
                    setError(`Error: ${err.response.data.message}`);
                    return;
                }

                // Show status code error if no specific message
                setError(`Server responded with status ${err.response.status}`);
            } else if (err.request) {
                // Network error - no response received
                console.error('Request sent but no response received:', err.request);
                setError('Network error: No response received from server');
            } else {
                // Something else went wrong
                setError(`Error: ${err.message || 'Unknown error occurred'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Try to fix a specific crop
    const fixCrop = async (cropId: number) => {
        if (!window.confirm('Are you sure you want to attempt to fix this crop?')) {
            return;
        }

        setLoading(true);
        try {
            // Create a payload to try to update the crop to fix it
            const payload = new FormData();
            payload.append('_method', 'PUT');

            // Get the crop's details first
            const cropResponse = await api.get(`/crops/${cropId}`);
            const crop = cropResponse.data;

            // Add minimal required fields
            payload.append('name', crop.name || 'Fixed Crop');
            payload.append('description', crop.description || 'This crop was fixed by the troubleshooter');
            payload.append('quantity', String(crop.quantity || 1));
            payload.append('unit', crop.unit || 'kg');
            payload.append('price', String(crop.price || 1));
            payload.append('farm_id', String(crop.farm_id));

            // Attempt to update the crop
            const response = await api.post(`/crops/${cropId}`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Fix attempt response:', response.data);
            alert('Crop fixed successfully!');

            // Refresh diagnostics
            runDiagnostics();
        } catch (err: any) {
            console.error('Fix error:', err);
            alert('Failed to fix crop: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Crop Troubleshooter</h2>

            {needsLogin ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
                    <p className="mb-3">{error}</p>
                    <button
                        onClick={handleLogin}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                        Go to Login
                    </button>
                </div>
            ) : (
                <div className="mb-4">
                    <button
                        onClick={runDiagnostics}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {loading ? 'Running...' : 'Run Diagnostics'}
                    </button>
                </div>
            )}

            {error && !needsLogin && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
                    {error}
                </div>
            )}

            {results && (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded">
                        <h3 className="font-medium mb-2">Diagnostics Summary</h3>
                        <p>User: {results.diagnostics.user_email} (ID: {results.diagnostics.user_id})</p>
                        <p>Timestamp: {results.diagnostics.timestamp}</p>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                            <div className="bg-white p-2 rounded shadow text-center">
                                <div className="text-lg font-bold">{results.counts.total_crops}</div>
                                <div className="text-xs text-gray-500">Total Crops</div>
                            </div>
                            <div className="bg-white p-2 rounded shadow text-center">
                                <div className="text-lg font-bold">{results.counts.total_farms}</div>
                                <div className="text-xs text-gray-500">Total Farms</div>
                            </div>
                            <div className="bg-white p-2 rounded shadow text-center">
                                <div className="text-lg font-bold">{results.counts.user_farms}</div>
                                <div className="text-xs text-gray-500">Your Farms</div>
                            </div>
                            <div className="bg-white p-2 rounded shadow text-center">
                                <div className="text-lg font-bold">{results.counts.user_crops}</div>
                                <div className="text-xs text-gray-500">Your Crops</div>
                            </div>
                            <div className="bg-white p-2 rounded shadow text-center">
                                <div className={`text-lg font-bold ${results.counts.orphaned_crops > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {results.counts.orphaned_crops}
                                </div>
                                <div className="text-xs text-gray-500">Orphaned Crops</div>
                            </div>
                        </div>
                    </div>

                    {results.counts.user_farms > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Your Farms</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-600 text-xs">
                                            <th className="py-2 px-3 text-left">ID</th>
                                            <th className="py-2 px-3 text-left">Name</th>
                                            <th className="py-2 px-3 text-left">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 text-sm">
                                        {results.user_farms.map((farm: any) => (
                                            <tr key={farm.id} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-3">{farm.id}</td>
                                                <td className="py-2 px-3">{farm.name}</td>
                                                <td className="py-2 px-3">{farm.location}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {results.counts.user_crops > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Your Crops</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-600 text-xs">
                                            <th className="py-2 px-3 text-left">ID</th>
                                            <th className="py-2 px-3 text-left">Name</th>
                                            <th className="py-2 px-3 text-left">Farm</th>
                                            <th className="py-2 px-3 text-right">Price</th>
                                            <th className="py-2 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 text-sm">
                                        {results.user_crops.map((crop: any) => (
                                            <tr key={crop.id} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-3">{crop.id}</td>
                                                <td className="py-2 px-3">{crop.name}</td>
                                                <td className="py-2 px-3">{crop.farm?.name || `Farm #${crop.farm_id}`}</td>
                                                <td className="py-2 px-3 text-right">${crop.price}</td>
                                                <td className="py-2 px-3 text-right">
                                                    <button
                                                        onClick={() => fixCrop(crop.id)}
                                                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                                                    >
                                                        Fix
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {results.counts.orphaned_crops > 0 && (
                        <div>
                            <h3 className="font-medium mb-2 text-red-600">Orphaned Crops (Problem Detected)</h3>
                            <div className="bg-red-50 p-3 mb-3 text-sm">
                                These crops reference non-existent farms and cannot be displayed.
                                They need to be fixed or deleted.
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-600 text-xs">
                                            <th className="py-2 px-3 text-left">ID</th>
                                            <th className="py-2 px-3 text-left">Name</th>
                                            <th className="py-2 px-3 text-left">Invalid Farm ID</th>
                                            <th className="py-2 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 text-sm">
                                        {results.orphaned_crops.map((crop: any) => (
                                            <tr key={crop.id} className="border-b hover:bg-gray-50 bg-red-50">
                                                <td className="py-2 px-3">{crop.id}</td>
                                                <td className="py-2 px-3">{crop.name}</td>
                                                <td className="py-2 px-3 text-red-600">{crop.farm_id}</td>
                                                <td className="py-2 px-3 text-right">
                                                    <button
                                                        onClick={() => fixCrop(crop.id)}
                                                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                                                    >
                                                        Fix
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CropTroubleshooter;
