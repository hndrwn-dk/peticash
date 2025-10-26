// Product Types
export interface Product {
  sku: string;
  nama: string;
  default_modal_satuan_idr?: number;
  default_harga_jual_sgd?: number;
  kategori?: string;
  barcode?: string;
}

// Transaction Types
export interface Transaction {
  id?: number;
  tanggal: string; // YYYY-MM-DD
  sku: string;
  qty: number;
  modal_satuan_idr?: number;
  modal_total_idr?: number;
  harga_jual_sgd: number;
  pendapatan_sgd?: number;
  fee_rate?: number;
  fee_flat_sgd?: number;
  biaya_transaksi_sgd?: number;
  biaya_lain_sgd?: number;
  apply_gst?: boolean;
  gst_rate?: number;
  gst_sgd?: number;
  pelanggan?: string;
  metode_bayar?: string;
  catatan?: string;
  status?: 'complete' | 'incomplete' | 'invalid';
}

// Monthly Summary Types
export interface MonthlyReport {
  periode: string; // YYYY-MM
  total_modal_idr: number;
  total_penjualan_sgd: number;
  total_biaya_transaksi_sgd: number;
  total_biaya_lain_sgd: number;
  total_gst_sgd: number;
  transaksi_lengkap: number;
  transaksi_incomplete: number;
  top_sku_by_revenue: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Search and Filter Types
export interface ProductSearchParams {
  q?: string;
  barcode?: string;
  kategori?: string;
}

export interface TransactionSearchParams {
  periode?: string; // YYYY-MM
  sku?: string;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}

// UI State Types
export interface ProductFormData {
  sku: string;
  nama: string;
  default_modal_satuan_idr: string;
  default_harga_jual_sgd: string;
  kategori: string;
  barcode: string;
}

export interface TransactionFormData {
  tanggal: string;
  sku: string;
  qty: string;
  modal_satuan_idr: string;
  harga_jual_sgd: string;
  fee_rate: string;
  fee_flat_sgd: string;
  biaya_lain_sgd: string;
  apply_gst: boolean;
  gst_rate: string;
  pelanggan: string;
  metode_bayar: string;
  catatan: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_products: number;
  current_month_transactions: number;
  current_month_revenue_sgd: number;
  current_month_modal_idr: number;
  recent_transactions: Transaction[];
  top_products: Array<{
    sku: string;
    nama: string;
    revenue: number;
    qty_sold: number;
  }>;
}