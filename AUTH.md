# Authentication System Documentation

This document provides an overview of the authentication system used in the Farm Management Service.

## Overview

The authentication system uses Laravel Sanctum on the backend and a token-based authentication system on the frontend. It provides:

- User registration
- Login with optional "remember me" functionality
- Password reset flow
- User profile management
- Protected routes
- Automatic token refresh
- Security against CSRF and XSS attacks

## Backend Implementation

The backend uses Laravel Sanctum for API token authentication. Here's how it's implemented:

1. **AuthController**: Handles user authentication operations like login, register, logout, etc.
2. **Routes**: API routes in `routes/api.php` define both public and protected endpoints.
3. **Middleware**: Protected routes use the `auth:sanctum` middleware.

## Frontend Implementation

The frontend implements authentication using the following components:

1. **API Service**: `api.ts` handles all API calls with automatic token handling.
2. **Auth Manager**: `auth.ts` provides a singleton instance for managing authentication state.
3. **Protected Route**: `ProtectedRoute.tsx` component restricts access to authenticated users.
4. **Logout Button**: `LogoutButton.tsx` component for logging users out.

## Token Handling

Authentication tokens are managed as follows:

1. On login/register, the token is stored in localStorage as `access_token`.
2. All API requests include the token in the Authorization header.
3. If a 401 Unauthorized response is received, the user is automatically logged out and redirected to the login page.
4. On logout, the token is removed from localStorage.

## How to Use

### Protected Routes

Wrap components that should only be accessible to authenticated users:

```tsx
import ProtectedRoute from '../components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Authentication State

Use the Auth service to check authentication status and get user info:

```tsx
import Auth from '../services/auth';

function UserProfile() {
  const user = Auth.getUser();
  const isAuthenticated = Auth.isUserAuthenticated();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {/* Other profile content */}
    </div>
  );
}
```

### Login/Logout

```tsx
// Login example
const handleLogin = async () => {
  const success = await Auth.login(email, password, rememberMe);
  if (success) {
    navigate('/dashboard');
  } else {
    setError('Invalid credentials');
  }
};

// Logout example
import LogoutButton from '../components/LogoutButton';

function NavBar() {
  return (
    <nav>
      {/* Other nav items */}
      <LogoutButton />
    </nav>
  );
}
```

## Security Considerations

1. Tokens are stored in localStorage, which means they are vulnerable to XSS attacks.
2. The backend uses CSRF protection and secure, HttpOnly cookies for the session.
3. All sensitive operations require authentication.
4. Passwords are hashed using bcrypt.

## Troubleshooting

If you encounter authentication issues:

1. Check browser console for errors
2. Verify that localStorage has a valid token
3. Check network requests to see if the token is being sent correctly
4. Try clearing localStorage and logging in again
