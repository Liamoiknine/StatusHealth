'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-72'} bg-[#1a2540] min-h-screen border-r border-gray-800 flex flex-col transition-all duration-300 relative`}>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-10 bg-[#1a2540] border border-gray-700 rounded-full p-1.5 hover:bg-gray-800 transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg 
          className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Navigation */}
      <nav className={`${isCollapsed ? 'px-2' : 'px-4'} pt-10 pb-2`}>
        {/* Dashboard */}
        <Link href="/dashboard" className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors`} title={isCollapsed ? 'Dashboard' : ''}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        {/* View Results */}
        <Link href="/categories" className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors`} title={isCollapsed ? 'View Results' : ''}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {!isCollapsed && <span>View Results</span>}
        </Link>

        {/* Billing */}
        <Link href="/billing" className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors`} title={isCollapsed ? 'Billing' : ''}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {!isCollapsed && <span>Billing</span>}
        </Link>

        {/* Settings */}
        <Link href="/settings" className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors`} title={isCollapsed ? 'Settings' : ''}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {/* Help */}
        <Link href="/help" className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors`} title={isCollapsed ? 'Help' : ''}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!isCollapsed && <span>Help</span>}
        </Link>
      </nav>

      {/* Bottom Section */}
      {!isCollapsed && (
        <div className="px-4 pb-4 pt-7 space-y-3">
          {/* Your Insights Card */}
          <div className="bg-[#1e2a47] border border-gray-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="bg-teal-600 rounded-lg p-1.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xs mb-0.5">Your insights</h3>
                <p className="text-gray-400 text-xs leading-snug">
                  New lab results are processed within 5-7 days.
                </p>
              </div>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="bg-gradient-to-br from-teal-800 to-teal-900 rounded-lg p-4">
            <p className="text-teal-200 text-xs font-semibold tracking-wider mb-1.5">CURRENT PLAN</p>
            <h3 className="text-white font-bold text-lg mb-1.5">Quarterly Plan</h3>
            <p className="text-teal-100 text-xs mb-3 leading-snug">
              Last renewal on Sep 1, 2025. Includes quarterly labs and concierge support.
            </p>
            <button className="w-full bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold py-2 text-sm rounded-lg transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

