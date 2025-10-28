'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { CashIcon, ProductIcon, TransactionIcon, ReportIcon, InventoryIcon } from '@/components/Icons';

interface BusinessReport {
  totalRevenue: number;
  totalTransactions: number;
  totalCapital: number;
  transactions: any[];
  products: any[];
  inventory: any[];
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<BusinessReport | null>(null);

  useEffect(() => {
    loadBusinessReport();
  }, []);

  const loadBusinessReport = async () => {
    setLoading(true);
    try {
      // Load all business data
      const [transactionsRes, productsRes, inventoryRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/products'),
        fetch('/api/inventory')
      ]);

      const [transactionsData, productsData, inventoryData] = await Promise.all([
        transactionsRes.json(),
        productsRes.json(),
        inventoryRes.json()
      ]);

      if (transactionsData.success && productsData.success && inventoryData.success) {
        const transactions = transactionsData.data || [];
        const products = productsData.data || [];
        const inventory = inventoryData.data || [];

        // Calculate totals
        const totalRevenue = transactions.reduce((sum: number, t: any) => sum + (Number(t.pendapatan_sgd) || 0), 0);
        
        // Calculate total capital - try different field names and fallback to calculation
        const totalCapital = transactions.reduce((sum: number, t: any) => {
          let modalTotal = Number(t.modal_total_IDR) || Number(t.modal_total_idr) || 0;
          
          // If modal_total is not available, calculate from modal_satuan * qty
          if (modalTotal === 0) {
            const modalSatuan = Number(t.modal_satuan_IDR) || Number(t.modal_satuan_idr) || 0;
            const qty = Number(t.qty) || 0;
            modalTotal = modalSatuan * qty;
          }
          
          // If still 0, try to get from product's default modal value
          if (modalTotal === 0) {
            const product = products.find((p: any) => p.sku === t.sku);
            if (product && product.default_modal_satuan_idr) {
              const qty = Number(t.qty) || 0;
              modalTotal = Number(product.default_modal_satuan_idr) * qty;
            }
          }
          
          return sum + modalTotal;
        }, 0);
        
        const totalTransactions = transactions.length;

        // Debug: Log transaction data structure
        console.log('Sample transaction data:', transactions[0]);
        console.log('All transaction fields:', Object.keys(transactions[0] || {}));
        console.log('Modal fields check:', {
          modal_total_IDR: transactions[0]?.modal_total_IDR,
          modal_total_idr: transactions[0]?.modal_total_idr,
          modal_satuan_IDR: transactions[0]?.modal_satuan_IDR,
          modal_satuan_idr: transactions[0]?.modal_satuan_idr,
          qty: transactions[0]?.qty
        });
        console.log('Total capital calculated:', totalCapital);

        setReport({
          totalRevenue,
          totalTransactions,
          totalCapital,
          transactions,
          products,
          inventory
        });
      }
    } catch (error) {
      console.error('Error loading business report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: 'IDR' | 'SGD') => {
    const numAmount = Number(amount) || 0;
    if (currency === 'IDR') {
      return `Rp ${numAmount.toLocaleString('id-ID')}`;
    } else {
      return `$${numAmount.toFixed(2)}`;
    }
  };

  const getProductName = (sku: string) => {
    if (!report) return 'N/A';
    const product = report.products.find(p => p.sku === sku);
    return product ? product.nama : 'N/A';
  };

  const getProductStock = (sku: string) => {
    if (!report) return 0;
    return report.inventory
      .filter(item => item.sku === sku)
      .reduce((sum, item) => sum + (Number(item.current_stock) || 0), 0);
  };

  const getProductCapital = (sku: string) => {
    if (!report) return 0;
    return report.inventory
      .filter(item => item.sku === sku)
      .reduce((sum, item) => sum + (Number(item.current_stock) || 0) * (Number(item.default_modal_satuan_idr) || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Laporan Bisnis</h1>
          <p className="text-lg text-gray-600">Ringkasan lengkap transaksi, pendapatan, dan stok produk</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data laporan...</p>
          </div>
        ) : report ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Pendapatan (SGD)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report.totalRevenue, 'SGD')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <CashIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {report.totalTransactions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <TransactionIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Modal (IDR)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report.totalCapital, 'IDR')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <ReportIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Transaksi Terbaru</h3>
                <span className="text-sm text-gray-500">Total: {report.totalTransactions} transaksi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendapatan (SGD)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modal (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.transactions.slice(0, 10).map((transaction, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.tanggal).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getProductName(transaction.sku)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.qty || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(Number(transaction.pendapatan_sgd) || 0, 'SGD')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            let modalTotal = Number(transaction.modal_total_IDR) || Number(transaction.modal_total_idr) || 0;
                            
                            // If modal_total is not available, calculate from modal_satuan * qty
                            if (modalTotal === 0) {
                              const modalSatuan = Number(transaction.modal_satuan_IDR) || Number(transaction.modal_satuan_idr) || 0;
                              const qty = Number(transaction.qty) || 0;
                              modalTotal = modalSatuan * qty;
                            }
                            
                            // If still 0, try to get from product's default modal value
                            if (modalTotal === 0) {
                              const product = report.products.find((p: any) => p.sku === transaction.sku);
                              if (product && product.default_modal_satuan_idr) {
                                const qty = Number(transaction.qty) || 0;
                                modalTotal = Number(product.default_modal_satuan_idr) * qty;
                              }
                            }
                            
                            return formatCurrency(modalTotal, 'IDR');
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Stock Overview */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Stok Produk & Modal</h3>
                <InventoryIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Tersisa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modal per Unit (IDR)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Modal (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.products.map((product, index) => {
                      const stock = getProductStock(product.sku);
                      const capital = getProductCapital(product.sku);
                      const modalPerUnit = Number(product.default_modal_satuan_idr) || 0;
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.nama}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.kategori || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              stock > 10 ? 'bg-green-100 text-green-800' : 
                              stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {stock} unit
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(modalPerUnit, 'IDR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(capital, 'IDR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Business Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Ringkasan Keuangan</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Pendapatan (SGD)</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(report.totalRevenue, 'SGD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Modal Dikeluarkan (IDR)</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(report.totalCapital, 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Transaksi</span>
                    <span className="font-semibold text-blue-600">{report.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-700">Rata-rata per Transaksi</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(report.totalTransactions > 0 ? report.totalRevenue / report.totalTransactions : 0, 'SGD')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Ringkasan Stok</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Produk</span>
                    <span className="font-semibold text-gray-900">{report.products.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Stok Tersisa</span>
                    <span className="font-semibold text-gray-900">
                      {report.products.reduce((sum, product) => sum + getProductStock(product.sku), 0)} unit
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Modal di Stok (IDR)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(report.products.reduce((sum, product) => sum + getProductCapital(product.sku), 0), 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-700">Produk dengan Stok Rendah</span>
                    <span className="font-semibold text-red-600">
                      {report.products.filter(product => getProductStock(product.sku) <= 5).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <ReportIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
            <p className="text-gray-600">Tidak ada data bisnis yang tersedia</p>
          </div>
        )}
      </main>
    </div>
  );
}