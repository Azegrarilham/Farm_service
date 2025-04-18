import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmService, ProductService } from '../../services/api';
import { Farm, Product } from '../../types/farm';

const FarmDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [farm, setFarm] = useState<Farm | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFarm = async () => {
            if (!id) return;

            try {
                const farmData = await FarmService.getById(parseInt(id, 10));
                setFarm(farmData);

                // Fetch the farm's products
                const productsData = await ProductService.getAllByFarmId(parseInt(id, 10));
                setProducts(productsData);
            } catch (error) {
                setError('Failed to load farm details. Please try again.');
                console.error('Error fetching farm details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFarm();
    }, [id]);

    const handleDelete = async () => {
        if (!farm) return;

        if (window.confirm(`Are you sure you want to delete "${farm.name}"? This action cannot be undone.`)) {
            try {
                await FarmService.delete(farm.id);
                navigate('/farms');
            } catch (error) {
                setError('Failed to delete farm. Please try again.');
                console.error('Error deleting farm:', error);
            }
        }
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

    if (!farm) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-medium text-gray-900">Farm not found</h2>
                <p className="mt-2 text-gray-600">The farm you're looking for doesn't exist or has been removed.</p>
                <button
                    onClick={() => navigate('/farms')}
                    className="mt-4 btn btn-primary"
                >
                    Back to Farms
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/farms')}
                        className="mr-4 text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {farm?.name}
                    </h2>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate(`/farms/edit/${farm?.id}`)}
                        className="btn btn-outline flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="btn btn-danger flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
                </div>
            ) : farm ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Farm Details */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Farm Photos */}
                        {farm.photos && farm.photos.length > 0 && (
                            <div className="card overflow-hidden">
                                <div className="relative h-64">
                                    <img
                                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${farm.photos[0]}`}
                                        alt={farm.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {farm.photos.length > 1 && (
                                    <div className="p-4 grid grid-cols-4 gap-2">
                                        {farm.photos.slice(1).map((photo, index) => (
                                            <div key={index} className="h-20">
                                                <img
                                                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${photo}`}
                                                    alt={`${farm.name} ${index + 2}`}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Basic Info Card */}
                        <div className="card">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Information</h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Location</h4>
                                        <p className="text-gray-900">{farm.location}</p>
                                    </div>

                                    {farm.size && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Size</h4>
                                            <p className="text-gray-900">
                                                {farm.size} {farm.size_unit || 'acres'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {farm.description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                        <p className="text-gray-900 whitespace-pre-line">{farm.description}</p>
                                    </div>
                                )}

                                {farm.established_date && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Established</h4>
                                        <p className="text-gray-900">
                                            {new Date(farm.established_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {farm.farming_methods && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Farming Methods</h4>
                                        <p className="text-gray-900 whitespace-pre-line">{farm.farming_methods}</p>
                                    </div>
                                )}

                                {farm.primary_crops && farm.primary_crops.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Primary Crops</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {farm.primary_crops.map((crop, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-farm-green-100 text-farm-green-800 px-3 py-1 rounded-full text-sm"
                                                >
                                                    {crop}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {farm.coordinates && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Coordinates</h4>
                                        <p className="text-gray-900">
                                            {farm.coordinates.latitude}, {farm.coordinates.longitude}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Owner</h4>
                                    <p className="text-gray-900">{farm.user?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Products Card */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Products</h3>
                                <button
                                    onClick={() => navigate(`/products/add?farm_id=${farm.id}`)}
                                    className="btn btn-secondary btn-sm flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Product
                                </button>
                            </div>

                            {products.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No products yet. Add your first product to this farm.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {products.map(product => (
                                        <div key={product.id} className="py-4 flex justify-between items-center">
                                            <div>
                                                <h4 className="text-base font-medium text-gray-900">{product.name}</h4>
                                                <p className="text-sm text-gray-500">${product.price} per {product.unit}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-farm-green-700 font-medium">
                                                    {product.quantity} {product.unit} available
                                                </span>
                                                <button
                                                    onClick={() => navigate(`/products/${product.id}`)}
                                                    className="text-farm-green-600 hover:text-farm-green-800"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Stats */}
                    <div className="space-y-6">
                        <div className="card bg-farm-green-50 border border-farm-green-100">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Total Products</h4>
                                    <p className="text-2xl font-bold text-farm-green-700">{products.length}</p>
                                </div>

                                {products.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Total Value</h4>
                                        <p className="text-2xl font-bold text-farm-green-700">
                                            ${products.reduce((sum, product) => sum + (product.price * product.quantity), 0).toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {farm.coordinates && (
                            <div className="card">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Location</h3>
                                <div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
                                    <p className="text-gray-600">Map View</p>
                                    {/* In a real app, this would be a map component */}
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    Coordinates: {farm.coordinates.latitude}, {farm.coordinates.longitude}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    Farm not found. It may have been deleted.
                </div>
            )}
        </div>
    );
};

export default FarmDetail;
