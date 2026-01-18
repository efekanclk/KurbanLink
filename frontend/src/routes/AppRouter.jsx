import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import RoleProtectedRoute from '../auth/RoleProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Main pages
import Home from '../pages/Home';
import SearchPage from '../pages/SearchPage';
import AnimalsList from '../pages/AnimalsList';
import AnimalDetail from '../pages/AnimalDetail';
import Favorites from '../pages/Favorites';
import ComingSoon from '../pages/ComingSoon';

// Seller pages
import SellerListings from '../pages/seller/SellerListings';
import NewListing from '../pages/seller/NewListing';
import EditListing from '../pages/seller/EditListing';

// Butcher pages
import ButcherProfile from '../pages/butcher/ButcherProfile';
import ButcherAppointments from '../pages/butcher/ButcherAppointments';

// Butcher discovery
import ButcherList from '../pages/butchers/ButcherList';
import ButcherDetail from '../pages/butchers/ButcherDetail';

// Messages
import ConversationList from '../pages/messages/ConversationList';
import ConversationDetail from '../pages/messages/ConversationDetail';

// Notifications
import Notifications from '../pages/Notifications';

// Profile
import Profile from '../pages/Profile';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <FavoritesProvider>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected routes */}
                        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                        <Route path="/coming-soon" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
                        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

                        {/* Messages routes */}
                        <Route path="/messages" element={<ProtectedRoute><ConversationList /></ProtectedRoute>} />
                        <Route path="/messages/:conversationId" element={<ProtectedRoute><ConversationDetail /></ProtectedRoute>} />

                        {/* Notifications */}
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                        {/* Profile */}
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                        {/* Seller routes */}
                        <Route path="/seller/listings" element={<RoleProtectedRoute requiredRole="SELLER"><SellerListings /></RoleProtectedRoute>} />
                        <Route path="/seller/listings/new" element={<RoleProtectedRoute requiredRole="SELLER"><NewListing /></RoleProtectedRoute>} />
                        <Route path="/seller/listings/:id/edit" element={<RoleProtectedRoute requiredRole="SELLER"><EditListing /></RoleProtectedRoute>} />

                        {/* Butcher discovery routes */}
                        <Route path="/butchers" element={<ProtectedRoute><ButcherList /></ProtectedRoute>} />
                        <Route path="/butchers/:id" element={<ProtectedRoute><ButcherDetail /></ProtectedRoute>} />

                        {/* Butcher routes */}
                        <Route path="/butcher/profile" element={<RoleProtectedRoute requiredRole="BUTCHER"><ButcherProfile /></RoleProtectedRoute>} />
                        <Route path="/butcher/appointments" element={<RoleProtectedRoute requiredRole="BUTCHER"><ButcherAppointments /></RoleProtectedRoute>} />

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </FavoritesProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppRouter;
