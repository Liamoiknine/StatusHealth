'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTest } from '@/contexts/TestContext';

export default function Navbar() {
  const pathname = usePathname();
  const { selectedTest, availableTests, setSelectedTest, isLoading } = useTest();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [month, day, year] = dateStr.split('/');
      const date = new Date(parseInt(year) + 2000, parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

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
            <span className="text-xl font-bold text-gray-900 tracking-wider">STATUS HEALTH</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button 
                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                  isLoading 
                    ? 'text-gray-400 bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                disabled={isLoading}
              >
                Tests
              </button>
              <select 
                value={selectedTest} 
                onChange={(e) => setSelectedTest(parseInt(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isLoading}
              >
                {availableTests.map(test => (
                  <option key={test.id} value={test.id}>
                    {formatDate(test.date)}
                  </option>
                ))}
              </select>
            </div>
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
