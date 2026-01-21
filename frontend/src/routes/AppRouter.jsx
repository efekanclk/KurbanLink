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

// Partnerships
import Partnerships from '../pages/partnerships/Partnerships';
import PartnershipDetail from '../pages/partnerships/PartnershipDetail';

// Seller pages
import SellerListings from '../pages/seller/SellerListings';
import NewListing from '../pages/seller/NewListing';
import EditListing from '../pages/seller/EditListing';

// Butcher pages
import ButcherAppointments from '../pages/butcher/ButcherAppointments';

// Butcher discovery
import ButcherList from '../pages/butchers/ButcherList';
import ButcherDetail from '../pages/butchers/ButcherDetail';
import AppointmentBooking from '../pages/butchers/AppointmentBooking';

// Messages
import MessagesPage from '../pages/messages/MessagesPage';
import NavigateToConversation from '../components/common/NavigateToConversation';

// Notifications
import Notifications from '../pages/Notifications';

// Profile
import Profile from '../pages/Profile';
import ProfileEdit from '../pages/ProfileEdit';

const AppRouter = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/animals/:id" element={<AnimalDetail />} />

            {/* Protected routes */}
            <Route path="/coming-soon" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

            {/* Messages routes */}
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/messages/:conversationId" element={<NavigateToConversation />} />

            {/* Notifications */}
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            {/* Profile */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />

            {/* Seller routes */}
            <Route path="/seller/listings" element={<ProtectedRoute><SellerListings /></ProtectedRoute>} />
            <Route path="/seller/listings/new" element={<ProtectedRoute><NewListing /></ProtectedRoute>} />
            <Route path="/seller/listings/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />

            {/* Butcher discovery routes */}
            <Route path="/butchers" element={<ProtectedRoute><ButcherList /></ProtectedRoute>} />
            <Route path="/butchers/:id" element={<ProtectedRoute><ButcherDetail /></ProtectedRoute>} />
            <Route path="/butchers/:id/book" element={<ProtectedRoute><AppointmentBooking /></ProtectedRoute>} />

            {/* Butcher routes */}
            <Route path="/butcher/appointments" element={<RoleProtectedRoute requiredRole="BUTCHER"><ButcherAppointments /></RoleProtectedRoute>} />

            {/* Partnerships route */}
            <Route path="/partnerships" element={<ProtectedRoute><Partnerships /></ProtectedRoute>} />
            <Route path="/partnerships/:id" element={<ProtectedRoute><PartnershipDetail /></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRouter;
