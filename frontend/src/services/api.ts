import axios from 'axios';
import {
    Farm,
    FarmFormData,
    Product,
    ProductFormData,
    AuthUser,
    LoginCredentials,
    RegisterData,
    FarmStatistics,
    Supply,
    Cart,
    Order,
    OrderAddress
} from '../types/farm';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Important for handling authentication cookies
});

// Helper to store the token
const storeToken = (token: string) => {
    localStorage.setItem('access_token', token);
};

// Helper to get the token
const getToken = (): string | null => {
    return localStorage.getItem('access_token');
};

// Helper to remove the token
const removeToken = () => {
    localStorage.removeItem('access_token');
};

// Add token to all requests if available
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const AuthService = {
    login: async (credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> => {
        const response = await api.post('/login', credentials);
        // Store token for future requests
        storeToken(response.data.token);
        return response.data;
    },

    register: async (data: RegisterData): Promise<{ user: AuthUser; token: string }> => {
        const response = await api.post('/register', data);
        // Store token for future requests
        storeToken(response.data.token);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/logout');
        // Remove token on logout
        removeToken();
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, password: string, passwordConfirmation: string): Promise<{ message: string }> => {
        const response = await api.post('/reset-password', {
            token,
            password,
            password_confirmation: passwordConfirmation,
        });
        return response.data;
    },

    getUser: async (): Promise<AuthUser> => {
        const response = await api.get('/user');
        return response.data;
    },

    updateProfile: async (data: FormData): Promise<AuthUser> => {
        const response = await api.post('/user/profile', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    changePassword: async (currentPassword: string, password: string, passwordConfirmation: string): Promise<{ message: string }> => {
        const response = await api.put('/user/password', {
            current_password: currentPassword,
            password,
            password_confirmation: passwordConfirmation,
        });
        return response.data;
    },
};

export const FarmService = {
    getAll: async (): Promise<Farm[]> => {
        const response = await api.get<Farm[]>('/farms');
        return response.data;
    },

    getUserFarms: async (): Promise<Farm[]> => {
        const response = await api.get<Farm[]>('/farms/user');
        return response.data;
    },

    getById: async (id: number): Promise<Farm> => {
        const response = await api.get<Farm>(`/farms/${id}`);
        return response.data;
    },

    create: async (farm: FormData | FarmFormData): Promise<Farm> => {
        const headers = farm instanceof FormData ? {
            'Content-Type': 'multipart/form-data'
        } : undefined;

        const response = await api.post<Farm>('/farms', farm, { headers });
        return response.data;
    },

    update: async (id: number, farm: FormData | FarmFormData): Promise<Farm> => {
        const headers = farm instanceof FormData ? {
            'Content-Type': 'multipart/form-data'
        } : undefined;

        if (farm instanceof FormData) {
            farm.append('_method', 'PUT'); // Laravel requires this for form data PUT requests
            const response = await api.post<Farm>(`/farms/${id}`, farm, { headers });
            return response.data;
        } else {
            const response = await api.put<Farm>(`/farms/${id}`, farm, { headers });
            return response.data;
        }
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/farms/${id}`);
    },

    getStatistics: async (): Promise<FarmStatistics> => {
        const response = await api.get<FarmStatistics>('/dashboard/statistics');
        return response.data;
    },
};

export const ProductService = {
    getAllByFarmId: async (farmId: number): Promise<Product[]> => {
        const response = await api.get<Product[]>(`/farms/${farmId}/products`);
        return response.data;
    },

    getById: async (id: number): Promise<Product> => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },

    create: async (product: ProductFormData): Promise<Product> => {
        const response = await api.post<Product>('/products', product);
        return response.data;
    },

    update: async (id: number, product: ProductFormData): Promise<Product> => {
        const response = await api.put<Product>(`/products/${id}`, product);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
};

export const SupplyService = {
    getAll: async (params?: any) => {
        try {
            // Build query string for params
            let queryString = '';
            if (params) {
                const searchParams = new URLSearchParams();
                Object.keys(params).forEach(key => {
                    if (params[key] !== undefined && params[key] !== null) {
                        searchParams.append(key, params[key]);
                    }
                });
                queryString = searchParams.toString();
            }

            // Use fetch instead of axios
            const url = `${API_URL}/api/supplies${queryString ? `?${queryString}` : ''}`;
            console.log('Fetching supplies from:', url);

            const response = await fetch(url);
            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Get the raw text first to check if it's valid JSON
            const rawText = await response.text();

            try {
                // Try to parse the JSON
                const data = JSON.parse(rawText);
                console.log('Supplies data type:', Array.isArray(data) ? 'array' : typeof data);
                console.log('Supplies data received:', data);

                // Ensure we return an array
                if (data && data.data) {
                    // Laravel pagination returns { data: [...] }
                    console.log('Using data.data from paginated response');
                    return data.data;
                } else if (Array.isArray(data)) {
                    // Already an array
                    console.log('Data is already an array with length:', data.length);
                    return data;
                } else {
                    console.error('Unexpected data format:', data);
                    return []; // Return empty array as fallback
                }
            } catch (jsonError) {
                console.error('Failed to parse JSON response:', jsonError);
                console.log('Raw response text:', rawText);
                return [];
            }
        } catch (error) {
            console.error('Error fetching supplies:', error);
            throw error;
        }
    },
    getById: async (id: number) => {
        try {
            const url = `${API_URL}/api/supplies/${id}`;
            console.log('Fetching supply detail from:', url);

            const response = await fetch(url);
            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Supply detail received:', data);

            return data;
        } catch (error) {
            console.error('Error fetching supply detail:', error);
            throw error;
        }
    },
    getCategories: async () => {
        try {
            // Use fetch instead of axios
            const url = `${API_URL}/api/supplies/categories`;
            console.log('Fetching categories from:', url);

            const response = await fetch(url);
            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Categories data received:', data);

            // Ensure we return an array
            if (data && data.data) {
                // Laravel pagination returns { data: [...] }
                return data.data;
            } else if (Array.isArray(data)) {
                // Already an array
                return data;
            } else {
                console.error('Unexpected data format:', data);
                return []; // Return empty array as fallback
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },
    getAllByCategory: async (category: string) => {
        const response = await api.get(`/api/supplies/category/${category}`);
        return response.data;
    },
    create: async (supplyData: FormData) => {
        const response = await api.post('/api/supplies', supplyData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    update: async (id: number, supplyData: FormData) => {
        const response = await api.post(`/api/supplies/${id}`, supplyData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/api/supplies/${id}`);
        return response.data;
    }
};

// Add a function to get CSRF cookie from Laravel
export const getCsrfCookie = async () => {
    try {
        await axios.get(`${API_URL}/sanctum/csrf-cookie`, {
            withCredentials: true
        });
        console.log('CSRF cookie obtained');
    } catch (error) {
        console.error('Failed to get CSRF cookie:', error);
    }
};

// Initialize API by getting CSRF cookie
export const initializeApi = async () => {
    await getCsrfCookie();
};

export const CartService = {
    getCart: async () => {
        try {
            const response = await api.get('/cart');
            console.log('Cart data received:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching cart:', error);
            // Return empty cart on error to prevent UI errors
            return {
                id: 0,
                items: [],
                subtotal: 0,
                total_items: 0
            };
        }
    },
    addItem: async (supplyId: number, quantity: number) => {
        try {
            console.log('Adding item to cart:', { supplyId, quantity });

            const response = await api.post('/cart/add', {
                supply_id: supplyId,
                quantity
            });

            console.log('Add to cart response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error adding item to cart:', error);
            // Log the detailed error if available
            if (error.response) {
                console.error('Error response:', {
                    status: error.response.status,
                    headers: error.response.headers,
                    data: error.response.data
                });
            }
            throw error;
        }
    },
    updateItem: async (cartItemId: number, quantity: number) => {
        const response = await api.put(`/cart/update/${cartItemId}`, {
            quantity
        });
        return response.data;
    },
    removeItem: async (cartItemId: number) => {
        const response = await api.delete(`/cart/remove/${cartItemId}`);
        return response.data;
    },
    clearCart: async () => {
        const response = await api.delete('/cart/clear');
        return response.data;
    },
    checkout: async (shippingDetails: any) => {
        const response = await api.post('/cart/checkout', shippingDetails);
        return response.data;
    }
};

export const OrderService = {
    getAll: async (params?: any): Promise<any> => {
        const response = await api.get('/api/orders', { params });
        return response.data;
    },

    getById: async (id: number): Promise<Order> => {
        const response = await api.get<Order>(`/api/orders/${id}`);
        return response.data;
    },

    createOrder: async (orderData: OrderAddress): Promise<Order> => {
        const response = await api.post<Order>('/api/orders', orderData);
        return response.data;
    },

    reorder: async (orderId: number): Promise<any> => {
        const response = await api.post(`/api/orders/${orderId}/reorder`);
        return response.data;
    },

    cancelOrder: async (orderId: number): Promise<Order> => {
        const response = await api.put<Order>(`/api/orders/${orderId}/cancel`);
        return response.data;
    }
};

// Crop service
export const CropService = {
    getAll: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_URL}/api/crops`);
            console.log('Get all crops response status:', response.status);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Get all crops data received:', data);

            // Handle potential data formats
            if (data && data.data) {
                return data.data;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                console.error('Unexpected data format for crops:', data);
                return [];
            }
        } catch (error) {
            console.error('Error fetching crops:', error);
            return [];
        }
    },

    getUserCrops: async (): Promise<any[]> => {
        try {
            console.time('getUserCrops');
            console.log('Attempting to fetch user crops with axios');

            // Debug: Manually check auth status and user details
            try {
                const userResponse = await api.get('/user');
                console.log('Current user from API:', userResponse.data);
            } catch (userErr) {
                console.error('Error fetching user data:', userErr);
            }

            // Debug: Directly check farms
            try {
                const farmsResponse = await api.get('/farms/user');
                console.log('User farms from API:', farmsResponse.data);
            } catch (farmErr) {
                console.error('Error fetching user farms:', farmErr);
            }

            // Try direct fetch approach to bypass any caching or interceptors
            try {
                console.log('Attempting direct fetch approach as backup');
                const token = getToken();

                if (!token) {
                    console.error('No token found for direct fetch');
                } else {
                    // Fixed URL - Make sure we use the same URL structure as in the backend
                    // Remove the /api prefix since the backend route doesn't have it
                    const directResponse = await fetch(`${API_URL}/api/crops/user`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache, no-store',
                            'Pragma': 'no-cache'
                        }
                    });

                    if (!directResponse.ok) {
                        console.error(`Direct fetch error: ${directResponse.status} - ${directResponse.statusText}`);

                        // Debug the URL being called
                        console.error(`URL used: ${API_URL}/api/crops/user`);

                        // Try to get more details about the error
                        const errorText = await directResponse.text();
                        console.error('Error response text:', errorText);
                    } else {
                        const directData = await directResponse.json();
                        console.log('Direct fetch result:', directData);

                        if (Array.isArray(directData) && directData.length > 0) {
                            console.log('Using data from direct fetch');
                            console.timeEnd('getUserCrops');
                            return directData;
                        }
                    }
                }
            } catch (directErr) {
                console.error('Error with direct fetch approach:', directErr);
            }

            // Use axios directly to match other service methods
            console.log('Attempting axios call to /crops/user');
            const response = await api.get('/crops/user', {
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                }
            });

            console.log('Get user crops response:', response.status, response.statusText);
            console.log('Get user crops data received:', response.data);

            // Handle potential data formats
            if (response.data && Array.isArray(response.data)) {
                console.timeEnd('getUserCrops');
                return response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                console.timeEnd('getUserCrops');
                return response.data.data;
            } else {
                console.error('Unexpected data format for user crops:', response.data);
                console.timeEnd('getUserCrops');
                return [];
            }
        } catch (error: any) {
            console.error('Error fetching user crops (axios):', error);
            // Additional log to see the response structure if available
            if (error.response) {
                console.error('Error response details:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            }
            console.timeEnd('getUserCrops');
            // Return empty array instead of throwing
            return [];
        }
    },

    getById: async (id: number): Promise<any> => {
        try {
            const response = await fetch(`${API_URL}/api/crops/${id}`);
            console.log(`Get crop ${id} response status:`, response.status);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Get crop ${id} data received:`, data);
            return data;
        } catch (error) {
            console.error(`Error fetching crop ${id}:`, error);
            throw error;
        }
    },

    create: async (cropData: FormData): Promise<any> => {
        try {
            console.log('Creating crop with FormData:');
            for (const pair of cropData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const token = getToken();
            console.log('Using token for request:', token ? 'Present' : 'Not present');

            const response = await fetch(`${API_URL}/api/crops`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: cropData
            });

            console.log('Create crop response status:', response.status);

            // Get raw response body text
            const responseText = await response.text();
            console.log('Create crop raw response text:', responseText);

            if (!response.ok) {
                let errorMsg = `Error: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.message) {
                        errorMsg = errorData.message;
                    } else if (errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (e) {
                    // Could not parse as JSON, use text as is
                    if (responseText) {
                        errorMsg = responseText;
                    }
                }
                throw new Error(errorMsg);
            }

            try {
                // Try to parse response as JSON
                return JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                return responseText;
            }
        } catch (error) {
            console.error('Error creating crop:', error);
            throw error;
        }
    },

    update: async (id: number, cropData: FormData): Promise<any> => {
        try {
            console.log(`Updating crop ${id} with FormData:`);
            for (const pair of cropData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const token = getToken();
            console.log('Using token for request:', token ? 'Present' : 'Not present');

            const response = await fetch(`${API_URL}/api/crops/${id}`, {
                method: 'POST', // Using POST for FormData with _method field
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: cropData
            });

            console.log('Update crop response status:', response.status);

            // Get raw response body text
            const responseText = await response.text();
            console.log('Update crop raw response text:', responseText);

            if (!response.ok) {
                let errorMsg = `Error: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.message) {
                        errorMsg = errorData.message;
                    } else if (errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (e) {
                    // Could not parse as JSON, use text as is
                    if (responseText) {
                        errorMsg = responseText;
                    }
                }
                throw new Error(errorMsg);
            }

            try {
                // Try to parse response as JSON
                return JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                return responseText;
            }
        } catch (error) {
            console.error(`Error updating crop ${id}:`, error);
            throw error;
        }
    },

    delete: async (id: number): Promise<void> => {
        try {
            const token = getToken();
            console.log(`Deleting crop ${id}, token:`, token ? 'Present' : 'Not present');

            const response = await fetch(`${API_URL}/api/crops/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Delete crop response status:', response.status);

            if (!response.ok) {
                const responseText = await response.text();
                console.error('Delete crop error response:', responseText);
                throw new Error(`Error: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error deleting crop ${id}:`, error);
            throw error;
        }
    }
};

// Handle unauthorized responses
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Only redirect if not already on an auth page
        const currentPath = window.location.pathname;
        const authPaths = ['/login', '/register', '/forgot-password'];

        // If unauthorized or token expired and not on an auth page
        if (error.response?.status === 401 && !authPaths.includes(currentPath)) {
            // Remove token and redirect to login
            removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
