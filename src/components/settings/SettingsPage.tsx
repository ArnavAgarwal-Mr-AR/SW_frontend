import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { BACKEND_URL } from '../../config';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [name, setName] = useState(user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleNameChange = async () => {
    try {
      const response = await fetch(`https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app/api/updateName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update name');
      }

      const data = await response.json();
      updateUser(data.user);
      setMessage('Name updated successfully');
    } catch (error) {
      console.error('Error updating name:', error);
      setMessage('Failed to update name');
    }
  };

  const handleProfilePhotoChange = async () => {
    if (!profilePhoto) return;

    const formData = new FormData();
    formData.append('profilePhoto', profilePhoto);

    try {
      const response = await fetch(`https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app/api/updateProfilePhoto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile photo');
      }

      const data = await response.json();
      updateUser(data.user);
      setMessage('Profile photo updated successfully');
    } catch (error) {
      console.error('Error updating profile photo:', error);
      setMessage('Failed to update profile photo');
    }
  };

  const handlePasswordChange = async () => {
    try {
      const response = await fetch(`https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app/api/changePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      setMessage('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage('Failed to change password');
    }
  };

  return (
    <div className="min-h-screen dashboard-body">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>
        
        <h1 className="text-3xl font-bold mb-8 text-blue-600">Settings</h1>
        
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">
              Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleNameChange}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Name
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                <input
                  type="file"
                  onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none"
                />
                <button
                  onClick={handleProfilePhotoChange}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Profile Photo
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          </section>
        </div>

        {message && (
          <div className="mt-8 p-4 bg-green-100 text-green-800 rounded-md">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};