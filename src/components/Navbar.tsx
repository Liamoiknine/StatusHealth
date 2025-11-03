'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2c3e6e]/80 backdrop-blur-md">
      <div className="w-full px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="StatusHealth Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            {/* Vertical divider */}
            <div className="h-8 w-[2px] bg-white"></div>
            <span className="text-2xl font-extrabold text-white tracking-wide">STATUS HEALTH</span>
          </Link>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-6">
            {/* Dark mode icon */}
            <button className="text-white hover:text-cyan-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            
            {/* Sign out */}
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
