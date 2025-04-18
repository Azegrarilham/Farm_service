import { API_URL } from '../config';

// Helper to make a cart API call with explicit authorization
export const debugCartAPI = {
    addToCart: async (supplyId: number, quantity: number) => {
        // Get the token
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }

        try {
            const url = `${API_URL}/api/cart/add`;
            console.log('Making fetch request to:', url);
            console.log('With data:', { supply_id: supplyId, quantity });

            // Use fetch instead of axios
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    supply_id: supplyId,
                    quantity
                }),
                credentials: 'include', // Include cookies
            });

            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Debug cart API error:', error);
            throw error;
        }
    },

    getCart: async () => {
        // Get the token
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }

        try {
            const url = `${API_URL}/api/cart`;
            console.log('Making fetch request to:', url);

            // Use fetch instead of axios
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                credentials: 'include', // Include cookies
            });

            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Debug get cart error:', error);
            throw error;
        }
    }
};
