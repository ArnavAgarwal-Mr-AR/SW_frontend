import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePodcastStore } from '../../store/podcastStore';
import axios from 'axios';


export const JoinPodcast = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteKey = searchParams.get('key'); // Get invite key from URL
  const user = useAuthStore((state) => state.user);
  const joinSession = usePodcastStore((state) => state.joinSession);
  const [setInviteKey] = useState('');
  const [error, setError] = useState('');
  const token = useAuthStore((state) => state.token);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('Join session button clicked');
    console.log('Invite Key:', inviteKey);

    try {
      const response = await axios.post('/join-session', { inviteKey });
      console.log('Response:', response.data);

      if (response.data.success) {
        // Navigate to the session page
        navigate(`/session/${response.data.sessionId}`);
      } else {
        setMessage('Invalid invite key or session not available.');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        setMessage(error.response.data);
      } else {
        setMessage('An error occurred while joining the session.');
      }
    }
  };
  useEffect(() => {
    if (!inviteKey) {
      navigate('/dashboard'); // Redirect if no invite key
      return;
    }

    if (!user) {
      // Store invite key temporarily & redirect to login
      localStorage.setItem('pending_invite_key', inviteKey);
      navigate('/login'); // Redirect to login page
    } else {
      // If user is logged in, join session immediately
      joinSession(inviteKey)
        .then((success) => {
          if (success) navigate(`/session/${inviteKey}`);
          else navigate('/dashboard'); // Redirect if session invalid
        })
        .catch(() => navigate('/dashboard'));
    }
  }, [inviteKey, user, joinSession, navigate]);

  return <div>Joining session...</div>;
  return (
    <div className="max-w-md mx-auto pt-16">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Join Podcast</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="inviteKey" className="block text-sm font-medium mb-2">
              Enter Invite Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="inviteKey"
                type="text"
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border rounded-md"
                placeholder="Enter 13-character key"
                required
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700"
          >
            Join Session
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
      </div>
    </div>
  );
};