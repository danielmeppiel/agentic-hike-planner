import { UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';

/**
 * Chat header component displaying the application title, logo, and user authentication state.
 * Shows sign-in button for unauthenticated users or user menu with settings and sign-out
 * options for authenticated users.
 * 
 * @example
 * ```tsx
 * import { ChatHeader } from './ChatHeader';
 * 
 * function ChatInterface() {
 *   return (
 *     <div>
 *       <ChatHeader />
 *       <div>Chat content goes here</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function ChatHeader() {
  const { user, isAuthenticated, signOut } = useAuthStore();

  return (
    <header className="glass-dark border-b border-white/10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🏔️</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Hike Planner AI</h1>
            <p className="text-white/70 text-sm">Your intelligent hiking companion</p>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-white">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{user?.name || 'Hiker'}</span>
              </div>
              
              <button
                onClick={() => {/* TODO: Open settings */}}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Settings"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={signOut}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {/* TODO: Open auth modal */}}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
