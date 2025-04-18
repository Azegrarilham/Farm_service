import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FarmService, AuthService, CropService } from '../../services/api';
import { Farm } from '../../types/farm';

interface SellCropsFormProps {
    isEditing?: boolean;
}

const SellCropsForm = ({ isEditing = false }: SellCropsFormProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: 1,
        unit: 'kg',
        price: 0,
        farmId: 0,
        available_from: '',
        available_until: '',
        is_organic: false,
        images: undefined as File[] | undefined
    });

    const [farms, setFarms] = useState<Farm[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                // Get only farms owned by the current user
                const farmsData = await FarmService.getUserFarms();
                setFarms(farmsData);

                // Set the first farm as default if available and not editing
                if (farmsData.length > 0 && !isEditing) {
                    setFormData(prev => ({
                        ...prev,
                        farmId: farmsData[0].id
                    }));
                }
            } catch (error) {
                console.error('Error fetching farms:', error);
                setError('Failed to load your farms. Please try again.');
            } finally {
                if (!isEditing) {
                    setIsFetching(false);
                }
            }
        };

        fetchFarms();

        // If editing, fetch the crop data
        if (isEditing && id) {
            const fetchCrop = async () => {
                try {
                    setIsFetching(true);
                    const cropData = await CropService.getById(parseInt(id));

                    if (cropData) {
                        setFormData({
                            name: cropData.name,
                            description: cropData.description,
                            quantity: cropData.quantity,
                            unit: cropData.unit,
                            price: cropData.price,
                            farmId: cropData.farm_id,
                            available_from: cropData.available_from,
                            available_until: cropData.available_until,
                            is_organic: cropData.is_organic,
                            images: undefined
                        });

                        // Set existing images if any
                        if (cropData.images && cropData.images.length > 0) {
                            setExistingImages(cropData.images);
                        }
                    } else {
                        setError('Crop listing not found');
                    }
                } catch (error) {
                    console.error('Error fetching crop data:', error);
                    setError('Failed to load crop data for editing');
                } finally {
                    setIsFetching(false);
                }
            };

            fetchCrop();
        }
    }, [isEditing, id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target as HTMLInputElement;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (name === 'price' || name === 'quantity') {
            setFormData(prev => ({
                ...prev,
                [name]: parseFloat(value) || 0
            }));
        } else if (name === 'farmId') {
            setFormData(prev => ({
                ...prev,
                [name]: parseInt(value) || 0
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            setFormData(prev => ({
                ...prev,
                images: fileArray
            }));

            // Generate previews
            const newPreviews = fileArray.map(file => URL.createObjectURL(file));
            setPreviewImages(newPreviews);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            console.log('Form data:', formData);

            // Create FormData for API request
            const cropFormData = new FormData();

            // Add all form fields to FormData
            cropFormData.append('name', formData.name);
            cropFormData.append('description', formData.description);
            cropFormData.append('quantity', formData.quantity.toString());
            cropFormData.append('unit', formData.unit);
            cropFormData.append('price', formData.price.toString());
            cropFormData.append('farm_id', formData.farmId.toString());

            // Only append dates if they're not empty
            if (formData.available_from) {
                cropFormData.append('available_from', formData.available_from);
            }

            if (formData.available_until) {
                cropFormData.append('available_until', formData.available_until);
            }

            cropFormData.append('is_organic', formData.is_organic ? '1' : '0');

            // Add images if available
            if (formData.images && formData.images.length > 0) {
                formData.images.forEach((image, index) => {
                    cropFormData.append(`images[${index}]`, image);
                });
            }

            // Log the FormData entries to debug
            console.log('FormData entries:');
            for (const pair of cropFormData.entries()) {
                console.log(pair[0], pair[1]);
            }

            let result;
            // If editing, add PUT method flag
            if (isEditing && id) {
                cropFormData.append('_method', 'PUT');
                console.log('Updating crop with ID:', id);
                result = await CropService.update(parseInt(id), cropFormData);
                console.log('Update result:', result);
            } else {
                console.log('Creating new crop');
                result = await CropService.create(cropFormData);
                console.log('Create result:', result);
            }

            // Success message
            const successMessage = isEditing
                ? 'Your crop listing has been updated successfully!'
                : 'Your crop has been listed for sale successfully!';

            setSuccess(successMessage);

            // Ensure the crop was actually created
            if (!result || (result.error)) {
                throw new Error(result?.error || 'Failed to save crop');
            }

            console.log('Crop saved successfully, redirecting in 1.5 seconds');

            if (!isEditing) {
                // Reset form after creating a new listing
                setFormData({
                    name: '',
                    description: '',
                    quantity: 1,
                    unit: 'kg',
                    price: 0,
                    farmId: farms.length > 0 ? farms[0].id : 0,
                    available_from: '',
                    available_until: '',
                    is_organic: false,
                    images: undefined
                });

                // Clear image previews
                setPreviewImages([]);

                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }

            // Manually trigger a refresh of the crops data in CropListings
            // We can do this either by setting a timestamp in localStorage or navigating with a reload flag
            localStorage.setItem('crops_refresh_timestamp', Date.now().toString());

            // Navigate to listings page after success
            setTimeout(() => {
                console.log('Navigating to crop listings page');
                navigate('/sell-crops');

                // Force reload of data when reaching the CropListings component
                window.dispatchEvent(new CustomEvent('refreshCrops'));
            }, 1500);
        } catch (error: any) {
            console.error('Error saving crop listing:', error);

            // Try to get detailed error message from response
            let errorMessage = `Failed to ${isEditing ? 'update' : 'list'} your crop. `;

            if (error.response) {
                console.error('Error response:', error.response);
                if (error.response.data && error.response.data.message) {
                    errorMessage += error.response.data.message;
                } else if (error.response.data && error.response.data.error) {
                    errorMessage += error.response.data.error;
                } else {
                    errorMessage += `Server responded with status: ${error.response.status}`;
                }
            } else if (error.message) {
                errorMessage += error.message;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to format image URL
    const formatImageUrl = (imagePath: string) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:8000/storage/${imagePath}`;
    };

    if (isFetching) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
            </div>
        );
    }

    if (farms.length === 0) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-4 text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Create a Farm First
                    </h2>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-md mb-6">
                    <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-medium mb-2">You need to create a farm before you can sell crops</h3>
                            <p className="text-yellow-700 mb-4">
                                To sell crops on our marketplace, you first need to register at least one farm. This allows buyers to know where their produce is coming from and helps build trust.
                            </p>
                            <p className="text-yellow-700 mb-4">
                                Creating a farm takes just a minute - add your farm name, location, and a brief description.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/farms/add')}
                                    className="btn btn-primary flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Create Your First Farm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mr-4 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-800">
                    {isEditing ? 'Edit Crop Listing' : 'Sell Your Crops'}
                </h2>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 mb-6">
                    <div>
                        <label htmlFor="farmId" className="form-label">
                            Farm <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="farmId"
                            name="farmId"
                            value={formData.farmId}
                            onChange={handleChange}
                            required
                            className="form-input"
                        >
                            <option value="" disabled>Select a farm</option>
                            {farms.map(farm => (
                                <option key={farm.id} value={farm.id}>
                                    {farm.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="name" className="form-label">
                            Crop Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="e.g. Organic Tomatoes"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="form-label">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className="form-input"
                            rows={3}
                            placeholder="Describe your crop, its quality, and any other relevant details"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="quantity" className="form-label">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                min="0.1"
                                step="0.1"
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="unit" className="form-label">
                                Unit <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                <option value="kg">Kilograms (kg)</option>
                                <option value="g">Grams (g)</option>
                                <option value="ton">Tons</option>
                                <option value="lb">Pounds (lb)</option>
                                <option value="oz">Ounces (oz)</option>
                                <option value="bushel">Bushels</option>
                                <option value="box">Boxes</option>
                                <option value="crate">Crates</option>
                                <option value="piece">Pieces</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="price" className="form-label">
                                Price per Unit <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    className="form-input pl-7"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="available_from" className="form-label">
                                Available From
                            </label>
                            <input
                                type="date"
                                id="available_from"
                                name="available_from"
                                value={formData.available_from}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="available_until" className="form-label">
                                Available Until
                            </label>
                            <input
                                type="date"
                                id="available_until"
                                name="available_until"
                                value={formData.available_until}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_organic"
                            name="is_organic"
                            checked={formData.is_organic}
                            onChange={handleChange}
                            className="h-4 w-4 text-farm-green-600 focus:ring-farm-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_organic" className="ml-2 block text-sm text-gray-900">
                            This crop is certified organic
                        </label>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="images" className="block mb-2 text-sm font-medium text-gray-900">
                            Upload Images
                        </label>
                        <input
                            type="file"
                            id="images"
                            name="images"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-gray-500">Upload images of your crop (max 5 files, each not exceeding 2MB)</p>

                        {/* Show new image previews */}
                        {previewImages.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">New Images:</p>
                                <div className="mt-1 flex space-x-2 overflow-x-auto pb-2">
                                    {previewImages.map((preview, index) => (
                                        <img
                                            key={`new-${index}`}
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="h-20 w-20 object-cover rounded-md border border-gray-200"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Show existing images */}
                        {existingImages.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700">Current Images:</p>
                                <div className="mt-1 flex space-x-2 overflow-x-auto pb-2">
                                    {existingImages.map((image, index) => (
                                        <img
                                            key={`existing-${index}`}
                                            src={formatImageUrl(image)}
                                            alt={`Existing ${index + 1}`}
                                            className="h-20 w-20 object-cover rounded-md border border-gray-200"
                                            onError={(e) => {
                                                console.error(`Failed to load image: ${image}`);
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/sell-crops')}
                        className="btn btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isEditing ? 'Updating...' : 'Listing...'}
                            </span>
                        ) : (
                            isEditing ? 'Update Listing' : 'List Crop for Sale'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Mock data for editing (would be fetched from API in a real app)
const mockCropListings = [
    {
        id: 1,
        name: 'Organic Tomatoes',
        description: 'Fresh, organic tomatoes grown without pesticides. Great for salads and cooking.',
        quantity: 100,
        unit: 'kg',
        price: 2.5,
        farmId: 1,
        farmName: 'Green Valley Farm',
        farmerName: 'John Doe',
        farmerId: 1,
        available_from: '2023-06-01',
        available_until: '2023-07-15',
        is_organic: true,
        created_at: '2023-05-20',
        images: ['tomatoes.jpg']
    },
    {
        id: 2,
        name: 'Sweet Corn',
        description: 'Fresh picked sweet corn, perfect for summer barbecues.',
        quantity: 200,
        unit: 'crate',
        price: 10,
        farmId: 2,
        farmName: 'Sunshine Fields',
        farmerName: 'Jane Smith',
        farmerId: 2,
        available_from: '2023-06-15',
        available_until: '2023-08-30',
        is_organic: false,
        created_at: '2023-05-25',
        images: ['corn.jpg']
    },
    {
        id: 3,
        name: 'Organic Apples',
        description: 'Crisp and sweet organic apples, perfect for snacking or baking.',
        quantity: 500,
        unit: 'kg',
        price: 3.2,
        farmId: 1,
        farmName: 'Green Valley Farm',
        farmerName: 'John Doe',
        farmerId: 1,
        available_from: '2023-09-01',
        available_until: '2023-11-30',
        is_organic: true,
        created_at: '2023-05-28',
        images: ['apples.jpg']
    }
];

export default SellCropsForm;
