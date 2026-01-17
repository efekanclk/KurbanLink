import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AnimalsList from '../pages/AnimalsList';
import AnimalDetail from '../pages/AnimalDetail';
import Favorites from '../pages/Favorites';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <FavoritesProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <AnimalsList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/animals/:id"
                            element={
                                <ProtectedRoute>
                                    <AnimalDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/favorites"
                            element={
                                <ProtectedRoute>
                                    <Favorites />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </FavoritesProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppRouter;
