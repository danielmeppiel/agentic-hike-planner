import React from 'react';
import { Button } from '../ui';

interface HeaderProps {
  /** Callback function called when the mobile menu button is clicked */
  onMenuClick: () => void;
}

/**
 * Application header component with navigation menu toggle and user interface.
 * Features a glass-morphism design with the app logo, title, and user avatar/sign-out functionality.
 * Includes a mobile-responsive menu button for sidebar navigation.
 * 
 * @param props - Component props
 * @param props.onMenuClick - Function called when the mobile menu button is clicked
 * 
 * @example
 * ```tsx
 * function AppLayout() {
 *   const [sidebarOpen, setSidebarOpen] = useState(false);
 * 
 *   return (
 *     <div>
 *       <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
 *       <main>Content goes here</main>
 *     </div>
 *   );
 * }
 * ```
 */
export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="glass border-b border-white/20 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/20 md:hidden transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold font-display text-gray-900">Agentic Hike Planner</h1>
                <p className="text-xs text-gray-600 hidden sm:block">AI-Powered Adventure Planning</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">JD</span>
              </div>
              <span className="text-gray-700 font-medium">John Doe</span>
            </div>
            <Button variant="ghost" size="sm" icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
              </svg>
            }>
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};