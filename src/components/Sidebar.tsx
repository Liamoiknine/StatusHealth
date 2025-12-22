'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Search, MessageSquare, FileText, Settings, CreditCard, ChevronDown, ChevronRight, Calendar, Home } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { getAllCategoryNames } from '@/data/category-overviews';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/categories', label: 'Categories', icon: LayoutDashboard },
  { href: '/exposures', label: 'All Exposures', icon: Search },
  { href: '/tests', label: 'All Tests', icon: Calendar },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navRef = useRef<HTMLElement | null>(null);
  const categoriesSubmenuRef = useRef<HTMLDivElement | null>(null);
  const categoryNames = getAllCategoryNames();
  
  // Get selected category from URL
  const selectedCategory = searchParams?.get('category');
  
  // Auto-expand categories if we're on a category page
  useEffect(() => {
    if (pathname?.startsWith('/categories')) {
      setIsCategoriesExpanded(true);
    }
  }, [pathname]);

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
        index = navItems.findIndex(item => item.href === '/dashboard');
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
  const updateIndicatorPosition = useCallback(() => {
    const activeItem = itemRefs.current[activeIndex];
    const nav = navRef.current;
    if (activeItem && nav) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const top = itemRect.top - navRect.top;
      
      // If categories is active and expanded, include submenu height
      const isCategoriesActive = navItems[activeIndex]?.href === '/categories';
      let height = itemRect.height;
      
      if (isCategoriesActive && isCategoriesExpanded && categoriesSubmenuRef.current) {
        const submenuRect = categoriesSubmenuRef.current.getBoundingClientRect();
        height = submenuRect.bottom - itemRect.top;
      }
      
      setIndicatorStyle({ top, height });
    }
  }, [activeIndex, isCategoriesExpanded]);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateIndicatorPosition();
    });
    
    // Recalculate on window resize
    window.addEventListener('resize', updateIndicatorPosition);
    return () => window.removeEventListener('resize', updateIndicatorPosition);
  }, [activeIndex, isCategoriesExpanded, updateIndicatorPosition]);

  // Also update when all refs are set (initial mount)
  useEffect(() => {
    if (itemRefs.current.every(ref => ref !== null)) {
      requestAnimationFrame(() => {
        updateIndicatorPosition();
      });
    }
  }, [updateIndicatorPosition]);

  return (
    <aside className="w-60 bg-white min-h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
      {/* Banner with Logo and STATUS */}
      <div className="bg-[#404B69] pl-3 pr-6 py-3 border-b border-[#404B69]/50">
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
      </div>
      
      {/* Navigation */}
      <nav ref={navRef} className="flex-1 pt-6 pb-6 space-y-1 relative">
        {/* Sliding navy indicator */}
        <div
          className="absolute right-[-4px] w-1 transition-all duration-300 ease-in-out rounded-r-full"
          style={{
            top: `${indicatorStyle.top}px`,
            height: `${indicatorStyle.height}px`,
            backgroundColor: '#404B69',
          }}
        />
        
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href) || (item.href === '/dashboard' && pathname === '/');
          
          const isCategories = item.href === '/categories';
          
          return (
            <div
              key={item.href}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="relative w-full"
            >
              {isCategories ? (
                <>
                  <div className="flex items-center w-full">
                    <Link
                      href="/categories"
                      className={`flex-1 flex items-center space-x-2.5 pl-5 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive && !selectedCategory
                          ? 'text-gray-900'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                      <span>{item.label}</span>
                      {(isCategoriesExpanded || isActive) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsCategoriesExpanded(!isCategoriesExpanded);
                          }}
                          className="ml-1 p-0.5 rounded transition-colors"
                          aria-label="Toggle categories"
                        >
                          {isCategoriesExpanded ? (
                            <ChevronDown className="w-4 h-4" strokeWidth={2} />
                          ) : (
                            <ChevronRight className="w-4 h-4" strokeWidth={2} />
                          )}
                        </button>
                      )}
                    </Link>
                  </div>
                  {isCategoriesExpanded && (
                    <div ref={categoriesSubmenuRef} className="pl-9 pr-3 py-1 space-y-0.5">
                      {categoryNames.map((categoryName) => {
                        const isCategoryActive = selectedCategory === categoryName;
                        return (
                          <Link
                            key={categoryName}
                            href={`/categories?category=${encodeURIComponent(categoryName)}`}
                            className={`block py-1.5 px-2 rounded text-sm transition-colors ${
                              isCategoryActive
                                ? 'text-[#9CBB04] font-medium bg-[#9CBB04]/10'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {categoryName}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center space-x-2.5 pl-5 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

