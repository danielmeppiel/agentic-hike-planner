import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import type { SignUpCredentials } from '../types';

interface SignUpFormProps {
  onSuccess: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [credentials, setCredentials] = useState<SignUpCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const { signUp, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!credentials.name || !credentials.email || !credentials.password || !credentials.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(credentials.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (credentials.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signUp(credentials);
      onSuccess();
    } catch (error) {
      setError('Failed to create account. Please try again.');
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={credentials.name}
          onChange={(e) => setCredentials({ ...credentials, name: e.target.value })}
          className="w-full px-4 py-3 bg-white/90 border border-white/20 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="Enter your full name"
          required
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="block text-white text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="signup-email"
          value={credentials.email}
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          className="w-full px-4 py-3 bg-white/90 border border-white/20 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-white text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="signup-password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            className="w-full px-4 py-3 bg-white/90 border border-white/20 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-12"
            placeholder="Create a password"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-white text-sm font-medium mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirm-password"
            value={credentials.confirmPassword}
            onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
            className="w-full px-4 py-3 bg-white/90 border border-white/20 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-12"
            placeholder="Confirm your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="text-center">
        <p className="text-white/60 text-sm">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </form>
  );
}