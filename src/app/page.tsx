'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Icons removed for clean production build
import { DashboardStats, Transaction, Product } from '@/types';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Fetch products and transactions in parallel
      const [productsRes, transactionsRes] = await Promise.all([
        fetch('/api/products'),
        fetch(`/api/transactions?periode=${currentMonth}&limit=5`)
      ]);

      const productsData = await productsRes.json();
      const transactionsData = await transactionsRes.json();

      const products: Product[] = productsData.success ? productsData.data : [];
      const transactions: Transaction[] = transactionsData.success ? transactionsData.data : [];

      // Calculate stats
      const currentMonthRevenue = transactions.reduce((sum, tx) => sum + (tx.pendapatan_SGD || 0), 0);
      const currentMonthModal = transactions.reduce((sum, tx) => sum + (tx.modal_total_IDR || 0), 0);

      // Calculate top products
      const productStats: { [sku: string]: { revenue: number, qty: number, nama: string } } = {};
      
      transactions.forEach(tx => {
        if (!productStats[tx.sku]) {
          const product = products.find(p => p.sku === tx.sku);
          productStats[tx.sku] = {
            revenue: 0,
            qty: 0,
            nama: product?.nama || tx.sku
          };
        }
        productStats[tx.sku].revenue += tx.pendapatan_SGD || 0;
        productStats[tx.sku].qty += tx.qty;
      });

      const topProducts = Object.entries(productStats)
        .map(([sku, stats]) => ({ 
          sku, 
          nama: stats.nama,
          revenue: stats.revenue, 
          qty_sold: stats.qty 
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const dashboardStats: DashboardStats = {
        total_products: products.length,
        current_month_transactions: transactions.length,
        current_month_revenue_sgd: currentMonthRevenue,
        current_month_modal_idr: currentMonthModal,
        recent_transactions: transactions.slice(0, 5),
        top_products: topProducts
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Bookkeeper</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/products" className="text-gray-600 hover:text-gray-900 font-medium">
                Products
              </Link>
              <Link href="/transactions" className="text-gray-600 hover:text-gray-900 font-medium">
                Transactions
              </Link>
              <Link href="/reports" className="text-gray-600 hover:text-gray-900 font-medium">
                Reports
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Retail sales bookkeeping with IDR cost and SGD sales tracking
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_products || 0}</p>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.current_month_transactions || 0}</p>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue (SGD)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(stats?.current_month_revenue_sgd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost (IDR)</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {(stats?.current_month_modal_idr || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/transactions/new" className="btn-primary flex items-center justify-center">
            <Plus className="h-5 w-5 mr-2" />
            New Transaction
          </Link>
          <Link href="/products/new" className="btn-secondary flex items-center justify-center">
            <Package className="h-5 w-5 mr-2" />
            Add Product
          </Link>
          <Link href="/products" className="btn-secondary flex items-center justify-center">
            <Search className="h-5 w-5 mr-2" />
            Search Products
          </Link>
          <Link href="/reports" className="btn-secondary flex items-center justify-center">
            <Calendar className="h-5 w-5 mr-2" />
            Monthly Report
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <Link href="/transactions" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                stats.recent_transactions.map((tx, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{tx.sku}</p>
                      <p className="text-sm text-gray-600">{tx.tanggal} • Qty: {tx.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        SGD {(tx.pendapatan_SGD || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        IDR {(tx.modal_total_IDR || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Products (This Month)</h3>
              <Link href="/reports" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                View Report
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.top_products && stats.top_products.length > 0 ? (
                stats.top_products.map((product, index) => (
                  <div key={product.sku} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{product.nama}</p>
                        <p className="text-sm text-gray-600">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        SGD {product.revenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {product.qty_sold}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No sales data yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}