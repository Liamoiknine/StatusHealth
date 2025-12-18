'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#404B69] border-t border-[#404B69]/50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.png"
                alt="StatusHealth Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div className="h-5 w-[2px] bg-white/30"></div>
              <span className="text-lg font-extrabold text-white tracking-wide">STATUS</span>
            </Link>
            <p className="text-sm text-gray-300">
              Your comprehensive health status monitoring platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/exposures" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
                  All Exposures
                </Link>
              </li>
              <li>
                <Link href="/tests" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
                  All Tests
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
                  Settings
                </Link>
              </li>
              <li>
                <Link href="/billing" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
                  Billing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-300">
            © {currentYear} StatusHealth. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <Link href="/help" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/help" className="text-sm text-gray-300 hover:text-[#9CBB04] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

