'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Alert from '@/components/Alert';
import Link from 'next/link';
import { TransactionFormData, Product } from '@/types';
import { ArrowLeftIcon } from '@/components/Icons';

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductList, setShowProductList] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const [formData, setFormData] = useState<TransactionFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    sku: '',
    qty: '1',
    modal_satuan_idr: '',
    harga_jual_sgd: '',
    fee_rate: '2.9',
    fee_flat_sgd: '0.5',
    biaya_lain_sgd: '0',
    apply_gst: false,
    gst_rate: '0.09',
    pelanggan: '',
    metode_bayar: 'Tunai',
    catatan: ''
  });

  // Calculate total price
  const calculateTotalPrice = () => {
    const qty = parseFloat(formData.qty) || 0;
    const price = parseFloat(formData.harga_jual_sgd) || 0;
    return (qty * price).toFixed(2);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    const qty = parseFloat(formData.qty) || 0;
    const cost = parseFloat(formData.modal_satuan_idr) || 0;
    return (qty * cost).toLocaleString('id-ID');
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(product =>
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.kategori && product.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
      setShowProductList(true);
    } else {
      setFilteredProducts(products.slice(0, 5)); // Show recent 5
      setShowProductList(false);
    }
  }, [searchQuery, products]);

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

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.nama);
    setShowProductList(false);
    
    // Prefill form data
    setFormData(prev => ({
      ...prev,
      sku: product.sku,
      modal_satuan_idr: product.default_modal_satuan_idr?.toString() || '',
      harga_jual_sgd: product.default_harga_jual_sgd?.toString() || ''
    }));
  };

  const handleProductSearch = (value: string) => {
    setSearchQuery(value);
    
    // If user types an SKU directly, try to find and select the product
    const directProduct = products.find(p => 
      p.sku.toLowerCase() === value.toLowerCase()
    );
    
    if (directProduct) {
      setSelectedProduct(directProduct);
      setFormData(prev => ({
        ...prev,
        sku: directProduct.sku,
        modal_satuan_idr: directProduct.default_modal_satuan_idr?.toString() || '',
        harga_jual_sgd: directProduct.default_harga_jual_sgd?.toString() || ''
      }));
    } else {
      // Clear selection if no direct match
      setSelectedProduct(null);
      setFormData(prev => ({
        ...prev,
        sku: value, // Allow manual SKU entry
        modal_satuan_idr: '',
        harga_jual_sgd: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.qty || !formData.harga_jual_sgd) {
      setAlert({
        isOpen: true,
        title: 'Data Tidak Lengkap',
        message: 'SKU, Kuantitas, dan Harga Jual wajib diisi.',
        type: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        tanggal: formData.tanggal,
        sku: formData.sku,
        qty: parseInt(formData.qty),
        modal_satuan_idr: formData.modal_satuan_idr ? parseInt(formData.modal_satuan_idr) : undefined,
        harga_jual_sgd: parseFloat(formData.harga_jual_sgd),
        // Use default values for removed fields
        fee_rate: 2.9,
        fee_flat_sgd: 0.5,
        biaya_lain_sgd: 0,
        apply_gst: false,
        gst_rate: 0.09,
        pelanggan: formData.pelanggan,
        metode_bayar: formData.metode_bayar,
        catatan: formData.catatan
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const result = await response.json();

      if (result.success) {
        setAlert({
          isOpen: true,
          title: 'Berhasil',
          message: 'Transaksi berhasil disimpan!',
          type: 'success'
        });
        setTimeout(() => {
          router.push('/transactions');
        }, 1500);
      } else {
        setAlert({
          isOpen: true,
          title: 'Gagal Menyimpan',
          message: result.error || 'Gagal menyimpan transaksi.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Gagal menyimpan transaksi.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/transactions" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Kembali ke Transaksi</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Transaksi Baru</h1>
          <p className="text-lg text-gray-600 mt-2">Catat penjualan baru</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="border-b border-gray-100 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Informasi Dasar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    id="tanggal"
                    name="tanggal"
                    value={formData.tanggal}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div className="relative">
                  <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-2">
                    Produk *
                  </label>
                  <input
                    type="text"
                    id="product"
                    placeholder="Cari produk berdasarkan nama atau SKU..."
                    value={searchQuery}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    onFocus={() => setShowProductList(true)}
                    className="input-field"
                    required
                  />
                  
                  {/* Product Dropdown */}
                  {showProductList && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.sku}
                          onClick={() => selectProduct(product)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{product.nama}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                          {product.default_harga_jual_sgd && (
                            <div className="text-sm text-gray-600">SGD {product.default_harga_jual_sgd}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-2">
                  Kuantitas *
                </label>
                <input
                  type="number"
                  id="qty"
                  name="qty"
                  value={formData.qty}
                  onChange={handleInputChange}
                  className="input-field"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="border-b border-gray-100 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Harga & Biaya</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="harga_jual_sgd" className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Jual (SGD) *
                  </label>
                  <input
                    type="number"
                    id="harga_jual_sgd"
                    name="harga_jual_sgd"
                    value={formData.harga_jual_sgd}
                    onChange={handleInputChange}
                    className="input-field"
                    step="0.01"
                    placeholder="7.90"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Otomatis terisi dari produk</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Total (SGD)
                  </label>
                  <div className="input-field bg-gray-50 text-gray-600 font-medium">
                    ${calculateTotalPrice()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Kuantitas × Harga Jual</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="modal_satuan_idr" className="block text-sm font-medium text-gray-700 mb-2">
                    Biaya Satuan (IDR)
                  </label>
                  <input
                    type="number"
                    id="modal_satuan_idr"
                    name="modal_satuan_idr"
                    value={formData.modal_satuan_idr}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="45000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Otomatis terisi dari produk</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biaya Total (IDR)
                  </label>
                  <div className="input-field bg-gray-50 text-gray-600 font-medium">
                    Rp {calculateTotalCost()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Kuantitas × Biaya Satuan</p>
                </div>
              </div>
            </div>


            {/* Customer Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Informasi Pelanggan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="pelanggan" className="block text-sm font-medium text-gray-700 mb-2">
                    Pelanggan
                  </label>
                  <input
                    type="text"
                    id="pelanggan"
                    name="pelanggan"
                    value={formData.pelanggan}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label htmlFor="metode_bayar" className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Pembayaran
                  </label>
                  <select
                    id="metode_bayar"
                    name="metode_bayar"
                    value={formData.metode_bayar}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Kartu">Kartu</option>
                    <option value="Transfer">Transfer</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <input
                  type="text"
                  id="catatan"
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Catatan tambahan..."
                />
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
                  'Simpan Transaksi'
                )}
              </button>
              <Link href="/transactions" className="btn-secondary flex items-center justify-center">
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
      />
    </div>
  );
}