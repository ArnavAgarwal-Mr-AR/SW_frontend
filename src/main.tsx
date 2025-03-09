import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { CreatePodcast } from './components/podcast/CreatePodcast';
import { JoinPodcast } from './components/podcast/JoinPodcast';
import { PodcastSession } from './components/podcast/PodcastSession';
import { SettingsPage } from './components/settings/SettingsPage';
import App from './App';
import './index.css';

const NotFound = () => <h1>404 - Page Not Found</h1>;

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/dashboard/*" element={<UserDashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/create-podcast" element={<CreatePodcast />} />
        <Route path="/join-podcast" element={<JoinPodcast />} />
        <Route path="/session/:inviteKey" element={<PodcastSession />} />
        <Route path="*" element={<NotFound />} /> {/* 404 fallback */}
      </Routes>
    </Router>
  </React.StrictMode>
);
