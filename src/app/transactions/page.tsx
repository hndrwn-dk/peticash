'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import EditTransactionModal from '@/components/EditTransactionModal';
import Alert from '@/components/Alert';
// Icons removed for clean production build
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Transaction | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [alert, setAlert] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });

  useEffect(() => {
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadTransactions();
    }
  }, [selectedPeriod]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions?periode=${selectedPeriod}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'complete':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Complete</span>;
      case 'incomplete':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">Incomplete</span>;
      case 'invalid':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">Invalid</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    setShowDeleteConfirm(transaction);
    setDeleteConfirmText(''); // Reset confirmation text
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm?.id) return;
    
    try {
      const response = await fetch(`/api/transactions/${showDeleteConfirm.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Refresh transactions list
        await loadTransactions();
        setShowDeleteConfirm(null);
        setAlert({
          isOpen: true,
          title: 'Success',
          message: 'Transaction deleted successfully',
          type: 'success'
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Error',
          message: result.error || 'Failed to delete transaction',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Error deleting transaction',
        type: 'error'
      });
    }
  };

  const handleSaveEdit = async (updatedTransaction: Transaction) => {
    try {
      const response = await fetch(`/api/transactions/${updatedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Refresh transactions list
        await loadTransactions();
        setEditingTransaction(null);
        setAlert({
          isOpen: true,
          title: 'Success',
          message: 'Transaction updated successfully',
          type: 'success'
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Error',
          message: result.error || 'Failed to update transaction',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Error updating transaction',
        type: 'error'
      });
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaksi</h1>
            <p className="text-gray-600">Lihat dan kelola transaksi penjualan Anda</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Link href="/invoice" className="btn-secondary flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Invoice
            </Link>
            <Link href="/transactions/new" className="btn-primary flex items-center justify-center">
              Transaksi Baru
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                Periode (YYYY-MM)
              </label>
              <input
                type="month"
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={loadTransactions}
                className="btn-secondary flex items-center justify-center"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-4">
                {selectedPeriod 
                  ? `No transactions found for ${selectedPeriod}`
                  : 'Get started by recording your first transaction'
                }
              </p>
              <Link href="/transactions/new" className="btn-primary">
                New Transaction
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost (IDR)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue (SGD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{transaction.sku}</div>
                          <div className="text-sm text-gray-500">{transaction.tanggal}</div>
                          {transaction.catatan && (
                            <div className="text-xs text-gray-400 mt-1">{transaction.catatan}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.qty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.modal_total_IDR 
                            ? formatCurrency(transaction.modal_total_IDR, 'IDR')
                            : '-'
                          }
                        </div>
                        {transaction.modal_satuan_IDR && (
                          <div className="text-xs text-gray-500">
                            @ {formatCurrency(transaction.modal_satuan_IDR, 'IDR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.pendapatan_sgd 
                            ? formatCurrency(transaction.pendapatan_sgd, 'SGD')
                            : '-'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          @ ${transaction.harga_jual_sgd ? Number(transaction.harga_jual_sgd).toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.pelanggan || '-'}</div>
                        <div className="text-xs text-gray-500">{transaction.metode_bayar || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit Transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && transactions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Total Cost (IDR)</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  transactions.reduce((sum, tx) => sum + (Number(tx.modal_total_IDR) || 0), 0),
                  'IDR'
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Total Revenue (SGD)</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  transactions.reduce((sum, tx) => sum + (Number(tx.pendapatan_sgd) || 0), 0),
                  'SGD'
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleSaveEdit}
          onCancel={() => setEditingTransaction(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">⚠️ Delete Transaction</h3>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this transaction?
              </p>
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm"><strong>SKU:</strong> {showDeleteConfirm.sku}</p>
                <p className="text-sm"><strong>Date:</strong> {showDeleteConfirm.tanggal}</p>
                <p className="text-sm"><strong>Quantity:</strong> {showDeleteConfirm.qty}</p>
                <p className="text-sm"><strong>Revenue:</strong> {showDeleteConfirm.pendapatan_sgd ? formatCurrency(showDeleteConfirm.pendapatan_sgd, 'SGD') : '-'}</p>
              </div>
              <p className="text-red-600 text-sm font-medium mb-3">
                This action cannot be undone. Type "DELETE" to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE'}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  deleteConfirmText === 'DELETE' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Delete Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Component */}
      <Alert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}