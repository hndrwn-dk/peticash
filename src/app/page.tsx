'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardStats, Transaction, Product } from '@/types';
import { CashIcon, ProductIcon, TransactionIcon, ReportIcon, AddIcon } from '@/components/Icons';
import { DashboardChart, generateSampleRevenueData, generateSampleModalData, generateSampleTransactionData } from '@/components/Charts';
import Alert from '@/components/Alert';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [chartTimeRange, setChartTimeRange] = useState<1 | 3 | 6>(6);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    loadDashboardData();
    loadChartData();
    checkDbStatus();
  }, []);

  const checkDbStatus = async () => {
    try {
      const response = await fetch('/api/db-status');
      const data = await response.json();
      if (data.success) {
        setDbStatus(data.data);
      }
    } catch (error) {
      console.error('Error checking DB status:', error);
    }
  };

  const loadChartData = async (months: number = chartTimeRange) => {
    try {
      setChartsLoading(true);
      const response = await fetch(`/api/dashboard/stats?months=${months}`);
      const data = await response.json();
      
      if (data.success) {
        setChartData(data.data);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleTimeRangeChange = (months: 1 | 3 | 6) => {
    setChartTimeRange(months);
    loadChartData(months);
  };

  const seedDummyData = async () => {
    try {
      setSeeding(true);
      const response = await fetch('/api/seed-data', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        setAlert({
          isOpen: true,
          title: 'Data Seeded Successfully!',
          message: `✅ Added ${result.data.successful} transactions\n📦 ${result.data.products_added} new products added\n🗓️ Date range: ${result.data.summary.date_range}\n📊 Total products: ${result.data.summary.total_products}\n🏷️ Categories: ${result.data.summary.categories.join(', ')}`,
          type: 'success'
        });
        // Reload data
        setTimeout(() => {
          loadDashboardData();
          loadChartData();
        }, 1500);
      } else {
        setAlert({
          isOpen: true,
          title: 'Seeding Failed',
          message: `❌ Failed to seed data: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error seeding dummy data:', error);
      setAlert({
        isOpen: true,
        title: 'Seeding Error',
        message: '❌ Error seeding dummy data. Please try again.',
        type: 'error'
      });
    } finally {
      setSeeding(false);
    }
  };

  const quickSeed = async () => {
    try {
      setSeeding(true);
      const response = await fetch('/api/quick-seed', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        setAlert({
          isOpen: true,
          title: 'Quick Test Data Added!',
          message: `✅ Added ${result.data.successful} test transactions\n📊 You can now see data in dashboard\n🧪 Perfect for testing all functions`,
          type: 'success'
        });
        // Reload data immediately
        setTimeout(() => {
          loadDashboardData();
          loadChartData();
        }, 1000);
      } else {
        setAlert({
          isOpen: true,
          title: 'Quick Seed Failed',
          message: `❌ ${result.error}\nErrors: ${result.data?.errors?.join(', ') || 'Unknown'}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error with quick seed:', error);
      setAlert({
        isOpen: true,
        title: 'Quick Seed Error',
        message: '❌ Network error. Please check console.',
        type: 'error'
      });
    } finally {
      setSeeding(false);
    }
  };

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
      {/* Database Warning Banner */}
      {dbStatus?.is_ephemeral && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>⚠️ Data Persistence Warning:</strong> {dbStatus.warning} 
                <span className="ml-2 text-xs">
                  For production use, consider upgrading to a persistent database solution.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <CashIcon className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Peti Cash</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-1">
              <Link href="/products" className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <ProductIcon className="w-4 h-4" />
                <span>Produk</span>
              </Link>
              <Link href="/transactions" className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <TransactionIcon className="w-4 h-4" />
                <span>Transaksi</span>
              </Link>
              <Link href="/reports" className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <ReportIcon className="w-4 h-4" />
                <span>Laporan</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Dashboard</h2>
              <p className="text-lg text-gray-600">
                Pembukuan penjualan retail dengan modal IDR dan penjualan SGD
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={quickSeed}
                disabled={seeding}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors shadow-sm hover:shadow-md text-sm disabled:opacity-50"
              >
                {seeding ? 'Adding...' : '⚡ Quick Test Data'}
              </button>
              <button
                onClick={seedDummyData}
                disabled={seeding}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition-colors shadow-sm hover:shadow-md text-sm disabled:opacity-50"
              >
                {seeding ? 'Seeding...' : '🌱 Full Dummy Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Produk</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total_products || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
                <ProductIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Transaksi</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.current_month_transactions || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center shadow-sm">
                <TransactionIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pendapatan (SGD)</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(stats?.current_month_revenue_sgd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
                <CashIcon className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Modal (IDR)</p>
                <p className="text-3xl font-bold text-gray-900">
                  Rp {(stats?.current_month_modal_idr || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
                <CashIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Link href="/transactions/new" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:scale-105">
            <AddIcon className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </Link>
          <Link href="/products/new" className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-2xl border border-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:scale-105">
            <AddIcon className="w-4 h-4" />
            <span>Tambah Produk</span>
          </Link>
          <Link href="/products" className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-2xl border border-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:scale-105">
            <ProductIcon className="w-4 h-4" />
            <span>Cari Produk</span>
          </Link>
          <Link href="/reports" className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-2xl border border-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:scale-105">
            <ReportIcon className="w-4 h-4" />
            <span>Laporan</span>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Tren Bisnis</h2>
            
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleTimeRangeChange(1)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  chartTimeRange === 1
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                1 Bulan
              </button>
              <button
                onClick={() => handleTimeRangeChange(3)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  chartTimeRange === 3
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                3 Bulan
              </button>
              <button
                onClick={() => handleTimeRangeChange(6)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  chartTimeRange === 6
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                6 Bulan
              </button>
            </div>
          </div>
          {chartsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data grafik...</p>
            </div>
          ) : chartData ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <DashboardChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{
                      label: 'Pendapatan',
                      data: chartData.revenue,
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: true,
                      tension: 0.4,
                    }]
                  }}
                  title="Pendapatan Bulanan (SGD)"
                  type="line"
                />
                <DashboardChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{
                      label: 'Modal',
                      data: chartData.modal,
                      borderColor: '#f59e0b',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      fill: true,
                      tension: 0.4,
                    }]
                  }}
                  title="Modal Bulanan (Ribu IDR)"
                  type="line"
                />
              </div>
              <div className="grid grid-cols-1 gap-8 mb-8">
                <DashboardChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{
                      label: 'Transaksi',
                      data: chartData.transactions,
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: '#3b82f6',
                      borderWidth: 0,
                      borderRadius: 8,
                    }]
                  }}
                  title="Jumlah Transaksi per Bulan"
                  type="bar"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <DashboardChart
                data={generateSampleRevenueData()}
                title="Pendapatan Bulanan (SGD) - Sample Data"
                type="line"
              />
              <DashboardChart
                data={generateSampleModalData()}
                title="Modal Bulanan (IDR) - Sample Data"
                type="line"
              />
            </div>
          )}
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

      <Alert
        isOpen={alert.isOpen}
        onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}