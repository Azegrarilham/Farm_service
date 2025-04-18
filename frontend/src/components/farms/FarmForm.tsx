import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FarmService, AuthService } from '../../services/api';
import { FarmFormData, Farm, AuthUser } from '../../types/farm';

interface FarmFormProps {
    isEditing?: boolean;
}

const FarmForm = ({ isEditing = false }: FarmFormProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<FarmFormData>({
        name: '',
        location: '',
        size: undefined,
        size_unit: 'acres',
        description: '',
        primary_crops: [],
        farming_methods: '',
        photos: undefined,
        latitude: undefined,
        longitude: undefined,
        established_date: undefined,
        userId: 0,
    });
    const [cropInput, setCropInput] = useState<string>('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && id) {
            const fetchFarm = async () => {
                try {
                    const farm = await FarmService.getById(parseInt(id, 10));

                    // Extract coordinates if they exist
                    let lat, lng;
                    if (farm.coordinates) {
                        lat = farm.coordinates.latitude;
                        lng = farm.coordinates.longitude;
                    }

                    // Set existing photos
                    if (farm.photos && farm.photos.length > 0) {
                        setExistingPhotos(farm.photos);
                    }

                    setFormData({
                        name: farm.name,
                        location: farm.location,
                        size: farm.size,
                        size_unit: farm.size_unit || 'acres',
                        description: farm.description || '',
                        primary_crops: farm.primary_crops || [],
                        farming_methods: farm.farming_methods || '',
                        latitude: lat,
                        longitude: lng,
                        established_date: farm.established_date,
                        userId: farm.user_id,
                    });
                } catch (error) {
                    console.error('Error fetching farm:', error);
                    setError('Failed to load farm data. Please try again.');
                } finally {
                    setIsFetching(false);
                }
            };

            fetchFarm();
        } else {
            // If creating a new farm, get the current user and set it as the default
            const fetchCurrentUser = async () => {
                try {
                    const user = await AuthService.getUser();
                    setFormData(prev => ({
                        ...prev,
                        userId: user.id,
                    }));
                } catch (error) {
                    console.error('Error fetching current user:', error);
                } finally {
                    setIsFetching(false);
                }
            };

            fetchCurrentUser();
        }
    }, [id, isEditing]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        let parsedValue: string | number | undefined | string[] = value;

        // Parse numeric values
        if (name === 'latitude' || name === 'longitude' || name === 'size') {
            parsedValue = value === '' ? undefined : parseFloat(value);
        } else if (name === 'userId') {
            parsedValue = parseInt(value, 10);
        }

        setFormData({
            ...formData,
            [name]: parsedValue,
        });

        setIsDirty(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            setFormData(prev => ({
                ...prev,
                photos: fileArray
            }));

            // Generate previews
            const newPreviews = fileArray.map(file => URL.createObjectURL(file));
            setPreviewImages(newPreviews);

            setIsDirty(true);
        }
    };

    const handleAddCrop = () => {
        if (cropInput.trim()) {
            setFormData(prev => ({
                ...prev,
                primary_crops: [...(prev.primary_crops || []), cropInput.trim()]
            }));
            setCropInput('');
            setIsDirty(true);
        }
    };

    const handleRemoveCrop = (index: number) => {
        setFormData(prev => ({
            ...prev,
            primary_crops: prev.primary_crops?.filter((_, i) => i !== index)
        }));
        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Create FormData for file uploads
            const formDataObj = new FormData();

            // Add all text fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'photos' || key === 'primary_crops') {
                    return; // Handle separately
                }

                if (value !== undefined && value !== null) {
                    formDataObj.append(key, String(value));
                }
            });

            // Add primary_crops as JSON string
            if (formData.primary_crops && formData.primary_crops.length > 0) {
                formDataObj.append('primary_crops', JSON.stringify(formData.primary_crops));
            }

            // Add photos if any
            if (formData.photos && formData.photos.length > 0) {
                formData.photos.forEach(photo => {
                    formDataObj.append('photos[]', photo);
                });
            }

            if (isEditing && id) {
                await FarmService.update(parseInt(id, 10), formDataObj);
            } else {
                await FarmService.create(formDataObj);
            }

            navigate('/farms');
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                `Failed to ${isEditing ? 'update' : 'create'} farm. Please check your data and try again.`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (!isDirty || window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
            navigate(-1);
        }
    };

    if (isFetching) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
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
                    {isEditing ? 'Edit Farm' : 'Add New Farm'}
                </h2>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 mb-6">
                    <div>
                        <label htmlFor="name" className="form-label">
                            Farm Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="Enter farm name"
                        />
                    </div>

                    <div>
                        <label htmlFor="location" className="form-label">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="Enter farm location"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="size" className="form-label">
                                Size
                            </label>
                            <input
                                type="number"
                                id="size"
                                name="size"
                                value={formData.size === undefined ? '' : formData.size}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="form-input"
                                placeholder="e.g. 100"
                            />
                        </div>

                        <div>
                            <label htmlFor="size_unit" className="form-label">
                                Unit
                            </label>
                            <select
                                id="size_unit"
                                name="size_unit"
                                value={formData.size_unit || 'acres'}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="acres">Acres</option>
                                <option value="hectares">Hectares</option>
                                <option value="square_meters">Square Meters</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="form-label">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            className="form-input"
                            rows={3}
                            placeholder="Describe your farm"
                        />
                    </div>

                    <div>
                        <label className="form-label">
                            Primary Crops
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                value={cropInput}
                                onChange={(e) => setCropInput(e.target.value)}
                                className="form-input flex-grow mr-2"
                                placeholder="Add a crop (e.g. Corn, Wheat)"
                            />
                            <button
                                type="button"
                                onClick={handleAddCrop}
                                className="btn btn-secondary"
                            >
                                Add
                            </button>
                        </div>
                        {formData.primary_crops && formData.primary_crops.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.primary_crops.map((crop, index) => (
                                    <div key={index} className="bg-farm-green-100 text-farm-green-800 px-3 py-1 rounded-full flex items-center">
                                        {crop}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCrop(index)}
                                            className="ml-2 text-farm-green-600 hover:text-farm-green-800"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="farming_methods" className="form-label">
                            Farming Methods
                        </label>
                        <textarea
                            id="farming_methods"
                            name="farming_methods"
                            value={formData.farming_methods || ''}
                            onChange={handleChange}
                            className="form-input"
                            rows={3}
                            placeholder="Describe your farming methods (e.g. organic, conventional)"
                        />
                    </div>

                    <div>
                        <label htmlFor="photos" className="form-label">
                            Farm Photos
                        </label>
                        <input
                            type="file"
                            id="photos"
                            name="photos"
                            onChange={handleFileChange}
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <div className="mt-1 flex items-center">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-outline"
                            >
                                Select Photos
                            </button>
                            <span className="ml-3 text-sm text-gray-500">
                                {previewImages.length > 0
                                    ? `${previewImages.length} new photo(s) selected`
                                    : 'No new photos selected'}
                            </span>
                        </div>

                        {/* Preview of new photos */}
                        {previewImages.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                {previewImages.map((src, index) => (
                                    <div key={`new-${index}`} className="relative">
                                        <img
                                            src={src}
                                            alt={`Preview ${index}`}
                                            className="h-24 w-full object-cover rounded-md"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Display existing photos */}
                        {existingPhotos.length > 0 && (
                            <>
                                <h4 className="text-sm font-medium text-gray-700 mt-4">Existing Photos</h4>
                                <div className="mt-2 grid grid-cols-3 gap-3">
                                    {existingPhotos.map((photo, index) => (
                                        <div key={`existing-${index}`} className="relative">
                                            <img
                                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${photo}`}
                                                alt={`Farm photo ${index}`}
                                                className="h-24 w-full object-cover rounded-md"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="latitude" className="form-label">
                                Latitude
                            </label>
                            <input
                                type="number"
                                id="latitude"
                                name="latitude"
                                value={formData.latitude === undefined ? '' : formData.latitude}
                                onChange={handleChange}
                                step="any"
                                className="form-input"
                                placeholder="e.g. 38.8951"
                            />
                        </div>

                        <div>
                            <label htmlFor="longitude" className="form-label">
                                Longitude
                            </label>
                            <input
                                type="number"
                                id="longitude"
                                name="longitude"
                                value={formData.longitude === undefined ? '' : formData.longitude}
                                onChange={handleChange}
                                step="any"
                                className="form-input"
                                placeholder="e.g. -77.0364"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="established_date" className="form-label">
                            Established Date
                        </label>
                        <input
                            type="date"
                            id="established_date"
                            name="established_date"
                            value={formData.established_date || ''}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handleCancel}
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
                                Saving...
                            </span>
                        ) : (
                            `${isEditing ? 'Update' : 'Create'} Farm`
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FarmForm;
