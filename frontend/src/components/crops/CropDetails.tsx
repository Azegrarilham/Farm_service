import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CropService } from '../../services/api';

const CropDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [crop, setCrop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCrop = async () => {
            try {
                if (!id) return;
                setLoading(true);
                const cropData = await CropService.getById(parseInt(id));
                setCrop(cropData);
            } catch (err: any) {
                console.error('Error fetching crop:', err);
                setError(err.message || 'Failed to fetch crop details');
            } finally {
                setLoading(false);
            }
        };

        fetchCrop();
    }, [id]);

    const handleEdit = () => {
        if (id) {
            navigate(`/sell-crops/${id}/edit`);
        }
    };

    const handleBack = () => {
        navigate('/sell-crops');
    };

    // Helper function to format the image URL
    const formatImageUrl = (imagePath: string) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:8000/storage/${imagePath}`;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-2">Loading crop details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="alert alert-danger" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={handleBack}
                        className="btn btn-primary mt-4"
                    >
                        Back to Listings
                    </button>
                </div>
            </div>
        );
    }

    if (!crop) {
        return (
            <div className="container mx-auto p-4">
                <div className="alert alert-warning" role="alert">
                    <p className="font-bold">Crop Not Found</p>
                    <p>The crop listing you're looking for doesn't exist or was removed.</p>
                    <button
                        onClick={handleBack}
                        className="btn btn-primary mt-4"
                    >
                        Back to Listings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <button
                    onClick={handleBack}
                    className="btn btn-secondary"
                >
                    &larr; Back to Listings
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 pr-0 md:pr-4 mb-4 md:mb-0">
                        {crop.images && crop.images.length > 0 ? (
                            <div>
                                <img
                                    src={formatImageUrl(crop.images[0])}
                                    alt={crop.name}
                                    className="w-full h-auto rounded-lg mb-2 object-cover"
                                    style={{ maxHeight: '400px' }}
                                />

                                {/* Thumbnail images if more than one */}
                                {crop.images.length > 1 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {crop.images.map((image: string, index: number) => (
                                            <img
                                                key={index}
                                                src={formatImageUrl(image)}
                                                alt={`${crop.name} thumbnail ${index + 1}`}
                                                className="w-20 h-20 object-cover rounded border cursor-pointer"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-200 rounded-lg w-full h-64 flex items-center justify-center">
                                <p className="text-gray-500">No image available</p>
                            </div>
                        )}
                    </div>

                    <div className="md:w-1/2">
                        <h1 className="text-2xl font-bold mb-2">{crop.name}</h1>

                        {crop.is_organic && (
                            <div className="mb-2">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                                    Organic
                                </span>
                            </div>
                        )}

                        <p className="text-xl font-semibold text-gray-700 mb-4">
                            ${parseFloat(crop.price).toFixed(2)} per {crop.unit}
                        </p>

                        <p className="text-gray-600 mb-4">
                            Available Quantity: {crop.quantity} {crop.unit}
                        </p>

                        {(crop.available_from || crop.available_until) && (
                            <div className="mb-4">
                                <p className="text-gray-600">
                                    {crop.available_from && `Available from: ${new Date(crop.available_from).toLocaleDateString()}`}
                                    {crop.available_from && crop.available_until && ' - '}
                                    {crop.available_until && `Available until: ${new Date(crop.available_until).toLocaleDateString()}`}
                                </p>
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                            <p className="text-gray-600">{crop.description}</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-800 mb-2">Farm Information</h3>
                            <p className="text-gray-600">
                                {crop.farm ? crop.farm.name : 'Unknown Farm'}
                            </p>
                        </div>

                        <button
                            onClick={handleEdit}
                            className="btn btn-primary w-full"
                        >
                            Edit Listing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropDetails;
