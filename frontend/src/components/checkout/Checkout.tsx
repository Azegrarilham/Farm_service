import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartService, OrderService } from '../../services/api';
import { Cart, OrderAddress } from '../../types/farm';

const Checkout = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<OrderAddress>({
        shipping_address: '',
        shipping_city: '',
        shipping_state: '',
        shipping_zip: '',
        shipping_country: 'USA',
        shipping_phone: '',
        notes: '',
    });
    const [step, setStep] = useState(1);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const cartData = await CartService.getCart();

                if (!cartData || cartData.items.length === 0) {
                    navigate('/cart');
                    return;
                }

                setCart(cartData);
            } catch (error) {
                console.error('Error fetching cart', error);
                setError('Failed to load your cart data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const requiredFields = ['shipping_address', 'shipping_city', 'shipping_state', 'shipping_zip', 'shipping_phone'];
        for (const field of requiredFields) {
            if (!formData[field as keyof OrderAddress]) {
                setError(`Please fill in the ${field.replace('_', ' ')}`);
                return false;
            }
        }

        // Simple zip code validation
        if (!/^\d{5}(-\d{4})?$/.test(formData.shipping_zip)) {
            setError('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
            return false;
        }

        // Simple phone validation
        if (!/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/.test(formData.shipping_phone)) {
            setError('Please enter a valid phone number (e.g., 555-123-4567)');
            return false;
        }

        return true;
    };

    const handleContinue = () => {
        if (validateForm()) {
            setError(null);
            setStep(2);
        }
    };

    const handlePlaceOrder = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const order = await OrderService.createOrder(formData);

            // Redirect to order confirmation
            navigate(`/orders/${order.id}?new=true`);
        } catch (error: any) {
            console.error('Error placing order', error);
            setError(error.response?.data?.message || 'Failed to place your order. Please try again.');
            setStep(1);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => step === 1 ? navigate('/cart') : setStep(1)}
                    className="mr-4 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
            </div>

            {/* Checkout steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className={`flex flex-col items-center ${step >= 1 ? 'text-farm-green-600' : 'text-gray-400'}`}>
                        <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 1 ? 'border-farm-green-600 bg-farm-green-50' : 'border-gray-300'}`}>
                            <span className="text-sm font-medium">1</span>
                        </div>
                        <span className="text-xs mt-1">Shipping</span>
                    </div>
                    <div className={`flex-grow border-t ${step >= 2 ? 'border-farm-green-600' : 'border-gray-300'} mx-4`}></div>
                    <div className={`flex flex-col items-center ${step >= 2 ? 'text-farm-green-600' : 'text-gray-400'}`}>
                        <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 2 ? 'border-farm-green-600 bg-farm-green-50' : 'border-gray-300'}`}>
                            <span className="text-sm font-medium">2</span>
                        </div>
                        <span className="text-xs mt-1">Review & Pay</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 max-w-2xl mx-auto">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {step === 1 ? (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="md:col-span-2">
                                    <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="shipping_address"
                                        name="shipping_address"
                                        value={formData.shipping_address}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Street address"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="shipping_city" className="block text-sm font-medium text-gray-700 mb-1">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="shipping_city"
                                        name="shipping_city"
                                        value={formData.shipping_city}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="City"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="shipping_state" className="block text-sm font-medium text-gray-700 mb-1">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="shipping_state"
                                        name="shipping_state"
                                        value={formData.shipping_state}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                    >
                                        <option value="">Select State</option>
                                        <option value="AL">Alabama</option>
                                        <option value="AK">Alaska</option>
                                        <option value="AZ">Arizona</option>
                                        {/* Add all states here */}
                                        <option value="CA">California</option>
                                        <option value="CO">Colorado</option>
                                        <option value="CT">Connecticut</option>
                                        <option value="NY">New York</option>
                                        <option value="TX">Texas</option>
                                        <option value="WA">Washington</option>
                                        {/* ... */}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="shipping_zip" className="block text-sm font-medium text-gray-700 mb-1">
                                        ZIP Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="shipping_zip"
                                        name="shipping_zip"
                                        value={formData.shipping_zip}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="ZIP code"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="shipping_country" className="block text-sm font-medium text-gray-700 mb-1">
                                        Country
                                    </label>
                                    <select
                                        id="shipping_country"
                                        name="shipping_country"
                                        value={formData.shipping_country}
                                        onChange={handleChange}
                                        className="form-input"
                                    >
                                        <option value="USA">United States</option>
                                        <option value="CAN">Canada</option>
                                        <option value="MEX">Mexico</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="shipping_phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="shipping_phone"
                                        name="shipping_phone"
                                        value={formData.shipping_phone}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="555-123-4567"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                        Order Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Special delivery instructions or notes"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleContinue}
                                    className="btn btn-primary"
                                >
                                    Continue to Review
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Review</h2>

                            <div className="mb-6">
                                <h3 className="text-base font-medium text-gray-700 mb-2">Shipping To:</h3>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <p className="text-gray-800">
                                        {formData.shipping_address}<br />
                                        {formData.shipping_city}, {formData.shipping_state} {formData.shipping_zip}<br />
                                        {formData.shipping_country}<br />
                                        Phone: {formData.shipping_phone}
                                    </p>
                                    {formData.notes && (
                                        <div className="mt-2 text-sm text-gray-500">
                                            <strong>Notes:</strong> {formData.notes}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-farm-green-600 text-sm font-medium mt-2"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-base font-medium text-gray-700 mb-2">Order Items:</h3>
                                <div className="divide-y divide-gray-200">
                                    {cart?.items.map(item => (
                                        <div key={item.id} className="py-3 flex justify-between">
                                            <div className="flex items-center">
                                                <span className="text-gray-800 font-medium">{item.quantity} x {item.name}</span>
                                                {item.discount > 0 && (
                                                    <span className="ml-2 text-xs text-farm-green-600">
                                                        (Includes discount)
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-gray-800 font-medium">${item.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between mb-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="btn btn-outline"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : 'Place Order'}
                                </button>
                            </div>

                            <div className="text-sm text-gray-500 text-center">
                                By placing your order, you agree to our <a href="#" className="text-farm-green-600">Terms of Service</a> and <a href="#" className="text-farm-green-600">Privacy Policy</a>.
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Items ({cart?.total_items || 0})</span>
                                <span className="text-gray-900">${cart?.subtotal.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (7%)</span>
                                <span className="text-gray-900">${cart ? (cart.subtotal * 0.07).toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="text-gray-900">Free</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between">
                                <span className="text-gray-900 font-medium">Order Total</span>
                                <span className="text-gray-900 font-bold">
                                    ${cart ? (cart.subtotal * 1.07).toFixed(2) : '0.00'}
                                </span>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500">
                            <p className="mb-2">
                                <strong>Estimated Delivery:</strong> 3-5 business days
                            </p>
                            <p>
                                <strong>Return Policy:</strong> 30-day money-back guarantee
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
