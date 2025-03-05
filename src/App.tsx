import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { CreatePodcast } from './components/podcast/CreatePodcast';
import { JoinPodcast } from './components/podcast/JoinPodcast';
import { PodcastSession } from './components/podcast/PodcastSession';
import { SettingsPage } from './components/settings/SettingsPage';
import { ThemeToggle } from './components/layout/ThemeToggle';

const App = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setToken = useAuthStore((state) => state.setToken);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      // Optionally verify token with backend
    }
  }, [setToken]);

  return (
    <Router>
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <nav className="fixed top-0 right-0 m-4 z-50">
            <ThemeToggle />
          </nav>
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/dashboard" element={token ? <UserDashboard /> : <Navigate to="/" />} />
              <Route path="/create-podcast" element={token ? <CreatePodcast /> : <Navigate to="/" />} />
              <Route path="/join-podcast" element={token ? <JoinPodcast /> : <Navigate to="/" />} />
              <Route path="/session/:inviteKey" element={token ? <PodcastSession /> : <Navigate to="/" />} />
              <Route path="/settings" element={token ? <SettingsPage /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;