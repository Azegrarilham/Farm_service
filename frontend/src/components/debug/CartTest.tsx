import { useState } from 'react';
import api from '../../services/api';
import { debugCartAPI } from '../../services/debugAPI';

const CartTest = () => {
    const [result, setResult] = useState<string>('No test run yet');
    const [loading, setLoading] = useState<boolean>(false);
    const [token, setToken] = useState<string>(localStorage.getItem('access_token') || 'No token found');
    const [supplyId, setSupplyId] = useState<number>(1);
    const [quantity, setQuantity] = useState<number>(1);

    const testCartAdd = async () => {
        setLoading(true);
        setResult('Testing with normal API...');

        try {
            // Log the token
            console.log('Token:', token);

            // Make a direct API call with correct path
            const response = await api.post('/cart/add', {
                supply_id: supplyId,
                quantity
            });

            setResult(`Success with normal API! Response: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error: any) {
            console.error('Cart test error:', error);
            let errorMessage = 'Unknown error';

            if (error.response) {
                errorMessage = `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setResult(`Error with normal API: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const testDebugCartAdd = async () => {
        setLoading(true);
        setResult('Testing with debug API...');

        try {
            // Make a call using our debug API
            const result = await debugCartAPI.addToCart(supplyId, quantity);

            setResult(`Success with debug API! Response: ${JSON.stringify(result, null, 2)}`);
        } catch (error: any) {
            console.error('Debug API cart test error:', error);
            setResult(`Error with debug API: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testCartGet = async () => {
        setLoading(true);
        setResult('Getting cart with normal API...');

        try {
            // Make a direct API call with correct path
            const response = await api.get('/cart');

            setResult(`Success getting cart! Response: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error: any) {
            console.error('Cart get error:', error);
            let errorMessage = 'Unknown error';

            if (error.response) {
                errorMessage = `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setResult(`Error getting cart: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const testDebugCartGet = async () => {
        setLoading(true);
        setResult('Getting cart with debug API...');

        try {
            // Make a call using our debug API
            const result = await debugCartAPI.getCart();

            setResult(`Success getting cart with debug API! Response: ${JSON.stringify(result, null, 2)}`);
        } catch (error: any) {
            console.error('Debug API cart get error:', error);
            setResult(`Error getting cart with debug API: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Cart API Test</h1>

            <div className="mb-4 p-4 bg-gray-100 rounded">
                <h2 className="font-bold">Current Token:</h2>
                <pre className="bg-gray-200 p-2 mt-2 rounded overflow-x-auto text-xs">
                    {token || 'No token found'}
                </pre>
            </div>

            <div className="mb-4 p-4 bg-gray-100 rounded">
                <h2 className="font-bold mb-2">Test Parameters:</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                        <label htmlFor="supplyId" className="block text-sm font-medium text-gray-700">Supply ID:</label>
                        <input
                            type="number"
                            id="supplyId"
                            value={supplyId}
                            onChange={(e) => setSupplyId(parseInt(e.target.value) || 1)}
                            className="form-input mt-1 block w-full"
                        />
                    </div>

                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity:</label>
                        <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="form-input mt-1 block w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
                <button
                    onClick={testCartAdd}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? 'Testing...' : 'Test Regular Add to Cart'}
                </button>

                <button
                    onClick={testDebugCartAdd}
                    disabled={loading}
                    className="btn btn-secondary"
                >
                    {loading ? 'Testing...' : 'Test Debug Add to Cart'}
                </button>

                <button
                    onClick={testCartGet}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? 'Getting...' : 'Get Cart (Regular)'}
                </button>

                <button
                    onClick={testDebugCartGet}
                    disabled={loading}
                    className="btn btn-secondary"
                >
                    {loading ? 'Getting...' : 'Get Cart (Debug)'}
                </button>
            </div>

            <div className="mt-6">
                <h2 className="font-bold mb-2">Result:</h2>
                <pre className="bg-gray-200 p-4 rounded whitespace-pre-wrap overflow-x-auto text-xs">
                    {result}
                </pre>
            </div>
        </div>
    );
};

export default CartTest;
