'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { DashboardIcon, ProductIcon, TransactionIcon, ReportIcon, CashIcon, InventoryIcon, InvoiceIcon } from './Icons';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: DashboardIcon },
    { 
      label: 'Produk', 
      icon: ({ className }: { className?: string }) => <ProductIcon className={className} />,
      hasDropdown: true,
      dropdownItems: [
        { href: '/inventory', label: 'Stock Opname', icon: ({ className }: { className?: string }) => <InventoryIcon className={className} /> },
      ]
    },
    { 
      label: 'Laporan', 
      icon: ({ className }: { className?: string }) => <ReportIcon className={className} />,
      hasDropdown: true,
      dropdownItems: [
        { href: '/transactions', label: 'Transaksi', icon: ({ className }: { className?: string }) => <TransactionIcon className={className} /> },
        { href: '/invoice', label: 'Invoice', icon: ({ className }: { className?: string }) => <InvoiceIcon className={className} /> },
      ]
    },
  ];

  // Utility items (right side) - with dropdown
  const utilityItems = [
    { 
      label: 'Pengaturan', 
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      hasDropdown: true,
      dropdownItems: [
        { href: '/settings', label: 'Ubah Password', icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        ) },
        { 
          label: 'Keluar', 
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ),
          isAction: true,
          action: handleLogout
        },
      ]
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout fails
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close mobile menu and dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close mobile menu
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(target) && 
          mobileMenuButtonRef.current && 
          !mobileMenuButtonRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
      
      // Close dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isMobileMenuOpen || isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isDropdownOpen]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <CashIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Peti Cash</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => {
              if (item.hasDropdown) {
                const isAnyDropdownActive = item.dropdownItems?.some(dropdownItem => 
                  pathname === dropdownItem.href || 
                  (dropdownItem.href !== '/' && pathname.startsWith(dropdownItem.href))
                );
                
                return (
                  <div key={item.label} className="relative" ref={dropdownRef}>
                    <button
                      onClick={toggleDropdown}
                      className={`nav-link ${
                        isAnyDropdownActive ? 'nav-link-active' : 'nav-link-inactive'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          {item.dropdownItems?.map((dropdownItem) => {
                            const isActive = pathname === dropdownItem.href || 
                              (dropdownItem.href !== '/' && pathname.startsWith(dropdownItem.href));
                            
                            return (
                              <Link
                                key={dropdownItem.href}
                                href={dropdownItem.href}
                                onClick={() => setIsDropdownOpen(false)}
                                className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                                  isActive ? 'bg-blue-50 text-blue-700' : ''
                                }`}
                              >
                                <dropdownItem.icon className="w-4 h-4 mr-3" />
                                <span>{dropdownItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${
                      isActive ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
            })}
          </nav>

          {/* Utility items - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {utilityItems.map((item) => {
              if (item.hasDropdown) {
                const isAnyDropdownActive = item.dropdownItems?.some(dropdownItem => 
                  dropdownItem.href ? pathname === dropdownItem.href : false
                );
                
                return (
                  <div key={item.label} className="relative" ref={dropdownRef}>
                    <button
                      onClick={toggleDropdown}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isAnyDropdownActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.label}</span>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          {item.dropdownItems?.map((dropdownItem) => {
                            if (dropdownItem.isAction) {
                              return (
                                <button
                                  key={dropdownItem.label}
                                  onClick={() => {
                                    setIsDropdownOpen(false);
                                    dropdownItem.action?.();
                                  }}
                                  disabled={isLoggingOut}
                                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <dropdownItem.icon className="w-4 h-4 mr-3" />
                                  <span>{dropdownItem.label}</span>
                                </button>
                              );
                            } else {
                              const isActive = pathname === dropdownItem.href;
                              
                              return (
                                <Link
                                  key={dropdownItem.href}
                                  href={dropdownItem.href!}
                                  onClick={() => setIsDropdownOpen(false)}
                                  className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                                    isActive ? 'bg-blue-50 text-blue-700' : ''
                                  }`}
                                >
                                  <dropdownItem.icon className="w-4 h-4 mr-3" />
                                  <span>{dropdownItem.label}</span>
                                </Link>
                              );
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              ref={mobileMenuButtonRef}
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Navigation items */}
            {navItems.map((item) => {
              if (item.hasDropdown) {
                return (
                  <div key={item.label}>
                    <div className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.dropdownItems?.map((dropdownItem) => {
                      const isActive = pathname === dropdownItem.href || 
                        (dropdownItem.href !== '/' && pathname.startsWith(dropdownItem.href));
                      
                      return (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`ml-4 flex items-center px-3 py-2 text-base ${
                            isActive ? 'nav-link-active' : 'nav-link-inactive'
                          }`}
                        >
                          <dropdownItem.icon className="w-4 h-4" />
                          <span>{dropdownItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              } else {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`nav-link text-base ${
                      isActive ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
            })}
            
            {/* Utility items */}
            {utilityItems.map((item) => {
              if (item.hasDropdown) {
                return (
                  <div key={item.label}>
                    <div className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.dropdownItems?.map((dropdownItem) => {
                      if (dropdownItem.isAction) {
                        return (
                          <button
                            key={dropdownItem.label}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              dropdownItem.action?.();
                            }}
                            disabled={isLoggingOut}
                            className="ml-4 w-full flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoggingOut ? (
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <dropdownItem.icon className="w-4 h-4 mr-3" />
                            )}
                            <span>{isLoggingOut ? 'Keluar...' : dropdownItem.label}</span>
                          </button>
                        );
                      } else {
                        const isActive = pathname === dropdownItem.href;
                        
                        return (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href!}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`ml-4 flex items-center px-3 py-2 text-base ${
                              isActive ? 'nav-link-active' : 'nav-link-inactive'
                            }`}
                          >
                            <dropdownItem.icon className="w-4 h-4" />
                            <span>{dropdownItem.label}</span>
                          </Link>
                        );
                      }
                    })}
                  </div>
                );
              } else {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`nav-link text-base ${
                      isActive ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
            })}
          </div>
        </div>
      )}
    </header>
  );
}