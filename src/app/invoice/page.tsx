'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Alert from '@/components/Alert';

interface InvoiceData {
  customer?: string;
  period?: string;
  transactions: any[];
  totalAmount: number;
  totalCost: number;
  totalRevenue?: number;
  totalTransactions?: number;
  generatedAt: string;
}

export default function InvoicePage() {
  const [invoiceType, setInvoiceType] = useState<'customer' | 'financial'>('customer');
  const [customerName, setCustomerName] = useState('');
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [customers, setCustomers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    // Set current month as default for financial reports
    // Using 2024-10 as default since sample data is from 2024
    const now = new Date();
    const currentMonth = now.getFullYear() === 2025 ? '2024-10' : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setPeriod(currentMonth);
    
    // Fetch customers from transactions
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/transactions');
      const result = await response.json();
      
      if (result.success) {
        // Extract unique customer names from transactions
        const customerNames = result.data
          .map((tx: any) => tx.pelanggan)
          .filter((name: string) => name && name.trim() !== '' && name !== "''")
          .map((name: string) => name.trim()) as string[];
        const uniqueCustomers = Array.from(new Set(customerNames)).sort();
        
        setCustomers(uniqueCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.customer-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateInvoice = async () => {
    if (invoiceType === 'customer' && !customerName.trim()) {
      setAlert({
        isOpen: true,
        title: 'Data Tidak Lengkap',
        message: 'Nama pelanggan wajib diisi untuk invoice pelanggan.',
        type: 'warning'
      });
      return;
    }

    if (invoiceType === 'financial' && !period) {
      setAlert({
        isOpen: true,
        title: 'Data Tidak Lengkap',
        message: 'Periode wajib diisi untuk laporan keuangan.',
        type: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: invoiceType,
          customer: customerName.trim(),
          period: period
        }),
      });

      const result = await response.json();

      if (result.success) {
        setInvoiceData(result.data);
        setAlert({
          isOpen: true,
          title: 'Berhasil',
          message: 'Invoice berhasil dibuat!',
          type: 'success'
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Gagal',
          message: result.error || 'Gagal membuat invoice.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Gagal membuat invoice.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    if (!invoiceData) return;

    const printContent = `
      <html>
        <head>
          <title>${invoiceType === 'customer' ? 'Customer Invoice' : 'Financial Report'}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #e5e7eb; 
              padding-bottom: 20px; 
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .company-tagline {
              color: #6b7280;
              font-size: 14px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-details {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
            }
            .invoice-details h3 {
              margin: 0 0 10px 0;
              color: #374151;
              font-size: 16px;
            }
            .invoice-details p {
              margin: 5px 0;
              font-size: 14px;
              color: #6b7280;
            }
            .summary { 
              margin-bottom: 30px; 
              display: flex; 
              gap: 30px; 
            }
            .summary-item { 
              background: #f9fafb; 
              padding: 15px; 
              border-radius: 8px; 
              flex: 1;
            }
            .summary-item h3 { 
              margin: 0 0 5px 0; 
              color: #6b7280; 
              font-size: 14px; 
            }
            .summary-item p { 
              margin: 0; 
              font-size: 18px; 
              font-weight: bold; 
              color: #1f2937;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
            }
            th, td { 
              border: 1px solid #e5e7eb; 
              padding: 12px 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f9fafb; 
              font-weight: 600; 
              color: #374151;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row {
              background-color: #f9fafb;
              font-weight: bold;
            }
            @media print { 
              .no-print { display: none; } 
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Peti Cash</div>
            <div class="company-tagline">Point of Sale System</div>
          </div>
          
          <div class="invoice-info">
            <div class="invoice-details">
              <h3>${invoiceType === 'customer' ? 'Customer Invoice' : 'Financial Report'}</h3>
              ${invoiceType === 'customer' ? `<p><strong>Customer:</strong> ${invoiceData.customer}</p>` : ''}
              ${invoiceType === 'financial' ? `<p><strong>Period:</strong> ${invoiceData.period}</p>` : ''}
              <p><strong>Generated:</strong> ${new Date(invoiceData.generatedAt).toLocaleString()}</p>
            </div>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <h3>Total ${invoiceType === 'customer' ? 'Amount' : 'Revenue'} (SGD)</h3>
              <p>$${Number(invoiceType === 'customer' ? invoiceData.totalAmount : (invoiceData.totalRevenue || invoiceData.totalAmount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="summary-item">
              <h3>Total ${invoiceType === 'customer' ? 'Items' : 'Transactions'}</h3>
              <p>${invoiceType === 'customer' ? invoiceData.transactions.length : invoiceData.totalTransactions || 0}</p>
            </div>
            ${invoiceType === 'financial' ? `
            <div class="summary-item">
              <h3>Total Quantity</h3>
              <p>${invoiceData.transactions?.reduce((sum: number, tx: any) => sum + (tx.qty || 0), 0) || 0}</p>
            </div>
            ` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price (SGD)</th>
                <th>Total (SGD)</th>
                ${invoiceType === 'customer' ? '<th>Payment Method</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${invoiceData.transactions.map(tx => `
                <tr>
                  <td>${tx.tanggal}</td>
                  <td>${tx.product_name || tx.sku}</td>
                  <td>${tx.sku}</td>
                  <td class="text-center">${tx.qty}</td>
                  <td class="text-right">$${Number(tx.harga_jual_sgd || 0).toFixed(2)}</td>
                  <td class="text-right">$${Number(tx.pendapatan_sgd || 0).toFixed(2)}</td>
                  ${invoiceType === 'customer' ? `<td>${tx.metode_bayar || '-'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice & Laporan</h1>
          <p className="text-gray-600">Buat invoice pelanggan dan laporan keuangan</p>
        </div>

        {/* Form */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Invoice</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Invoice
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="customer"
                    checked={invoiceType === 'customer'}
                    onChange={(e) => setInvoiceType(e.target.value as 'customer' | 'financial')}
                    className="mr-2"
                  />
                  Invoice Pelanggan
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="financial"
                    checked={invoiceType === 'financial'}
                    onChange={(e) => setInvoiceType(e.target.value as 'customer' | 'financial')}
                    className="mr-2"
                  />
                  Laporan Keuangan
                </label>
              </div>
            </div>

            {invoiceType === 'customer' && (
              <div className="relative customer-dropdown">
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pelanggan *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="customer"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="input-field w-full"
                    placeholder="Cari atau pilih pelanggan..."
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setCustomerName(customer);
                            setSearchTerm(customer);
                            setShowDropdown(false);
                          }}
                        >
                          {customer}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        {searchTerm ? 'Tidak ada pelanggan yang cocok' : 'Tidak ada pelanggan tersedia'}
                      </div>
                    )}
                  </div>
                )}
                
                {customerName && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <span className="text-sm text-green-800">
                      <strong>Dipilih:</strong> {customerName}
                    </span>
                  </div>
                )}
              </div>
            )}

            {invoiceType === 'financial' && (
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                  Periode (YYYY-MM) *
                </label>
                <input
                  type="month"
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            )}

            <button
              onClick={generateInvoice}
              disabled={loading}
              className="btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate Invoice'
              )}
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        {invoiceData && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {invoiceType === 'customer' ? 'Customer Invoice' : 'Financial Report'} Preview
              </h3>
              <button
                onClick={printInvoice}
                className="btn-secondary flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print PDF
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">
                    Total {invoiceType === 'customer' ? 'Amount' : 'Revenue'} (SGD)
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(invoiceType === 'customer' ? invoiceData.totalAmount : (invoiceData.totalRevenue || invoiceData.totalAmount || 0), 'SGD')}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">
                    Total {invoiceType === 'customer' ? 'Items' : 'Transactions'}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {invoiceType === 'customer' ? invoiceData.transactions.length : invoiceData.totalTransactions || 0}
                  </div>
                </div>
                {invoiceType === 'financial' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">
                      Total Quantity
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {invoiceData.transactions?.reduce((sum: number, tx: any) => sum + (tx.qty || 0), 0) || 0}
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price (SGD)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total (SGD)
                      </th>
                      {invoiceType === 'customer' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoiceData.transactions.map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.tanggal}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tx.product_name || tx.sku}</div>
                            <div className="text-sm text-gray-500">{tx.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {tx.qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(tx.harga_jual_sgd || 0, 'SGD')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(tx.pendapatan_sgd || 0, 'SGD')}
                        </td>
                        {invoiceType === 'customer' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tx.metode_bayar || '-'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
