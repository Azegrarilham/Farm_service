import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartService } from '../../services/api';
import { Cart, CartItem } from '../../types/farm';
import { API_URL, IMAGE_PLACEHOLDER } from '../../config';

const ShoppingCart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingItem, setUpdatingItem] = useState<number | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const cartData = await CartService.getCart();
                setCart(cartData);
            } catch (error) {
                console.error('Error fetching cart', error);
                setError('Failed to load your cart. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, []);

    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            setUpdatingItem(itemId);
            const updatedCart = await CartService.updateItem(itemId, newQuantity);
            setCart(updatedCart);
        } catch (error) {
            console.error('Error updating cart item', error);
            setError('Failed to update item. Please try again.');
        } finally {
            setUpdatingItem(null);
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        try {
            setUpdatingItem(itemId);
            const updatedCart = await CartService.removeItem(itemId);
            setCart(updatedCart);
        } catch (error) {
            console.error('Error removing cart item', error);
            setError('Failed to remove item. Please try again.');
        } finally {
            setUpdatingItem(null);
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Are you sure you want to clear your cart?')) return;

        try {
            setIsClearing(true);
            await CartService.clearCart();
            setCart({
                id: cart?.id || 0,
                items: [],
                subtotal: 0,
                total_items: 0
            });
        } catch (error) {
            console.error('Error clearing cart', error);
            setError('Failed to clear your cart. Please try again.');
        } finally {
            setIsClearing(false);
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
                    onClick={() => navigate('/supplies')}
                    className="mr-4 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Your Shopping Cart</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {(!cart || cart.items.length === 0) ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-6">Start shopping to add items to your cart</p>
                    <button
                        onClick={() => navigate('/supplies')}
                        className="btn btn-primary"
                    >
                        Browse Supplies
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h2 className="text-lg font-medium text-gray-900">Cart Items ({cart.total_items})</h2>
                                <button
                                    onClick={handleClearCart}
                                    disabled={isClearing}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    {isClearing ? 'Clearing...' : 'Clear Cart'}
                                </button>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center">
                                        <div className="w-full sm:w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 mb-4 sm:mb-0">
                                            {item.image ? (
                                                <img
                                                    src={`${API_URL}/storage/${item.image}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.log('Image failed to load:', item.image);
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = IMAGE_PLACEHOLDER;
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full w-full bg-gray-100">
                                                    <span className="text-gray-400 text-xs">No image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow sm:ml-4">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                                <div>
                                                    <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        ${typeof item.price === 'number'
                                                            ? item.price.toFixed(2)
                                                            : Number(item.price).toFixed(2)} per {item.unit}
                                                    </p>
                                                </div>
                                                <div className="flex items-center mt-2 sm:mt-0">
                                                    <div className="flex items-center border border-gray-300 rounded-md mr-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                            disabled={updatingItem === item.id || item.quantity <= 1}
                                                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[40px] text-center">
                                                            {updatingItem === item.id ? '...' : item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            disabled={updatingItem === item.id}
                                                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        disabled={updatingItem === item.id}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex justify-between items-center">
                                                <div>
                                                    {item.discount > 0 && (
                                                        <div className="text-xs text-farm-green-600 font-medium mb-1">
                                                            Volume discount: -${typeof item.discount === 'number'
                                                                ? item.discount.toFixed(2)
                                                                : Number(item.discount).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-base font-medium text-gray-900">
                                                    ${typeof item.total === 'number'
                                                        ? item.total.toFixed(2)
                                                        : Number(item.total).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900 font-medium">
                                        ${typeof cart.subtotal === 'number'
                                            ? cart.subtotal.toFixed(2)
                                            : Number(cart.subtotal).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estimated Tax</span>
                                    <span className="text-gray-900 font-medium">
                                        ${(() => {
                                            const subtotal = typeof cart.subtotal === 'number'
                                                ? cart.subtotal
                                                : Number(cart.subtotal);
                                            return (subtotal * 0.07).toFixed(2);
                                        })()}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between">
                                    <span className="text-gray-900 font-medium">Estimated Total</span>
                                    <span className="text-gray-900 font-bold">
                                        ${(() => {
                                            const subtotal = typeof cart.subtotal === 'number'
                                                ? cart.subtotal
                                                : Number(cart.subtotal);
                                            return (subtotal * 1.07).toFixed(2);
                                        })()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                className="btn btn-primary w-full"
                            >
                                Proceed to Checkout
                            </button>

                            <button
                                onClick={() => navigate('/supplies')}
                                className="btn btn-outline w-full mt-3"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;
