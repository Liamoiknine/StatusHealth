'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Search, MessageSquare, FileText, Settings, CreditCard } from 'lucide-react';
import { useMemo, useRef, useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/categories', label: 'Categories', icon: FileText },
  { href: '/exposures', label: 'All Exposures', icon: Search },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navRef = useRef<HTMLElement | null>(null);

  // Find active index
  useEffect(() => {
    // Check if we're on a chemical page and have a 'from' parameter
    const isChemicalPage = pathname?.startsWith('/chemical/');
    const fromParam = isChemicalPage ? searchParams?.get('from') : null;
    
    let index = -1;
    
    if (isChemicalPage && fromParam) {
      // Use the 'from' parameter to determine active tab
      if (fromParam === 'categories') {
        index = navItems.findIndex(item => item.href === '/categories');
      } else if (fromParam === 'dashboard') {
        index = navItems.findIndex(item => item.href === '/');
      } else if (fromParam === 'exposures') {
        index = navItems.findIndex(item => item.href === '/exposures');
      }
    } else {
      // Normal pathname-based matching
      index = navItems.findIndex((item) => {
        if (item.href === '/') {
          return pathname === '/';
        }
        return pathname?.startsWith(item.href);
      });
    }
    
    setActiveIndex(index >= 0 ? index : 0);
  }, [pathname, searchParams]);

  // Update indicator position when active index changes or on resize
  const updateIndicatorPosition = () => {
    const activeItem = itemRefs.current[activeIndex];
    const nav = navRef.current;
    if (activeItem && nav) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const top = itemRect.top - navRect.top;
      const height = itemRect.height;
      setIndicatorStyle({ top, height });
    }
  };

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateIndicatorPosition();
    });
    
    // Recalculate on window resize
    window.addEventListener('resize', updateIndicatorPosition);
    return () => window.removeEventListener('resize', updateIndicatorPosition);
  }, [activeIndex]);

  // Also update when all refs are set (initial mount)
  useEffect(() => {
    if (itemRefs.current.every(ref => ref !== null)) {
      requestAnimationFrame(() => {
        updateIndicatorPosition();
      });
    }
  }, []);

  return (
    <aside className="w-60 bg-white min-h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
      {/* Navigation */}
      <nav ref={navRef} className="flex-1 pt-22 pb-6 space-y-1 relative">
        {/* Sliding blue indicator */}
        <div
          className="absolute right-0 w-1 bg-blue-600 transition-all duration-300 ease-in-out"
          style={{
            top: `${indicatorStyle.top}px`,
            height: `${indicatorStyle.height}px`,
          }}
        />
        
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.href === '/' 
            ? pathname === '/'
            : pathname?.startsWith(item.href);
          
          return (
            <div
              key={item.href}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="relative w-full"
            >
              <Link
                href={item.href}
                className={`flex items-center space-x-2.5 pl-6.5 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

