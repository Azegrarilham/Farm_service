import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../../services/api';
import { Order } from '../../types/farm';

interface OrdersData {
    data: Order[];
    current_page: number;
    last_page: number;
    total: number;
}

const OrderHistory = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const params: any = {
                    page: currentPage,
                };

                if (statusFilter) {
                    params.status = statusFilter;
                }

                const response = await OrderService.getAll(params);
                const ordersData = response as OrdersData;

                setOrders(ordersData.data);
                setCurrentPage(ordersData.current_page);
                setTotalPages(ordersData.last_page);
                setTotalOrders(ordersData.total);
            } catch (error) {
                console.error('Error fetching orders', error);
                setError('Failed to load orders. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentPage, statusFilter]);

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(event.target.value);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Your Orders</h1>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={handleFilterChange}
                            className="form-input"
                        >
                            <option value="">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <button
                        onClick={() => navigate('/supplies')}
                        className="btn btn-primary h-full flex items-center self-end"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Order More Supplies
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h2 className="text-xl font-medium text-gray-900 mb-2">No orders found</h2>
                    <p className="text-gray-500 mb-6">
                        {statusFilter ?
                            `You don't have any ${statusFilter} orders.` :
                            "You haven't placed any orders yet."}
                    </p>
                    <button
                        onClick={() => navigate('/supplies')}
                        className="btn btn-primary"
                    >
                        Browse Supplies
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order #
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${order.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.items ? order.items.length : '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                                                <button
                                                    onClick={() => navigate(`/orders/${order.id}`)}
                                                    className="text-farm-green-600 hover:text-farm-green-900"
                                                >
                                                    View
                                                </button>
                                                {order.status !== 'cancelled' && (
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
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Reorder
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{orders.length}</span> of{' '}
                                <span className="font-medium">{totalOrders}</span> orders
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 bg-farm-green-50 text-farm-green-600 rounded-md border border-farm-green-200">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OrderHistory;
