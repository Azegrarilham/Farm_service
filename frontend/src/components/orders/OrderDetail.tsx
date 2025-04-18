import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { OrderService } from '../../services/api';
import { Order } from '../../types/farm';

const OrderDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isNewOrder = location.search.includes('new=true');

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;

            try {
                const orderData = await OrderService.getById(parseInt(id, 10));
                setOrder(orderData);
            } catch (error) {
                console.error('Error fetching order', error);
                setError('Failed to load order details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    const handleCancelOrder = async () => {
        if (!order || !window.confirm('Are you sure you want to cancel this order?')) return;

        try {
            setIsCancelling(true);
            const updatedOrder = await OrderService.cancelOrder(order.id);
            setOrder(updatedOrder);
        } catch (error) {
            console.error('Error cancelling order', error);
            setError('Failed to cancel the order. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    Order not found or you do not have permission to view it.
                </div>
                <div className="flex justify-center">
                    <button
                        onClick={() => navigate('/orders')}
                        className="btn btn-primary"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {isNewOrder && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                    Your order has been successfully placed! You will receive a confirmation email shortly.
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/orders')}
                    className="mr-4 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>

                <div className="ml-4">
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-6 flex items-start">
                                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                        {item.supply?.images && item.supply.images.length > 0 ? (
                                            <img
                                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${item.supply.images[0]}`}
                                                alt={item.supply.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full bg-gray-100">
                                                <span className="text-gray-400 text-xs">No image</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-4 flex-grow">
                                        <h3 className="text-base font-medium text-gray-900">
                                            {item.supply?.name || 'Unknown Product'}
                                        </h3>
                                        <div className="mt-1 flex flex-col sm:flex-row sm:justify-between">
                                            <div className="text-sm text-gray-500">
                                                <p>Quantity: {item.quantity}</p>
                                                <p>Price: ${item.price.toFixed(2)}</p>
                                                {item.discount > 0 && (
                                                    <p className="text-farm-green-600">Discount: -${item.discount.toFixed(2)}</p>
                                                )}
                                            </div>
                                            <div className="text-base font-medium text-gray-900 mt-2 sm:mt-0">
                                                Subtotal: ${item.subtotal.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h3>
                                <p className="text-gray-900">
                                    {order.shipping_address}<br />
                                    {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
                                    {order.shipping_country}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h3>
                                <p className="text-gray-900">Phone: {order.shipping_phone}</p>
                            </div>

                            {order.notes && (
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Order Notes</h3>
                                    <p className="text-gray-900">{order.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Timeline</h2>

                        <div className="relative">
                            <div className="absolute h-full w-0.5 bg-gray-200 left-6 top-0"></div>

                            <ul className="space-y-6">
                                <li className="relative pl-14">
                                    <div className="absolute left-0 rounded-full h-12 w-12 flex items-center justify-center bg-farm-green-100 border-2 border-farm-green-500 z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-farm-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-medium text-gray-900">Order Placed</h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </li>

                                {order.status !== 'cancelled' && (
                                    <>
                                        <li className="relative pl-14">
                                            <div className={`absolute left-0 rounded-full h-12 w-12 flex items-center justify-center ${order.status === 'pending' ? 'bg-white' : 'bg-blue-100 border-2 border-blue-500'} z-10`}>
                                                {order.status === 'pending' ? (
                                                    <div className="h-12 w-12 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">NEXT</span>
                                                    </div>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-medium text-gray-900">Processing</h3>
                                                <p className="text-sm text-gray-500">
                                                    {order.status !== 'pending' ? 'Your order is being processed' : 'Waiting to be processed'}
                                                </p>
                                            </div>
                                        </li>

                                        <li className="relative pl-14">
                                            <div className={`absolute left-0 rounded-full h-12 w-12 flex items-center justify-center ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-purple-100 border-2 border-purple-500' : 'bg-white'} z-10`}>
                                                {order.status === 'shipped' || order.status === 'delivered' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                    </svg>
                                                ) : (
                                                    <div className="h-12 w-12 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">NEXT</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-medium text-gray-900">Shipped</h3>
                                                <p className="text-sm text-gray-500">
                                                    {order.status === 'shipped' || order.status === 'delivered' ? (
                                                        <>{order.shipped_at ? new Date(order.shipped_at).toLocaleString() : 'Your order has been shipped'}</>
                                                    ) : (
                                                        'Waiting to be shipped'
                                                    )}
                                                </p>
                                                {order.tracking_number && (
                                                    <p className="text-sm text-blue-600 mt-1">
                                                        Tracking #: {order.tracking_number}
                                                    </p>
                                                )}
                                            </div>
                                        </li>

                                        <li className="relative pl-14">
                                            <div className={`absolute left-0 rounded-full h-12 w-12 flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100 border-2 border-green-500' : 'bg-white'} z-10`}>
                                                {order.status === 'delivered' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                ) : (
                                                    <div className="h-12 w-12 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">NEXT</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-medium text-gray-900">Delivered</h3>
                                                <p className="text-sm text-gray-500">
                                                    {order.status === 'delivered' ? (
                                                        <>{order.delivered_at ? new Date(order.delivered_at).toLocaleString() : 'Your order has been delivered'}</>
                                                    ) : (
                                                        'Estimated delivery in 3-5 business days'
                                                    )}
                                                </p>
                                            </div>
                                        </li>
                                    </>
                                )}

                                {order.status === 'cancelled' && (
                                    <li className="relative pl-14">
                                        <div className="absolute left-0 rounded-full h-12 w-12 flex items-center justify-center bg-red-100 border-2 border-red-500 z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-medium text-gray-900">Cancelled</h3>
                                            <p className="text-sm text-gray-500">
                                                Your order has been cancelled
                                            </p>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                                </div>

                                {order.discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="text-farm-green-600">-${order.discount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                                </div>

                                <div className="pt-3 border-t border-gray-200 flex justify-between">
                                    <span className="text-gray-900 font-medium">Total</span>
                                    <span className="text-gray-900 font-bold">${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-900">Order Details</h3>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Order ID</span>
                                <span className="text-gray-900">#{order.id}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Date Placed</span>
                                <span className="text-gray-900">{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await OrderService.reorder(order.id);
                                        navigate('/cart');
                                    } catch (error) {
                                        console.error('Error reordering', error);
                                        setError('Failed to reorder. Some items might be out of stock.');
                                    }
                                }}
                                className="btn btn-primary w-full"
                                disabled={order.status === 'cancelled'}
                            >
                                Reorder
                            </button>

                            {(order.status === 'pending' || order.status === 'processing') && (
                                <button
                                    onClick={handleCancelOrder}
                                    className="btn btn-outline-danger w-full"
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
