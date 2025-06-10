import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  /** Whether the sidebar is currently open (for mobile) */
  isOpen: boolean;
  /** Callback function called when sidebar should be closed */
  onClose: () => void;
}

/**
 * Sidebar navigation component with responsive design.
 * Provides navigation links to different sections of the application.
 * Can be toggled open/closed on mobile devices with an overlay.
 * 
 * @param props - Component props
 * @param props.isOpen - Boolean indicating if sidebar is open (primarily for mobile)
 * @param props.onClose - Function called when sidebar should be closed (e.g., clicking overlay)
 * 
 * @example
 * ```tsx
 * function AppLayout() {
 *   const [sidebarOpen, setSidebarOpen] = useState(false);
 * 
 *   return (
 *     <div>
 *       <Sidebar 
 *         isOpen={sidebarOpen} 
 *         onClose={() => setSidebarOpen(false)} 
 *       />
 *       <main>{/* content */}</main>
 *     </div>
 *   );
 * }
 * ```
 */

const navigation = [
  { name: 'Dashboard', href: '/app', icon: 'home' },
  { name: 'Trip Planning', href: '/app/trips', icon: 'map' },
  { name: 'Trail Search', href: '/app/trails', icon: 'search' },
  { name: 'Profile', href: '/app/profile', icon: 'user' },
];

const getIcon = (iconName: string) => {
  const icons = {
    home: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
    map: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    ),
    search: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    ),
    user: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
  };
  return icons[iconName as keyof typeof icons] || icons.home;
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 glass border-r border-white/20
        transform transition-all duration-300 ease-in-out shadow-2xl
        md:translate-x-0 md:static md:inset-0 md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/20 md:hidden">
            <span className="text-xl font-bold font-display text-gray-900">Navigation</span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/20 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 px-6 py-8 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/30 hover:scale-105'
                  }`
                }
                onClick={() => {
                  // Close mobile sidebar on navigation
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
              >
                <div className={`mr-4 p-2 rounded-lg transition-all duration-200 ${
                  ({ isActive }: { isActive: boolean }) => isActive 
                    ? 'bg-white/20' 
                    : 'group-hover:bg-primary-100'
                }`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {getIcon(item.icon)}
                  </svg>
                </div>
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-6 border-t border-white/20">
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Need Help?</p>
                  <p className="text-xs text-gray-600">Get planning tips</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};