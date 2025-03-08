import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePodcastStore } from '../../store/podcastStore';
import axios from 'axios';

export const JoinPodcast = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialKey = searchParams.get('key') || ''; // Get invite key from URL (if present)
  const user = useAuthStore((state) => state.user);
  const joinSession = usePodcastStore((state) => state.joinSession);
  const [inputKey, setInputKey] = useState(initialKey); // Controlled input field
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const autoJoinSession = async () => {
      if (!initialKey) return; // Don't trigger if no key in URL

      if (!user) {
        localStorage.setItem('pending_invite_key', initialKey);
        navigate('/login'); // Redirect to login if not authenticated
        return;
      }

      try {
        const success = await joinSession(initialKey);
        if (success) {
          navigate(`/session/${initialKey}`);
        } else {
          setError('Invalid invite key or session not available.');
        }
      } catch (err) {
        setError('An error occurred while joining the session.');
      }
    };

    autoJoinSession(); // Call the function
  }, [initialKey, user, joinSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    console.log('Join session button clicked');
    console.log('Invite Key:', inputKey);

    try {
      const response = await axios.post(
        `https://backend-pdis.onrender.com/join-session`,
        { inviteKey: inputKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Server Response:', response.data);

      if (response.data.success) {
        console.log("Successfully joined session:", response.data.sessionId);
        navigate(`/session/${response.data.sessionId}`);
      } else {
        console.warn("Join failed:", response.data.message);
        setMessage('Invalid invite key or session not available.');
      }
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.warn("Server responded with error:", error.response.data);
        setMessage(error.response.data.message || 'An error occurred while joining the session.');
      } else {
        setMessage('An error occurred while joining the session.');
      }
    }
  };

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
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
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
