import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductService } from '../../services/api';
import { ProductFormData, Product } from '../../types/farm';

interface ProductFormProps {
    isEditing?: boolean;
    farmId?: number;
}

const ProductForm = ({ isEditing = false, farmId: propFarmId }: ProductFormProps) => {
    const navigate = useNavigate();
    const { id: productId, id: farmIdFromParams } = useParams<{ id: string, farmId: string }>();
    const farmId = propFarmId || (farmIdFromParams ? parseInt(farmIdFromParams, 10) : undefined);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditing);
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        quantity: 0,
        unit: 'kg',
        price: 0,
        farmId: farmId || 0,
    });

    useEffect(() => {
        // Update farmId if it changes (unlikely, but for completeness)
        if (farmId && formData.farmId !== farmId) {
            setFormData(prev => ({ ...prev, farmId }));
        }

        // If editing, fetch the product data
        if (isEditing && productId) {
            const fetchProduct = async () => {
                try {
                    const product = await ProductService.getById(parseInt(productId, 10));
                    setFormData({
                        name: product.name,
                        description: product.description,
                        quantity: product.quantity,
                        unit: product.unit,
                        price: product.price,
                        farmId: product.farmId,
                    });
                } catch (error) {
                    setError('Failed to load product data. Please try again.');
                    console.error('Error fetching product:', error);
                } finally {
                    setIsFetching(false);
                }
            };

            fetchProduct();
        } else {
            setIsFetching(false);
        }
    }, [isEditing, productId, farmId, formData.farmId]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        let parsedValue: string | number = value;

        // Parse numeric values
        if (name === 'quantity' || name === 'price') {
            parsedValue = type === 'number' ? parseFloat(value) || 0 : 0;
        }

        setFormData({
            ...formData,
            [name]: parsedValue,
        });

        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isEditing && productId) {
                await ProductService.update(parseInt(productId, 10), formData);
            } else {
                await ProductService.create(formData);
            }

            // Navigate back to the farm detail page
            navigate(`/farms/${formData.farmId}`);
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                `Failed to ${isEditing ? 'update' : 'create'} product. Please check your data and try again.`
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
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                </h2>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                <div className="grid grid-cols-1 gap-6 mb-6">
                    <div>
                        <label htmlFor="name" className="form-label">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="Enter product name"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="form-label">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="form-input"
                            placeholder="Enter product description"
                        ></textarea>
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
                                min="0"
                                step="0.01"
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
                                <option value="ton">Tons</option>
                                <option value="liter">Liters</option>
                                <option value="piece">Pieces</option>
                                <option value="dozen">Dozen</option>
                                <option value="box">Boxes</option>
                                <option value="bag">Bags</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="price" className="form-label">
                                Price ($) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="form-input"
                            />
                        </div>
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
                            `${isEditing ? 'Update' : 'Create'} Product`
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
