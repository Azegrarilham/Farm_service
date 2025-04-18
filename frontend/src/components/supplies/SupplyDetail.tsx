import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SupplyService, CartService } from '../../services/api';
import { debugCartAPI } from '../../services/debugAPI';
import { Supply } from '../../types/farm';
import { API_URL, IMAGE_PLACEHOLDER } from '../../config';

const SupplyDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [supply, setSupply] = useState<Supply | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [addingToCart, setAddingToCart] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(!!token);

        if (!id) return;

        const fetchSupply = async () => {
            try {
                setLoading(true);
                const data = await SupplyService.getById(parseInt(id));
                setSupply(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch supply details. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSupply();
    }, [id]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            setQuantity(value);
        }
    };

    const handleAddToCart = async () => {
        if (!supply) return;

        // Check if user is logged in
        if (!isLoggedIn) {
            setMessage({
                type: 'danger',
                text: 'Please log in to add items to your cart'
            });

            // Store the current location to redirect back after login
            localStorage.setItem('redirectAfterLogin', window.location.pathname);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

            return;
        }

        try {
            setAddingToCart(true);

            // First try the debug API
            try {
                console.log("Using debug API to add to cart");
                await debugCartAPI.addToCart(supply.id, quantity);

                setMessage({
                    type: 'success',
                    text: `Added ${quantity} ${supply.name} to your cart`
                });
            } catch (debugError) {
                console.error("Debug API failed, falling back to regular API:", debugError);

                // Fall back to regular API if debug fails
                await CartService.addItem(supply.id, quantity);

                setMessage({
                    type: 'success',
                    text: `Added ${quantity} ${supply.name} to your cart`
                });
            }

            // Reset quantity after adding to cart
            setQuantity(1);
        } catch (err) {
            console.error("Both APIs failed:", err);
            setMessage({
                type: 'danger',
                text: 'Failed to add item to cart. Please try again.'
            });
        } finally {
            setAddingToCart(false);

            // Clear the message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        }
    };

    const handleGoToCart = () => {
        // Check if user is logged in before navigating to cart
        if (!isLoggedIn) {
            setMessage({
                type: 'danger',
                text: 'Please log in to view your cart'
            });

            // Store the current location to redirect back after login
            localStorage.setItem('redirectAfterLogin', '/cart');

            setTimeout(() => {
                navigate('/login');
            }, 2000);

            return;
        }

        navigate('/cart');
    };

    if (loading) {
        return <div className="text-center mt-5">Loading supply details...</div>;
    }

    if (error || !supply) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md mt-3">{error || 'Supply not found'}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/supplies')}
                    className="mr-4 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Supply Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    {supply.images && supply.images.length > 0 ? (
                        <img
                            src={`${API_URL}/storage/${supply.images[0]}`}
                            alt={supply.name}
                            className="w-full h-auto object-cover rounded-lg shadow-md"
                            style={{ maxHeight: '400px' }}
                            onError={(e) => {
                                console.log('Image failed to load:', supply.images[0]);
                                const target = e.target as HTMLImageElement;
                                target.src = IMAGE_PLACEHOLDER;
                            }}
                        />
                    ) : (
                        <div className="bg-gray-100 flex items-center justify-center rounded-lg shadow-md" style={{ height: '400px' }}>
                            <span className="text-gray-500">No image available</span>
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{supply.name}</h1>
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                        {supply.category}
                    </span>
                    <h3 className="text-2xl font-bold text-farm-green-600 mt-3 mb-4">
                        ${(() => {
                            try {
                                if (typeof supply.price === 'number') {
                                    return supply.price.toFixed(2);
                                } else if (supply.price) {
                                    const numPrice = Number(supply.price);
                                    return !isNaN(numPrice) ? numPrice.toFixed(2) : '0.00';
                                }
                                return '0.00';
                            } catch (e) {
                                console.error('Error formatting price for', supply.name, e);
                                return '0.00';
                            }
                        })()}
                    </h3>

                    <div className="prose mb-6">
                        <p className="text-gray-700">{supply.description}</p>
                    </div>

                    {(() => {
                        try {
                            const stockQty = typeof supply.stock_quantity === 'number'
                                ? supply.stock_quantity
                                : Number(supply.stock_quantity);

                            return !isNaN(stockQty) && stockQty > 0 ? (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                                    In Stock: {stockQty} available
                                </span>
                            ) : (
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                                    Out of Stock
                                </span>
                            );
                        } catch (e) {
                            console.error('Error formatting stock for', supply.name, e);
                            return (
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                                    Stock status unknown
                                </span>
                            );
                        }
                    })()}

                    {message && (
                        <div className={`p-4 rounded-md mt-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center mt-6">
                        <div className="mb-4 sm:mb-0 sm:mr-4">
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                min="1"
                                max={supply.stock_quantity}
                                value={quantity}
                                onChange={handleQuantityChange}
                                disabled={!supply.stock_quantity || supply.stock_quantity <= 0}
                                className="form-input rounded-md shadow-sm w-20"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-grow">
                            <button
                                onClick={handleAddToCart}
                                disabled={addingToCart || !supply.stock_quantity || supply.stock_quantity <= 0}
                                className={`btn ${!supply.stock_quantity || supply.stock_quantity <= 0 ? 'btn-disabled' : 'btn-primary'} flex items-center justify-center`}
                            >
                                {addingToCart ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Adding...
                                    </>
                                ) : !supply.stock_quantity || supply.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            <button
                                onClick={handleGoToCart}
                                className="btn btn-outline flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                </svg>
                                View Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplyDetail;
