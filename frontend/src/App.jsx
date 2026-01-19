import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { useAuth } from './auth/AuthContext';
import AppRouter from './routes/AppRouter';
import Header from './components/Header';
import HamburgerDrawer from './components/HamburgerDrawer';
import FloatingMessages from './components/FloatingMessages';
import './App.css';

const AppContent = () => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      {user && (
        <>
          <Header onMenuClick={() => setIsDrawerOpen(true)} />
          <HamburgerDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
          />
          <FloatingMessages />
        </>
      )}
      <AppRouter />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <AppContent />
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
