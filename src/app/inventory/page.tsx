'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Alert from '@/components/Alert';
import { Product } from '@/types';

interface InventoryItem {
  id: number;
  sku: string;
  store_location: string;
  current_stock: number;
  last_counted_date: string;
  notes: string;
  product_name: string;
  kategori: string;
  default_modal_satuan_idr: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const [formData, setFormData] = useState({
    sku: '',
    store_location: '',
    current_stock: 0,
    notes: ''
  });

  const locations = ['All', 'Gudang Utama', 'Toko A', 'Toko B', 'Toko C', 'Gudang Cabang'];

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, [selectedLocation]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const url = selectedLocation === 'All' 
        ? '/api/inventory' 
        : `/api/inventory?location=${encodeURIComponent(selectedLocation)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.store_location) {
      setAlert({
        isOpen: true,
        title: 'Data Tidak Lengkap',
        message: 'SKU dan lokasi toko wajib diisi.',
        type: 'warning'
      });
      return;
    }

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setAlert({
          isOpen: true,
          title: 'Berhasil',
          message: result.message,
          type: 'success'
        });
        setFormData({ sku: '', store_location: '', current_stock: 0, notes: '' });
        setShowAddForm(false);
        setEditingItem(null);
        loadInventory();
      } else {
        setAlert({
          isOpen: true,
          title: 'Gagal',
          message: result.error || 'Gagal menyimpan stok.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Gagal menyimpan stok.',
        type: 'error'
      });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      store_location: item.store_location,
      current_stock: item.current_stock,
      notes: item.notes || ''
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({ sku: '', store_location: '', current_stock: 0, notes: '' });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const getTotalValue = () => {
    return inventory.reduce((sum, item) => {
      const value = (item.current_stock || 0) * (item.default_modal_satuan_idr || 0);
      return sum + value;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Stock Opname</h1>
            <p className="text-gray-600">Kelola inventori barang di berbagai lokasi</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Stok
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Filter Lokasi
              </label>
              <select
                id="location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="input-field"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        {!loading && inventory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Total Item</div>
              <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Total Stok</div>
              <div className="text-2xl font-bold text-gray-900">
                {inventory.reduce((sum, item) => sum + (item.current_stock || 0), 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Total Nilai (IDR)</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(getTotalValue())}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Stok' : 'Tambah Stok Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                    Produk *
                  </label>
                  <select
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Pilih Produk</option>
                    {products.map(product => (
                      <option key={product.sku} value={product.sku}>
                        {product.nama} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="store_location" className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasi Toko *
                  </label>
                  <select
                    id="store_location"
                    value={formData.store_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_location: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Pilih Lokasi</option>
                    {locations.filter(loc => loc !== 'All').map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="current_stock" className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    id="current_stock"
                    value={formData.current_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan
                  </label>
                  <input
                    type="text"
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input-field"
                    placeholder="Catatan tambahan..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingItem ? 'Update Stok' : 'Simpan Stok'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory found</h3>
              <p className="text-gray-600 mb-4">
                {selectedLocation === 'All' 
                  ? 'No inventory records found'
                  : `No inventory found for ${selectedLocation}`
                }
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Inventory
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai (IDR)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terakhir Dihitung
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={`${item.sku}-${item.store_location}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-500">{item.sku}</div>
                          {item.kategori && (
                            <div className="text-xs text-gray-400">{item.kategori}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.store_location}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.current_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((item.current_stock || 0) * (item.default_modal_satuan_idr || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.last_counted_date || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit Stock"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
