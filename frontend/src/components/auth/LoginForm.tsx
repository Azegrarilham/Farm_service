import { useState } from 'react';
import { LoginCredentials } from '../../types/farm';
import { useNavigate } from 'react-router-dom';
import { LoginService } from '../../services/loginService';

interface LoginFormProps {
    onLoginSuccess: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState<LoginCredentials>({
        email: '',
        password: '',
        remember: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setCredentials({
            ...credentials,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const success = await LoginService.login(credentials);

            if (success) {
                onLoginSuccess();

                // Check if we have a redirect parameter
                const urlParams = new URLSearchParams(window.location.search);
                const redirectPath = urlParams.get('redirect');

                if (redirectPath) {
                    // Navigate to the requested page
                    console.log('Redirecting to:', redirectPath);
                    navigate(redirectPath);
                } else {
                    // Otherwise go to dashboard
                    navigate('/dashboard');
                }
            } else {
                setError('Failed to login. Please check your credentials.');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSuccess = async () => {
        // Check if we have a redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath = urlParams.get('redirect');

        if (redirectPath) {
            // Navigate to the requested page
            console.log('Redirecting to:', redirectPath);
            navigate(redirectPath);
        } else {
            // Otherwise go to dashboard
            navigate('/dashboard');
        }
    };

    return (
        <div className="card max-w-md mx-auto">
            <div className="flex flex-col items-center mb-6">
                <div className="bg-farm-green-100 p-3 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-farm-green-600">
                        <path d="M19.5 6c-2.61 0-4.717 2.015-4.717 4.5v.75h-10.5A2.25 2.25 0 0 0 2.25 13.5v8.25A2.25 2.25 0 0 0 4.5 24h15a2.25 2.25 0 0 0 2.25-2.25v-8.25A2.25 2.25 0 0 0 19.5 11.25v-.75c0-.839.677-1.5 1.5-1.5s1.5.661 1.5 1.5v.75c0 .69-.56 1.25-1.25 1.25h-.75V13h.75c1.38 0 2.5-1.12 2.5-2.5v-.75C23.75 7.23 21.77 6 19.5 6Z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Farm Manager Login</h2>
                <p className="text-gray-600">Welcome back! Please sign in to your account</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="your@email.com"
                    />
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center">
                        <label htmlFor="password" className="form-label">Password</label>
                        <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-sm text-farm-green-600 hover:text-farm-green-800"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="••••••••"
                    />
                </div>

                <div className="flex items-center mb-6">
                    <input
                        type="checkbox"
                        id="remember"
                        name="remember"
                        checked={credentials.remember}
                        onChange={handleChange}
                        className="h-4 w-4 text-farm-green-600 focus:ring-farm-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                        Remember me
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full flex justify-center items-center"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : null}
                    Sign In
                </button>
            </form>

            <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="text-farm-green-600 hover:text-farm-green-800 font-medium"
                    >
                        Create account
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
