'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, ProductIcon, TransactionIcon, ReportIcon, CashIcon, InventoryIcon, InvoiceIcon } from './Icons';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: DashboardIcon },
    { href: '/products', label: 'Produk', icon: ProductIcon },
    { href: '/transactions', label: 'Transaksi', icon: TransactionIcon },
    { href: '/inventory', label: 'Stock Opname', icon: InventoryIcon },
    { href: '/invoice', label: 'Invoice', icon: InvoiceIcon },
    { href: '/reports', label: 'Laporan', icon: ReportIcon },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <CashIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Peti Cash</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
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
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link text-base ${
                  isActive ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}