'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { MonthlyReport } from '@/types';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(currentMonth);
  }, []);

  const generateReport = async () => {
    if (!selectedPeriod) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${selectedPeriod}`);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.data.report);
        setSummary(data.data.summary);
      } else {
        // Handle no data case
        setReport(null);
        setSummary('');
        console.log('No data for period:', selectedPeriod, data.error);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setReport(null);
      setSummary('');
    } finally {
      setLoading(false);
    }
  };

  // Remove auto-generation, let user click the button
  // useEffect(() => {
  //   if (selectedPeriod) {
  //     generateReport();
  //   }
  // }, [selectedPeriod]);

  const formatCurrency = (amount: number, currency: 'IDR' | 'SGD') => {
    const numAmount = Number(amount) || 0;
    if (currency === 'IDR') {
      return `Rp ${numAmount.toLocaleString('id-ID')}`;
    } else {
      return `$${numAmount.toFixed(2)}`;
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Laporan Bulanan</h1>
          <p className="text-lg text-gray-600">Ringkasan penjualan dan biaya bulanan</p>
        </div>

        {/* Period Selection */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Periode
              </label>
              <input
                type="month"
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input-field"
              />
            </div>
            <button 
              onClick={generateReport}
              disabled={loading || !selectedPeriod}
              className="btn-primary"
            >
              {loading ? 'Memproses...' : 'Buat Laporan'}
            </button>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Membuat laporan...</p>
          </div>
        ) : report ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Modal</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report.total_modal_idr, 'IDR')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-orange-500 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Penjualan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report.total_penjualan_sgd, 'SGD')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {report.transaksi_lengkap + report.transaksi_incomplete}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial Summary */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Ringkasan Keuangan</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Modal (IDR)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(report.total_modal_idr, 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Penjualan (SGD)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(report.total_penjualan_sgd, 'SGD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Biaya Transaksi (SGD)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(report.total_biaya_transaksi_sgd, 'SGD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Biaya Lain (SGD)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(report.total_biaya_lain_sgd, 'SGD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-700">GST (SGD)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(report.total_gst_sgd, 'SGD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Ringkasan Transaksi</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Transaksi Lengkap</span>
                    <span className="font-semibold text-green-600">{report.transaksi_lengkap}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Transaksi Tidak Lengkap</span>
                    <span className="font-semibold text-orange-600">{report.transaksi_incomplete}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-700">Total Transaksi</span>
                    <span className="font-semibold text-gray-900">
                      {report.transaksi_lengkap + report.transaksi_incomplete}
                    </span>
                  </div>
                </div>

                {/* Top Products */}
                {report.top_sku_by_revenue && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Produk Terlaris</h4>
                    <div className="space-y-2">
                      {report.top_sku_by_revenue.split(', ').map((sku, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">#{index + 1}</span>
                          <span className="text-gray-900">{sku}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Text Summary */}
            {summary && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan Periode {formatPeriod(selectedPeriod)}</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{summary}</pre>
                </div>
              </div>
            )}
          </div>
        ) : selectedPeriod ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-400 rounded"></div>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
            <p className="text-gray-600">
              Tidak ada transaksi untuk periode {formatPeriod(selectedPeriod)}
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Periode</h3>
            <p className="text-gray-600">Pilih bulan dan tahun untuk melihat laporan</p>
          </div>
        )}
      </main>
    </div>
  );
}