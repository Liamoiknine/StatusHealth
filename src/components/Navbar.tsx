'use client';

import Image from 'next/image';

import Link from 'next/link';

import { Settings, HelpCircle } from 'lucide-react';



export default function Navbar() {
  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-[#404B69] backdrop-blur-md shadow-lg border border-[#404B69]/50"
    >
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="StatusHealth Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            {/* Vertical divider */}
            <div className="h-5 w-[2px] bg-white/30"></div>
            <span className="text-lg font-extrabold text-white tracking-wide">STATUS</span>
          </Link>
          
          {/* Navigation buttons */}
          <div className="flex items-center space-x-2">
            {/* Settings */}
            <Link 
              href="/settings" 
              className="p-3 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" 
              title="Settings"
            >
              <Settings className="w-5 h-5" strokeWidth={2} />
            </Link>

            {/* Help */}
            <Link 
              href="/help" 
              className="p-3 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" 
              title="Help"
            >
              <HelpCircle className="w-5 h-5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
