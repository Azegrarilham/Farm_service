import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { AuthService } from '../../services/api';
import { AuthUser } from '../../types/farm';

const UserProfile = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Profile edit state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Password change state
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await AuthService.getUser();
                setUser(userData);
                setName(userData.name);
                setEmail(userData.email);

                if (userData.profilePicture) {
                    setPreviewUrl(userData.profilePicture);
                }
            } catch (error) {
                setError('Failed to load user profile. Please try again.');
                console.error('Error fetching user profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);

            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);

        if (profileImage) {
            formData.append('profile_picture', profileImage);
        }

        try {
            const updatedUser = await AuthService.updateProfile(formData);
            setUser(updatedUser);
            setSuccess('Profile updated successfully!');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const validatePasswordForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        if (!newPassword) {
            errors.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'New password must be at least 8 characters';
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validatePasswordForm()) {
            return;
        }

        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            await AuthService.changePassword(currentPassword, newPassword, confirmPassword);
            setSuccess('Password changed successfully!');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !user) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-green-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Profile</h2>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card md:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>

                    <form onSubmit={handleProfileSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="form-label">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="profilePicture" className="form-label">Profile Picture</label>
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
                                        Change
                                        <input
                                            type="file"
                                            id="profilePicture"
                                            onChange={handleImageChange}
                                            className="sr-only"
                                            accept="image/*"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Security</h3>

                    {isChangingPassword ? (
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className={`form-input ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                                    />
                                    {passwordErrors.currentPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={`form-input ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                                    />
                                    {passwordErrors.newPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`form-input ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                                    />
                                    {passwordErrors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setIsChangingPassword(false)}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary"
                                >
                                    {isLoading ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-6">
                                Change your password to keep your account secure.
                            </p>
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="btn btn-outline w-full"
                            >
                                Change Password
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
