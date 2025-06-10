import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Main application layout component that provides the overall structure for the app.
 * Includes a header, sidebar navigation, and main content area using React Router's Outlet.
 * Manages sidebar open/close state for mobile responsiveness.
 * 
 * @example
 * ```tsx
 * import { BrowserRouter, Routes, Route } from 'react-router-dom';
 * import { AppLayout } from './components/layout/AppLayout';
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         <Route path="/" element={<AppLayout />}>
 *           <Route index element={<HomePage />} />
 *           <Route path="trips" element={<TripsPage />} />
 *         </Route>
 *       </Routes>
 *     </BrowserRouter>
 *   );
 * }
 * ```
 */
export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-6 md:ml-0 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};