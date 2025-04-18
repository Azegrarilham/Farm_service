import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmService, AuthService } from '../../services/api';
import { FarmStatistics, AuthUser } from '../../types/farm';

const Dashboard = () => {
    const navigate = useNavigate();
    const [statistics, setStatistics] = useState<FarmStatistics | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, userData] = await Promise.all([
                    FarmService.getStatistics(),
                    AuthService.getUser()
                ]);

                console.log('Recent Activities:', statsData.recentActivities);
                setStatistics(statsData);
                setUser(userData);
            } catch (error) {
                setError('Failed to load dashboard data. Please try again.');
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm font-medium text-red-700 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                    <p className="text-gray-600">Welcome back, {user?.name || 'Farmer'}</p>
                </div>
                <button
                    onClick={() => navigate('/farms/add')}
                    className="btn btn-primary flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Farm
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Farm Stats Card */}
                <div className="card bg-gradient-to-br from-farm-green-50 to-farm-green-100 border border-farm-green-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Farm Overview</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-farm-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Total Farms</h4>
                            <p className="text-3xl font-bold text-farm-green-600">{statistics?.totalFarms || 0}</p>
                            <button
                                onClick={() => navigate('/farms')}
                                className="mt-2 text-sm text-farm-green-600 hover:text-farm-green-800 font-medium"
                            >
                                View all farms →
                            </button>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Total Products</h4>
                            <p className="text-3xl font-bold text-farm-green-600">{statistics?.totalProducts || 0}</p>
                            <button
                                onClick={() => navigate('/farms')}
                                className="mt-2 text-sm text-farm-green-600 hover:text-farm-green-800 font-medium"
                            >
                                Manage products →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Links Card */}
                <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Quick Actions</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/farms/add')}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-farm-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Add Farm</span>
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-farm-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Profile</span>
                        </button>

                        <button
                            onClick={() => navigate('/farms')}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-farm-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">View Farms</span>
                        </button>

                        <button
                            onClick={() => AuthService.logout().then(() => navigate('/login'))}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h3>

                {statistics?.recentActivities && statistics.recentActivities.length > 0 ? (
                    <div className="flow-root">
                        <ul className="-mb-8">
                            {statistics.recentActivities.map((activity, index) => (
                                <li key={activity.id}>
                                    <div className="relative pb-8">
                                        {index !== statistics.recentActivities.length - 1 ? (
                                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                        ) : null}
                                        <div className="relative flex items-start space-x-3">
                                            <div className="relative">
                                                <div className={`
                          h-10 w-10 rounded-full flex items-center justify-center
                          ${activity.type === 'create' ? 'bg-green-100' :
                                                        activity.type === 'update' ? 'bg-blue-100' :
                                                            'bg-red-100'}
                        `}>
                                                    {activity.type === 'create' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : activity.type === 'update' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {activity.userName}
                                                    </div>
                                                    <p className="mt-0.5 text-sm text-gray-500">
                                                        {new Date(activity.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-700">
                                                    <p>
                                                        {activity.type === 'create'
                                                            ? `Added a new ${activity.entityType}: ${activity.entityName}`
                                                            : activity.type === 'update'
                                                                ? `Updated ${activity.entityType}: ${activity.entityName}`
                                                                : `Deleted ${activity.entityType}: ${activity.entityName}`}
                                                    </p>
                                                    <div className="mt-1">
                                                        <a
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (activity.entityType === 'farm' && activity.type !== 'delete') {
                                                                    navigate(`/farms/${activity.entityId}`);
                                                                } else if (activity.entityType === 'product' && activity.type !== 'delete') {
                                                                    // Find the farm ID for this product
                                                                    navigate(`/farms`);
                                                                }
                                                            }}
                                                            className="text-farm-green-600 hover:text-farm-green-800 text-xs font-medium"
                                                        >
                                                            {activity.type !== 'delete' ? 'View details →' : null}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="text-gray-900 font-medium">No recent activity</h4>
                        <p className="mt-1 text-gray-500">Your activity will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
