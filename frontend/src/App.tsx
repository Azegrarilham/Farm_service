import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeApi } from './services/api';

// Auth components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import UserProfile from './components/auth/UserProfile';

// Farm components
import Dashboard from './components/dashboard/Dashboard';
import FarmList from './components/farms/FarmList';
import FarmDetail from './components/farms/FarmDetail';
import FarmForm from './components/farms/FarmForm';

// Product components
import ProductForm from './components/products/ProductForm';

// Supply components
import SupplyList from './components/supplies/SupplyList';
import SupplyDetail from './components/supplies/SupplyDetail';
import Cart from './components/cart/Cart';

// Crop components
import CropListings from './components/crops/CropListings';
import SellCropsForm from './components/crops/SellCropsForm';
import NewCropListings from './components/crops/NewCropListings';
import CropTroubleshooter from './components/crops/CropTroubleshooter';

// Debug components
import CartTest from './components/debug/CartTest';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Check if token exists on initial load and initialize API
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);

    // Initialize API with CSRF cookie
    initializeApi().catch(error => {
      console.error('Failed to initialize API:', error);
    });
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <Layout>
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout>
              <RegisterForm />
            </Layout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Layout>
              <ForgotPasswordForm />
            </Layout>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/farms"
          element={
            <ProtectedRoute>
              <Layout>
                <FarmList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/farms/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <FarmDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/farms/add"
          element={
            <ProtectedRoute>
              <Layout>
                <FarmForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/farms/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <FarmForm isEditing={true} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/farms/:id/products/add"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductForm isEditing={true} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <UserProfile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Supply Routes */}
        <Route
          path="/supplies"
          element={
            <Layout>
              <ErrorBoundary>
                <SupplyList />
              </ErrorBoundary>
            </Layout>
          }
        />
        <Route
          path="/supplies/:id"
          element={
            <Layout>
              <ErrorBoundary>
                <SupplyDetail />
              </ErrorBoundary>
            </Layout>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Layout>
                <Cart />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Sell Crops Routes */}
        <Route
          path="/sell-crops"
          element={
            <ProtectedRoute>
              <Layout>
                <NewCropListings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell-crops/add"
          element={
            <ProtectedRoute>
              <Layout>
                <SellCropsForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell-crops/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <SellCropsForm isEditing={true} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Crop Troubleshooter */}
        <Route
          path="/crop-troubleshooter"
          element={
            <ProtectedRoute>
              <Layout>
                <CropTroubleshooter />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Debug Routes - Temporary */}
        <Route
          path="/debug/cart-test"
          element={
            <Layout>
              <CartTest />
            </Layout>
          }
        />

        {/* Redirect to login or dashboard based on auth state */}
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
