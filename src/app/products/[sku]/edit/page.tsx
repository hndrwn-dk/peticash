'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Alert from '@/components/Alert';
import Link from 'next/link';
import { ProductFormData, Product } from '@/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const sku = params.sku as string;
  
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });
  
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    nama: '',
    default_modal_satuan_idr: '',
    default_harga_jual_sgd: '',
    kategori: '',
    barcode: ''
  });

  useEffect(() => {
    if (sku) {
      loadProduct();
    }
  }, [sku]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      const response = await fetch(`/api/products?q=${encodeURIComponent(sku)}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const foundProduct = data.data.find((p: Product) => p.sku === sku);
        if (foundProduct) {
          setProduct(foundProduct);
          setFormData({
            sku: foundProduct.sku,
            nama: foundProduct.nama,
            default_modal_satuan_idr: foundProduct.default_modal_satuan_idr?.toString() || '',
            default_harga_jual_sgd: foundProduct.default_harga_jual_sgd?.toString() || '',
            kategori: foundProduct.kategori || '',
            barcode: foundProduct.barcode || ''
          });
        } else {
          setAlert({
            isOpen: true,
            title: 'Produk Tidak Ditemukan',
            message: 'Produk dengan SKU tersebut tidak ditemukan.',
            type: 'error'
          });
        }
      } else {
        setAlert({
          isOpen: true,
          title: 'Produk Tidak Ditemukan',
          message: 'Produk dengan SKU tersebut tidak ditemukan.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Gagal memuat data produk.',
        type: 'error'
      });
    } finally {
      setLoadingProduct(false);
    }
  };

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
        default_modal_satuan_idr: formData.default_modal_satuan_idr ? parseInt(formData.default_modal_satuan_idr) : null,
        default_harga_jual_sgd: formData.default_harga_jual_sgd ? parseFloat(formData.default_harga_jual_sgd) : null
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
          message: 'Produk berhasil diperbarui!',
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

  const handleDelete = async () => {
    if (!product) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${product.sku}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setAlert({
          isOpen: true,
          title: 'Berhasil',
          message: 'Produk berhasil dihapus!',
          type: 'success'
        });
        setTimeout(() => {
          router.push('/products');
        }, 1500);
      } else {
        setAlert({
          isOpen: true,
          title: 'Gagal Menghapus',
          message: result.error || 'Gagal menghapus produk.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Gagal menghapus produk.',
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

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data produk...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Produk Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">Produk dengan SKU "{sku}" tidak ditemukan.</p>
            <Link href="/products" className="btn-primary">
              Kembali ke Produk
            </Link>
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/products" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Kembali ke Produk
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
          <p className="text-gray-600 mt-2">Edit informasi produk {product.nama}</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
              
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
                    className="input-field bg-gray-50"
                    placeholder="e.g., KOPI-ARABICA-250G"
                    disabled
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">SKU tidak dapat diubah</p>
                </div>

                <div>
                  <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Produk *
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Harga</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="default_modal_satuan_idr" className="block text-sm font-medium text-gray-700 mb-2">
                    Modal Satuan Default (IDR)
                  </label>
                  <input
                    type="number"
                    id="default_modal_satuan_idr"
                    name="default_modal_satuan_idr"
                    value={formData.default_modal_satuan_idr}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="45000"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="default_harga_jual_sgd" className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Jual Default (SGD)
                  </label>
                  <input
                    type="number"
                    id="default_harga_jual_sgd"
                    name="default_harga_jual_sgd"
                    value={formData.default_harga_jual_sgd}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="7.90"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Tambahan</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
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
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAlert({
                    isOpen: true,
                    title: 'Konfirmasi Hapus',
                    message: `Apakah Anda yakin ingin menghapus produk "${product.nama}"? Tindakan ini tidak dapat dibatalkan.`,
                    type: 'warning'
                  });
                }}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
              >
                Hapus Produk
              </button>
              <Link href="/products" className="btn-secondary flex items-center justify-center">
                Batal
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
        confirmText={alert.type === 'warning' ? 'Ya, Hapus' : 'OK'}
        cancelText={alert.type === 'warning' ? 'Batal' : undefined}
        onConfirm={alert.type === 'warning' ? handleDelete : undefined}
      />
    </div>
  );
}