import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const passwordRequirements = [
    { regex: /.{10,}/, message: 'At least 10 characters' },
    { regex: /[A-Z]/, message: 'At least one uppercase letter' },
    { regex: /[a-z]/, message: 'At least one lowercase letter' },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, message: 'At least one special character' },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.regex.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isPasswordValid) {
      setError('Password does not meet the requirements.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://round-gamefowl-spinning-wheel-5f6fd78e.koyeb.app/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password
        })
      });

      let data;
      try {
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-login-background">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-6 transition-all duration-300 hover:shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-800 mb-8">
            Join Us Today
          </h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="group relative transition-all duration-300">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-blue-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full rounded-lg border border-gray-200 pl-10 py-3 text-gray-800 bg-gray-50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-100 focus:bg-white"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="group relative transition-all duration-300">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-blue-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full rounded-lg border border-gray-200 pl-10 py-3 text-gray-800 bg-gray-50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-100 focus:bg-white"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="group relative transition-all duration-300">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Create Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-blue-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full rounded-lg border border-gray-200 pl-10 py-3 text-gray-800 bg-gray-50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-100 focus:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-blue-400 group-hover:text-blue-500 transition-colors" /> : <Eye className="h-5 w-5 text-blue-400 group-hover:text-blue-500 transition-colors" />}
                  </div>
                </div>
                <ul className="mt-2 text-sm text-gray-600">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className={req.regex.test(password) ? 'text-green-600' : 'text-red-600'}>
                      {req.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserPlus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                </span>
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 px-6 py-3 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
