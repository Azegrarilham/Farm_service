import { useState, useRef } from 'react';
import { RegisterData } from '../../types/farm';
import { AuthService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<RegisterData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear specific error when field is edited
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicture(file);

            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Clear any profile picture error
            if (errors.profile_picture) {
                setErrors({
                    ...errors,
                    profile_picture: '',
                });
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const registrationData: RegisterData = {
                ...formData,
            };

            // Add profile picture if selected
            if (profilePicture) {
                registrationData.profile_picture = profilePicture;
            }

            await AuthService.register(registrationData);
            navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setError(error.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card max-w-md mx-auto">
            <div className="flex flex-col items-center mb-6">
                <div className="bg-farm-green-100 p-3 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-farm-green-600">
                        <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.766.766 0 01-.752.743H4.003a.766.766 0 01-.752-.743l-.001-.119.001-.003z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Create an Account</h2>
                <p className="text-gray-600">Join us to manage your farm efficiently</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="John Doe"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="profile_picture" className="form-label">Profile Picture (Optional)</label>
                    <div className="mt-1 flex items-center">
                        <div className="mr-4">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Profile preview"
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <label className="btn btn-outline text-sm cursor-pointer">
                            Upload Photo
                            <input
                                type="file"
                                id="profile_picture"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="sr-only"
                                accept="image/*"
                            />
                        </label>
                    </div>
                    {errors.profile_picture && <p className="mt-1 text-sm text-red-600">{errors.profile_picture}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="mb-6">
                    <label htmlFor="password_confirmation" className="form-label">Confirm Password</label>
                    <input
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        className={`form-input ${errors.password_confirmation ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
                    />
                    {errors.password_confirmation && (
                        <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                    )}
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
                    Create Account
                </button>
            </form>

            <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-farm-green-600 hover:text-farm-green-800 font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
