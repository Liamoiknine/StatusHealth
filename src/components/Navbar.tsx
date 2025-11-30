'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Settings, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollThreshold = Math.min(window.innerHeight * 0.15, 150); // 15% of viewport height or 150px, whichever is smaller
          setIsScrolled(window.scrollY > scrollThreshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className="fixed z-50 bg-[#1a2540] backdrop-blur-md shadow-lg border border-[#1a2540]/50"
      style={{
        top: isScrolled ? '0' : '1rem',
        left: isScrolled ? '0' : '1rem',
        right: isScrolled ? '0' : '1rem',
        width: isScrolled ? '100%' : 'auto',
        maxWidth: isScrolled ? 'none' : '80rem',
        borderRadius: isScrolled ? '0' : '9999px',
        margin: isScrolled ? '0' : '0 auto',
      }}
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
            {/* Dashboard */}
            <Link href="/" className="px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
              <span>Dashboard</span>
            </Link>

            {/* View Results */}
            <Link href="/categories" className="px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
              <span>View Results</span>
            </Link>

            {/* Billing */}
            <Link href="/billing" className="px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
              <span>Billing</span>
            </Link>

            {/* Settings */}
            <Link href="/settings" className="p-3 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" title="Settings">
              <Settings className="w-5 h-5" strokeWidth={2} />
            </Link>

            {/* Help */}
            <Link href="/help" className="p-3 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" title="Help">
              <HelpCircle className="w-5 h-5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
