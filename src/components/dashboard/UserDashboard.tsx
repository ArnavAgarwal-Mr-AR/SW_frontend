import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePodcastStore } from '../../store/podcastStore';
import { PodcastOptions } from './PodcastOptions';
import { PodcastList } from './PodcastList';

export const UserDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const fetchSavedPodcasts = usePodcastStore((state) => state.fetchSavedPodcasts);
  const savedPodcasts = usePodcastStore((state) => state.savedPodcasts);
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    if (user) {
      console.log('Fetching saved podcasts for user:', user);
      fetchSavedPodcasts();
    }
  }, [user, fetchSavedPodcasts]);

  console.log('Saved podcasts:', savedPodcasts);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen dashboard-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="dashboard-header">
            Welcome back, {user.name}
          </h1>
          <button
            onClick={() => navigate('/settings')}
            className="dashboard-button"
            aria-label="Settings"
          >
            <Settings className="h-6 w-6 text-blue-600" />
          </button>
        </div>

        <section className="mb-12">
          <h2 className="dashboard-section-title">
            Start a New Session
          </h2>
          <PodcastOptions />
        </section>

        <section>
          <h2 className="dashboard-section-title">
            Recent Sessions
          </h2>
          {savedPodcasts.length > 0 ? (
            <PodcastList podcasts={savedPodcasts} />
          ) : (
            <p className="dashboard-no-sessions">No past sessions found.</p>
          )}
        </section>

        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};