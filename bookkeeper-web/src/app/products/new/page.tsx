'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { ProductFormData } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      alert('SKU and Product Name are required');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        sku: formData.sku.toUpperCase(),
        nama: formData.nama,
        kategori: formData.kategori,
        barcode: formData.barcode,
        ...(formData.default_modal_satuan_IDR && {
          default_modal_satuan_IDR: parseInt(formData.default_modal_satuan_IDR)
        }),
        ...(formData.default_harga_jual_SGD && {
          default_harga_jual_SGD: parseFloat(formData.default_harga_jual_SGD)
        })
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
        router.push('/products');
      } else {
        alert(result.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
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
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product in your catalog</p>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    id="barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="8991234567890"
                  />
                  <p className="text-xs text-gray-500 mt-1">For barcode scanning</p>
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
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Product
                  </>
                )}
              </button>
              <Link href="/products" className="btn-secondary flex items-center justify-center">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}