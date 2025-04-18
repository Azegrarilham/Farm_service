import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupplyService, CartService } from '../../services/api';
import { debugCartAPI } from '../../services/debugAPI';
import { Supply } from '../../types/farm';

const SupplyList = () => {
    const navigate = useNavigate();
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<{ [key: number]: number }>({});
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // Filter and sort state
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(!!token);

        const fetchSupplies = async () => {
            try {
                const params: any = {};

                if (selectedCategory) params.category = selectedCategory;
                if (minPrice) params.min_price = minPrice;
                if (maxPrice) params.max_price = maxPrice;
                if (searchTerm) params.search = searchTerm;
                params.sort_by = sortBy;
                params.sort_dir = sortDir;

                console.log('Fetching supplies with params:', params);

                let suppliesData = [];
                let categoriesData = [];

                try {
                    suppliesData = await SupplyService.getAll(params);
                    console.log('Supplies data received:', suppliesData);
                } catch (error) {
                    console.error('Error fetching supplies:', error);
                    setError('Failed to load supplies data. Please try again.');
                }

                try {
                    categoriesData = await SupplyService.getCategories();
                    console.log('Categories data received:', categoriesData);
                } catch (error) {
                    console.error('Error fetching categories:', error);
                    setError(prev => prev || 'Failed to load categories. Please try again.');
                }

                setSupplies(suppliesData || []);
                setCategories(categoriesData || []);

                // Initialize quantity state for each supply
                const initialQuantity: { [key: number]: number } = {};

                // Ensure suppliesData is an array before using forEach
                if (Array.isArray(suppliesData)) {
                    suppliesData.forEach(supply => {
                        if (supply && typeof supply === 'object' && 'id' in supply) {
                            initialQuantity[supply.id] = 1;
                        }
                    });
                } else {
                    console.error('suppliesData is not an array:', suppliesData);
                }

                setQuantity(initialQuantity);
            } catch (error) {
                console.error('Error in fetch supplies function:', error);
                setError('Failed to load supplies. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSupplies();
    }, [selectedCategory, minPrice, maxPrice, searchTerm, sortBy, sortDir]);

    const handleAddToCart = async (supplyId: number) => {
        // Check if user is logged in
        if (!isLoggedIn) {
            setError('Please log in to add items to your cart');
            setSuccess(null);

            // Store the current location to redirect back after login
            localStorage.setItem('redirectAfterLogin', '/supplies');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

            return;
        }

        try {
            setAddingToCart(supplyId);
            setError(null);

            // Find the supply to show in success message
            const supply = supplies.find(s => s.id === supplyId);
            const itemName = supply ? supply.name : 'Item';
            const itemQty = quantity[supplyId] || 1;

            // First try the debug API
            try {
                console.log("Using debug API to add to cart");
                await debugCartAPI.addToCart(supplyId, itemQty);

                // Show success message
                setSuccess(`Added ${itemQty} ${itemName} to your cart.`);

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccess(null);
                }, 3000);
            } catch (debugError) {
                console.error("Debug API failed, falling back to regular API:", debugError);

                // Fall back to regular API if debug fails
                await CartService.addItem(supplyId, itemQty);

                // Show success message
                setSuccess(`Added ${itemQty} ${itemName} to your cart.`);

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccess(null);
                }, 3000);
            }
        } catch (error) {
            console.error('Error adding item to cart (both APIs failed):', error);
            setError('Failed to add item to cart. Please try again.');
            setSuccess(null);
        } finally {
            setAddingToCart(null);
        }
    };

    const handleQuantityChange = (supplyId: number, value: number) => {
        setQuantity(prev => ({
            ...prev,
            [supplyId]: Math.max(1, value)
        }));
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        // The useEffect will trigger the fetch with the current filter state
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('asc');
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Farm Supplies</h1>
                <button
                    onClick={() => navigate('/cart')}
                    className="btn btn-primary flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    View Cart
                </button>
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Filter sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
                        <form onSubmit={handleFilter} className="space-y-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    id="category"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="form-input mt-1"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search supplies..."
                                    className="form-input mt-1"
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="minPrice" className="sr-only">Min Price</label>
                                        <input
                                            type="number"
                                            id="minPrice"
                                            min="0"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            placeholder="Min"
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="maxPrice" className="sr-only">Max Price</label>
                                        <input
                                            type="number"
                                            id="maxPrice"
                                            min="0"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            placeholder="Max"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Sort By</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSort('name')}
                                        className={`px-3 py-1 text-sm rounded-full ${sortBy === 'name' ? 'bg-farm-green-100 text-farm-green-800' : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSort('price')}
                                        className={`px-3 py-1 text-sm rounded-full ${sortBy === 'price' ? 'bg-farm-green-100 text-farm-green-800' : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        Price {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSort('category')}
                                        className={`px-3 py-1 text-sm rounded-full ${sortBy === 'category' ? 'bg-farm-green-100 text-farm-green-800' : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        Category {sortBy === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full btn btn-primary"
                            >
                                Apply Filters
                            </button>
                        </form>
                    </div>
                </div>

                {/* Product grid */}
                <div className="lg:col-span-3">
                    {supplies.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <h3 className="text-gray-900 font-medium">No supplies found</h3>
                            <p className="text-gray-500 mt-2">Try adjusting your filters or search term</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {supplies.map((supply) => (
                                <div key={supply.id} className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="h-48 bg-gray-200 relative">
                                        {supply.images && supply.images.length > 0 ? (
                                            <img
                                                src={`/storage/${supply.images[0]}`}
                                                alt={supply.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.log('Image failed to load:', supply.images[0]);
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full bg-gray-100">
                                                <span className="text-gray-400">No image available</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-farm-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            {supply.category}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-medium text-gray-900">{supply.name}</h3>
                                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{supply.description}</p>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xl font-bold text-farm-green-600">
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
                                            </span>
                                            <span className={`text-sm ${(() => {
                                                try {
                                                    const stockQty = typeof supply.stock_quantity === 'number'
                                                        ? supply.stock_quantity
                                                        : Number(supply.stock_quantity);
                                                    return !isNaN(stockQty) && stockQty > 0 ? 'text-green-600' : 'text-red-600';
                                                } catch (e) {
                                                    return 'text-red-600';
                                                }
                                            })()}`}>
                                                {(() => {
                                                    try {
                                                        const stockQty = typeof supply.stock_quantity === 'number'
                                                            ? supply.stock_quantity
                                                            : Number(supply.stock_quantity);
                                                        return !isNaN(stockQty) && stockQty > 0
                                                            ? `${stockQty} in stock`
                                                            : 'Out of stock';
                                                    } catch (e) {
                                                        console.error('Error formatting stock for', supply.name, e);
                                                        return 'Out of stock';
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(supply.id, (quantity[supply.id] || 1) - 1)}
                                                    className="border border-gray-300 rounded-l-md px-3 py-1"
                                                    disabled={!supply.stock_quantity || supply.stock_quantity <= 0}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={supply.stock_quantity}
                                                    value={quantity[supply.id] || 1}
                                                    onChange={(e) => handleQuantityChange(supply.id, parseInt(e.target.value) || 1)}
                                                    className="border-t border-b border-gray-300 text-center w-14 py-1"
                                                    disabled={!supply.stock_quantity || supply.stock_quantity <= 0}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(supply.id, (quantity[supply.id] || 1) + 1)}
                                                    className="border border-gray-300 rounded-r-md px-3 py-1"
                                                    disabled={!supply.stock_quantity || supply.stock_quantity <= 0 || (quantity[supply.id] || 1) >= supply.stock_quantity}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleAddToCart(supply.id)}
                                                disabled={addingToCart === supply.id || !supply.stock_quantity || supply.stock_quantity <= 0}
                                                className="btn btn-primary w-full"
                                            >
                                                {addingToCart === supply.id ? (
                                                    <span className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Adding...
                                                    </span>
                                                ) : !supply.stock_quantity || supply.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                            <button
                                                onClick={() => navigate(`/supplies/${supply.id}`)}
                                                className="btn btn-outline w-full"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupplyList;
