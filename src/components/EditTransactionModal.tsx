'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';

interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
}

export default function EditTransactionModal({ transaction, onSave, onCancel }: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    tanggal: transaction.tanggal ? transaction.tanggal.split('T')[0] : '',
    sku: transaction.sku || '',
    qty: transaction.qty?.toString() || '',
    modal_satuan_idr: transaction.modal_satuan_idr?.toString() || '',
    harga_jual_sgd: transaction.harga_jual_sgd?.toString() || '',
    pelanggan: transaction.pelanggan || '',
    metode_bayar: transaction.metode_bayar || '',
    catatan: transaction.catatan || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTransaction: Transaction = {
      ...transaction,
      tanggal: formData.tanggal,
      sku: formData.sku,
      qty: parseInt(formData.qty) || 0,
      modal_satuan_idr: formData.modal_satuan_idr ? parseInt(formData.modal_satuan_idr) : undefined,
      harga_jual_sgd: parseFloat(formData.harga_jual_sgd) || 0,
      pelanggan: formData.pelanggan,
      metode_bayar: formData.metode_bayar,
      catatan: formData.catatan
    };

    onSave(updatedTransaction);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Transaction</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
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
                placeholder="PRODUCT-SKU"
                required
              />
            </div>

            <div>
              <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
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

            <div>
              <label htmlFor="harga_jual_sgd" className="block text-sm font-medium text-gray-700 mb-2">
                Price (SGD) *
              </label>
              <input
                type="number"
                id="harga_jual_sgd"
                name="harga_jual_sgd"
                value={formData.harga_jual_sgd}
                onChange={handleInputChange}
                className="input-field"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="modal_satuan_idr" className="block text-sm font-medium text-gray-700 mb-2">
                Cost per Unit (IDR)
              </label>
              <input
                type="number"
                id="modal_satuan_idr"
                name="modal_satuan_idr"
                value={formData.modal_satuan_idr}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                placeholder="Optional"
              />
            </div>

            <div>
              <label htmlFor="metode_bayar" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                id="metode_bayar"
                name="metode_bayar"
                value={formData.metode_bayar}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="">Select payment method</option>
                <option value="Tunai">Cash</option>
                <option value="Kartu">Card</option>
                <option value="Transfer">Transfer</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pelanggan" className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>
            <input
              type="text"
              id="pelanggan"
              name="pelanggan"
              value={formData.pelanggan}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Customer name (optional)"
            />
          </div>

          <div>
            <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="catatan"
              name="catatan"
              value={formData.catatan}
              onChange={handleInputChange}
              className="input-field"
              rows={3}
              placeholder="Additional notes (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}