'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Alert from '@/components/Alert';
import Link from 'next/link';
import { ProductFormData } from '@/types';
import { ArrowLeftIcon } from '@/components/Icons';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    nama: '',
    default_modal_satuan_IDR: '',
    default_harga_jual_SGD: '',
    kategori: '',
    barcode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.nama) {
      setAlert({
        isOpen: true,
        title: 'Data Tidak Lengkap',
        message: 'SKU dan Nama Produk wajib diisi.',
        type: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      const productData = {
        sku: formData.sku.toUpperCase(),
        nama: formData.nama,
        kategori: formData.kategori,
        barcode: formData.barcode,
        default_modal_satuan_IDR: formData.default_modal_satuan_IDR ? parseInt(formData.default_modal_satuan_IDR) : null,
        default_harga_jual_SGD: formData.default_harga_jual_SGD ? parseFloat(formData.default_harga_jual_SGD) : null
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (result.success) {
        setAlert({
          isOpen: true,
          title: 'Berhasil',
          message: 'Produk berhasil disimpan!',
          type: 'success'
        });
        setTimeout(() => {
          router.push('/products');
        }, 1500);
      } else {
        setAlert({
          isOpen: true,
          title: 'Gagal Menyimpan',
          message: result.error || 'Gagal menyimpan produk.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Gagal menyimpan produk.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/products" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Kembali ke Produk</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-gray-600 mt-2">Buat produk baru dalam katalog Anda</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Required Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., KOPI-ARABICA-250G"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique product identifier</p>
                </div>

                <div>
                  <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Kopi Arabica 250g"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="default_modal_satuan_IDR" className="block text-sm font-medium text-gray-700 mb-2">
                    Default Cost per Unit (IDR)
                  </label>
                  <input
                    type="number"
                    id="default_modal_satuan_IDR"
                    name="default_modal_satuan_IDR"
                    value={formData.default_modal_satuan_IDR}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="45000"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cost price in Indonesian Rupiah</p>
                </div>

                <div>
                  <label htmlFor="default_harga_jual_SGD" className="block text-sm font-medium text-gray-700 mb-2">
                    Default Selling Price (SGD)
                  </label>
                  <input
                    type="number"
                    id="default_harga_jual_SGD"
                    name="default_harga_jual_SGD"
                    value={formData.default_harga_jual_SGD}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="7.90"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Selling price in Singapore Dollars</p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    id="kategori"
                    name="kategori"
                    value={formData.kategori}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Kopi, Teh, Makanan"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Product'
                )}
              </button>
              <Link href="/products" className="btn-secondary flex items-center justify-center">
                Cancel
              </Link>
            </div>
          </form>
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