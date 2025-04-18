export interface User {
    id: number;
    name: string;
    email: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Farm {
    id: number;
    name: string;
    location: string;
    size?: number;
    size_unit?: 'acres' | 'hectares' | 'square_meters';
    description?: string;
    primary_crops?: string[];
    farming_methods?: string;
    photos?: string[];
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    established_date?: string;
    user_id: number;
    user?: AuthUser;
    created_at: string;
    updated_at: string;
}

export interface FarmFormData {
    name: string;
    location: string;
    size?: number;
    size_unit?: 'acres' | 'hectares' | 'square_meters';
    description?: string;
    primary_crops?: string[];
    farming_methods?: string;
    photos?: File[];
    latitude?: number;
    longitude?: number;
    established_date?: string;
    userId: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    price: number;
    farmId: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProductFormData {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    price: number;
    farmId: number;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    profilePicture?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    profile_picture?: File;
}

export interface FarmStatistics {
    totalFarms: number;
    totalProducts: number;
    recentActivities: Activity[];
}

export interface Activity {
    id: number;
    type: 'create' | 'update' | 'delete';
    entityType: 'farm' | 'product' | 'crop';
    entityId: number;
    entityName: string;
    timestamp: string;
    userId: number;
    userName: string;
}

export interface Supply {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    stock_quantity: number;
    unit: string;
    images: string[];
    sku: string;
    featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: number;
    supply_id: number;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    discount: number;
    total: number;
    image?: string;
    unit: string;
}

export interface Cart {
    id: number;
    items: CartItem[];
    subtotal: number;
    total_items: number;
}

export interface OrderAddress {
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    shipping_country: string;
    shipping_phone: string;
    notes?: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    supply_id: number;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
    supply?: Supply;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: number;
    user_id: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    shipping_country: string;
    shipping_phone: string;
    notes?: string;
    shipped_at?: string;
    delivered_at?: string;
    tracking_number?: string;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
}
