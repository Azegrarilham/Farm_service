import { useState, useEffect } from 'react';
import { FarmService } from '../../services/api';
import { Farm } from '../../types/farm';
import { useNavigate } from 'react-router-dom';

const FarmList = () => {
    const navigate = useNavigate();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<'name' | 'location'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const data = await FarmService.getAll();
                setFarms(data);
            } catch (error: any) {
                setError('Failed to load farms. Please try again later.');
                console.error('Error fetching farms:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFarms();
    }, []);

    const handleSort = (field: 'name' | 'location') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedFarms = [...farms].sort((a, b) => {
        const fieldA = a[sortField].toLowerCase();
        const fieldB = b[sortField].toLowerCase();

        if (sortDirection === 'asc') {
            return fieldA.localeCompare(fieldB);
        } else {
            return fieldB.localeCompare(fieldA);
        }
    });

    const filteredFarms = sortedFarms.filter(farm =>
        farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farm.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSortIcon = (field: string) => {
        if (sortField !== field) return null;

        return sortDirection === 'asc' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        );
    };

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
                <h2 className="text-2xl font-bold text-gray-800">Farms</h2>
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

            <div className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        className="form-input pl-10"
                        placeholder="Search farms by name or location"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {filteredFarms.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">No farms found</h3>
                    <p className="mt-2 text-gray-600">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first farm.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => navigate('/farms/add')}
                            className="mt-4 btn btn-primary"
                        >
                            Add Your First Farm
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center font-medium focus:outline-none"
                                    >
                                        Farm Name
                                        {getSortIcon('name')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('location')}
                                        className="flex items-center font-medium focus:outline-none"
                                    >
                                        Location
                                        {getSortIcon('location')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredFarms.map((farm) => (
                                <tr key={farm.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {farm.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {farm.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => navigate(`/farms/${farm.id}`)}
                                                className="text-farm-green-600 hover:text-farm-green-900"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => navigate(`/farms/${farm.id}/edit`)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to delete "${farm.name}"?`)) {
                                                        FarmService.delete(farm.id)
                                                            .then(() => {
                                                                setFarms(farms.filter(f => f.id !== farm.id));
                                                            })
                                                            .catch((error) => {
                                                                console.error('Error deleting farm:', error);
                                                                alert('Failed to delete the farm. Please try again.');
                                                            });
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FarmList;
