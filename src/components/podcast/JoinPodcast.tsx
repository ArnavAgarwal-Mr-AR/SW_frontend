import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowRight, Info } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const autoJoinSession = async () => {
      if (!initialKey) return; // Don't trigger if no key in URL

      if (!user) {
        // Store the invite key for later use after login
        localStorage.setItem('pending_invite_key', initialKey);
        navigate('/login');
        return;
      }

      // Try to join with the key from URL
      await handleJoinSession(initialKey);
    };

    autoJoinSession();
  }, [initialKey, user, joinSession, navigate]);

  const handleJoinSession = async (key) => {
    if (!key.trim()) {
      setError('Please enter an invite key');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('Joining session...');

    try {
      const response = await axios.post(
        'https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app/api/join-session',
        { inviteKey: key.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // We received a valid session response, navigate to it
        navigate(`/session/${response.data.sessionId}`);
      } else {
        setError('Failed to join session: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Join session error:', error);
      if (error.response?.status === 404) {
        setError('Invalid invite key or session has expired');
      } else {
        setError('Failed to join session. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleJoinSession(inputKey);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-login-background">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-6 transition-all duration-300 hover:shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-800 mb-4">
            Join Podcast
          </h2>
          
          <p className="text-center text-gray-500 mb-8">
            Enter the invite key provided by the podcast host to join the session
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
              <Info className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-blue-50 text-blue-600 p-4 rounded-lg mb-6 flex items-center gap-3">
              <Info className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="invite-key" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Invite Key
              </label>
              <input
                id="invite-key"
                name="invite-key"
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="focus:ring-2 focus:ring-indigo-500 focus:border-transparent block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-800 bg-gray-50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-100 focus:bg-white"
                placeholder="Enter invite key"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputKey.trim()}
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              </span>
              <span className="flex items-center">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </>
                ) : (
                  <>
                    Join Podcast
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};