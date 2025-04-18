import { useState } from 'react';
import { AuthService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            const response = await AuthService.forgotPassword(email);
            setSuccessMessage(response.message || 'Password reset link sent to your email.');
            // Clear the form
            setEmail('');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card max-w-md mx-auto">
            <div className="flex flex-col items-center mb-6">
                <div className="bg-farm-green-100 p-3 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-farm-green-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
                <p className="text-gray-600">Enter your email to receive a password reset link</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        placeholder="your@email.com"
                        required
                    />
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
                    Reset Password
                </button>
            </form>

            <div className="flex items-center justify-center mt-6">
                <button
                    onClick={() => navigate('/login')}
                    className="text-farm-green-600 hover:text-farm-green-800 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;
