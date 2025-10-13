'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="StatusHealth Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900">StatusHealth</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/categories" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/categories' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Health Categories
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
