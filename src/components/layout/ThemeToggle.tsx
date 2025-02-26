import React from 'react';
import { HelpCircle } from 'lucide-react';

// This component now serves as a help button instead of a theme toggle
export const ThemeToggle = () => {
  const handleHelpClick = () => {
    alert('Need help? Contact support at support@example.com');
  };

  return (
    <button
      onClick={handleHelpClick}
      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
      aria-label="Get help"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
};
