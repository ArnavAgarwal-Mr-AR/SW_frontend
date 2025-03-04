import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const CreatePodcast = () => {
  const [inviteKey, setInviteKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const createPodcast = async () => {
      setError('');

      const title = new Date().toLocaleString(); // Set title to current date and time

      try {
        const response = await fetch('https://backend-pdis.onrender.com/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title })
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        setInviteKey(data.inviteKey);
        navigate(`/session/${data.inviteKey}`); // Navigate to session page
      } catch (error) {
        console.error('Create session error:', error);
        setError('Failed to create session');
      }
    };

    createPodcast();
  }, [navigate, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-login-background">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-6 transition-all duration-300 hover:shadow-2xl">
          <h1 className="text-3xl font-bold mb-6">Creating Podcast...</h1>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
};