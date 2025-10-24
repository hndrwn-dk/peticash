import { Product, Transaction, MonthlyReport, ApiResponse } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export class BookkeeperService {
  private dataDir: string;
  private masterDir: string;
  private ledgerDir: string;
  private productsFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.masterDir = path.join(dataDir, 'master');
    this.ledgerDir = path.join(dataDir, 'pembukuan');
    this.productsFile = path.join(this.masterDir, 'products.json');
  }

  // Utility functions
  private roundIDR(value: number): number {
    return Math.round(value);
  }

  private roundSGD(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private validateDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private getLedgerPath(ym: string): string {
    return path.join(this.ledgerDir, `ledger_${ym}.csv`);
  }

  private getRekapPath(ym: string): string {
    return path.join(this.ledgerDir, `rekap_${ym}.csv`);
  }

  // Ensure directories exist
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.masterDir, { recursive: true });
      await fs.mkdir(this.ledgerDir, { recursive: true });
    } catch (error) {
      // Directories might already exist
    }
  }

  // PRODUCT MANAGEMENT
  async getProducts(q?: string, barcode?: string): Promise<Product[]> {
    try {
      await this.ensureDirectories();
      
      let products: Product[] = [];
      try {
        const data = await fs.readFile(this.productsFile, 'utf-8');
        products = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or is empty
        return [];
      }

      if (barcode) {
        return products.filter(p => p.barcode === barcode);
      }

      if (q) {
        const query = q.toLowerCase();
        return products.filter(p => 
          p.sku.toLowerCase().includes(query) ||
          p.nama.toLowerCase().includes(query) ||
          (p.kategori && p.kategori.toLowerCase().includes(query))
        );
      }

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async upsertProduct(product: Product): Promise<ApiResponse> {
    try {
      if (!product.sku || !product.nama) {
        return { success: false, error: 'SKU dan nama wajib diisi' };
      }

      await this.ensureDirectories();
      
      const products = await this.getProducts();
      const existingIndex = products.findIndex(p => p.sku === product.sku);
      
      const newProduct: Product = {
        sku: product.sku,
        nama: product.nama,
        default_modal_satuan_IDR: product.default_modal_satuan_IDR,
        default_harga_jual_SGD: product.default_harga_jual_SGD,
        kategori: product.kategori || '',
        barcode: product.barcode || ''
      };

      let action: string;
      if (existingIndex >= 0) {
        products[existingIndex] = newProduct;
        action = 'updated';
      } else {
        products.push(newProduct);
        action = 'added';
      }

      // Sort by SKU
      products.sort((a, b) => a.sku.localeCompare(b.sku));

      await fs.writeFile(this.productsFile, JSON.stringify(products, null, 2), 'utf-8');
      
      return { success: true, message: `Product ${action}`, data: { sku: product.sku, action } };
    } catch (error) {
      console.error('Error upserting product:', error);
      return { success: false, error: 'Gagal menyimpan produk' };
    }
  }

  async bulkImportProducts(csvText: string): Promise<ApiResponse> {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, error: 'CSV harus memiliki header dan minimal 1 baris data' };
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['sku', 'nama', 'default_modal_satuan_IDR', 'default_harga_jual_SGD', 'kategori', 'barcode'];
      
      let imported = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        if (!row.sku || !row.nama) {
          errors.push(`Baris ${i + 1}: SKU dan nama wajib diisi`);
          continue;
        }

        const product: Product = {
          sku: row.sku,
          nama: row.nama,
          kategori: row.kategori || '',
          barcode: row.barcode || ''
        };

        if (row.default_modal_satuan_IDR) {
          const modal = parseInt(row.default_modal_satuan_IDR);
          if (!isNaN(modal)) product.default_modal_satuan_IDR = modal;
        }

        if (row.default_harga_jual_SGD) {
          const harga = parseFloat(row.default_harga_jual_SGD);
          if (!isNaN(harga)) product.default_harga_jual_SGD = harga;
        }

        const result = await this.upsertProduct(product);
        if (result.success) {
          imported++;
        } else {
          errors.push(`Baris ${i + 1}: ${result.error}`);
        }
      }

      return {
        success: true,
        message: `Imported ${imported} products`,
        data: { imported, errors }
      };
    } catch (error) {
      console.error('Error bulk importing:', error);
      return { success: false, error: 'Gagal memproses CSV' };
    }
  }

  // TRANSACTION MANAGEMENT
  async addTransaction(transaction: Transaction): Promise<ApiResponse> {
    try {
      // Validate required fields
      if (!transaction.tanggal || !this.validateDate(transaction.tanggal)) {
        return { success: false, error: 'Format tanggal harus YYYY-MM-DD' };
      }

      if (!transaction.sku) {
        return { success: false, error: 'SKU wajib diisi' };
      }

      if (!transaction.qty || transaction.qty <= 0) {
        return { success: false, error: 'Qty harus > 0', data: { status: 'invalid' } };
      }

      if (!transaction.harga_jual_SGD || transaction.harga_jual_SGD <= 0) {
        return { success: false, error: 'Harga jual SGD wajib diisi dan > 0' };
      }

      if (!transaction.modal_satuan_IDR && !transaction.modal_total_IDR) {
        return { success: false, error: 'Modal satuan IDR atau modal total IDR wajib diisi', data: { status: 'incomplete' } };
      }

      await this.ensureDirectories();

      // Calculate derived fields
      let status: 'complete' | 'incomplete' | 'invalid' = 'complete';
      
      // Calculate modal_total_IDR if not provided
      let modalTotalIDR = transaction.modal_total_IDR;
      if (!modalTotalIDR && transaction.modal_satuan_IDR) {
        modalTotalIDR = this.roundIDR(transaction.qty * transaction.modal_satuan_IDR);
      } else if (modalTotalIDR) {
        modalTotalIDR = this.roundIDR(modalTotalIDR);
      }

      const modalSatuanIDR = transaction.modal_satuan_IDR ? this.roundIDR(transaction.modal_satuan_IDR) : undefined;

      // Calculate pendapatan_SGD
      const pendapatanSGD = this.roundSGD(transaction.qty * transaction.harga_jual_SGD);

      // Calculate biaya_transaksi_SGD
      const feeRate = (transaction.fee_rate || 0) / 100;
      const feeFlatSGD = transaction.fee_flat_SGD || 0;
      const biayaTransaksiSGD = this.roundSGD((feeRate * pendapatanSGD) + feeFlatSGD);

      // Calculate GST
      const applyGST = transaction.apply_gst || false;
      const gstRate = transaction.gst_rate || 0.09;
      const gstSGD = applyGST ? this.roundSGD(pendapatanSGD * gstRate) : 0;

      // Prepare transaction data
      const processedTransaction: Transaction = {
        tanggal: transaction.tanggal,
        sku: transaction.sku,
        qty: transaction.qty,
        modal_satuan_IDR: modalSatuanIDR,
        modal_total_IDR: modalTotalIDR,
        harga_jual_SGD: this.roundSGD(transaction.harga_jual_SGD),
        pendapatan_SGD: pendapatanSGD,
        fee_rate: transaction.fee_rate,
        fee_flat_SGD: feeFlatSGD,
        biaya_transaksi_SGD: biayaTransaksiSGD,
        biaya_lain_SGD: this.roundSGD(transaction.biaya_lain_SGD || 0),
        apply_gst: applyGST,
        gst_rate: gstRate,
        GST_SGD: gstSGD,
        pelanggan: transaction.pelanggan || '',
        metode_bayar: transaction.metode_bayar || '',
        catatan: (transaction.catatan || '').replace(/\n/g, ' ').trim(),
        status: status
      };

      // Get target file
      const ym = transaction.tanggal.substring(0, 7); // YYYY-MM
      const ledgerPath = this.getLedgerPath(ym);

      // Check if file exists
      let fileExists = false;
      try {
        await fs.access(ledgerPath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      // Prepare CSV content
      const headers = [
        'tanggal', 'sku', 'qty', 'modal_satuan_IDR', 'modal_total_IDR',
        'harga_jual_SGD', 'pendapatan_SGD', 'fee_rate', 'fee_flat_SGD',
        'biaya_transaksi_SGD', 'biaya_lain_SGD', 'apply_gst', 'gst_rate',
        'GST_SGD', 'pelanggan', 'metode_bayar', 'catatan', 'status'
      ];

      const values = headers.map(header => {
        const value = processedTransaction[header as keyof Transaction];
        return value !== undefined ? String(value) : '';
      });

      let csvContent = '';
      if (!fileExists) {
        csvContent = headers.join(',') + '\n';
      }
      csvContent += values.join(',') + '\n';

      await fs.appendFile(ledgerPath, csvContent, 'utf-8');

      return { 
        success: true, 
        message: 'Transaksi berhasil disimpan',
        data: { ym, status, transaction: processedTransaction }
      };

    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error: 'Gagal menyimpan transaksi' };
    }
  }

  // REPORTING
  async generateMonthlyReport(ym: string): Promise<ApiResponse<{ report: MonthlyReport, summary: string }>> {
    try {
      const ledgerPath = this.getLedgerPath(ym);
      
      let fileExists = false;
      try {
        await fs.access(ledgerPath);
        fileExists = true;
      } catch {
        return { success: false, error: `Ledger untuk ${ym} tidak ditemukan` };
      }

      const csvContent = await fs.readFile(ledgerPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      if (lines.length <= 1) {
        return { success: false, error: `Tidak ada transaksi di ${ym}` };
      }

      const headers = lines[0].split(',');
      const transactions: Transaction[] = [];

      // Parse transactions
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const transaction: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (value !== undefined && value !== '') {
            if (['qty', 'modal_satuan_IDR', 'modal_total_IDR', 'harga_jual_SGD', 'pendapatan_SGD', 
                 'fee_rate', 'fee_flat_SGD', 'biaya_transaksi_SGD', 'biaya_lain_SGD', 'gst_rate', 'GST_SGD'].includes(header)) {
              transaction[header] = parseFloat(value);
            } else if (header === 'apply_gst') {
              transaction[header] = value.toLowerCase() === 'true';
            } else {
              transaction[header] = value;
            }
          }
        });
        
        transactions.push(transaction as Transaction);
      }

      // Calculate totals
      let totalModalIDR = 0;
      let totalPenjualanSGD = 0;
      let totalBiayaTransaksiSGD = 0;
      let totalBiayaLainSGD = 0;
      let totalGSTSGD = 0;
      let transaksiLengkap = 0;
      let transaksiIncomplete = 0;

      const skuRevenue: { [key: string]: number } = {};

      transactions.forEach(tx => {
        const status = tx.status || 'complete';
        
        if (status === 'complete') {
          transaksiLengkap++;
        } else {
          transaksiIncomplete++;
        }

        // Add to totals
        if (tx.modal_total_IDR) totalModalIDR += tx.modal_total_IDR;
        if (tx.pendapatan_SGD) {
          totalPenjualanSGD += tx.pendapatan_SGD;
          skuRevenue[tx.sku] = (skuRevenue[tx.sku] || 0) + tx.pendapatan_SGD;
        }
        if (tx.biaya_transaksi_SGD) totalBiayaTransaksiSGD += tx.biaya_transaksi_SGD;
        if (tx.biaya_lain_SGD) totalBiayaLainSGD += tx.biaya_lain_SGD;
        if (tx.GST_SGD) totalGSTSGD += tx.GST_SGD;
      });

      // Round totals
      totalModalIDR = this.roundIDR(totalModalIDR);
      totalPenjualanSGD = this.roundSGD(totalPenjualanSGD);
      totalBiayaTransaksiSGD = this.roundSGD(totalBiayaTransaksiSGD);
      totalBiayaLainSGD = this.roundSGD(totalBiayaLainSGD);
      totalGSTSGD = this.roundSGD(totalGSTSGD);

      // Get top SKUs
      const topSKUs = Object.entries(skuRevenue)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([sku]) => sku);

      const report: MonthlyReport = {
        periode: ym,
        total_modal_IDR: totalModalIDR,
        total_penjualan_SGD: totalPenjualanSGD,
        total_biaya_transaksi_SGD: totalBiayaTransaksiSGD,
        total_biaya_lain_SGD: totalBiayaLainSGD,
        total_GST_SGD: totalGSTSGD,
        transaksi_lengkap: transaksiLengkap,
        transaksi_incomplete: transaksiIncomplete,
        top_sku_by_revenue: topSKUs.join(', ')
      };

      // Save report
      const rekapPath = this.getRekapPath(ym);
      const rekapHeaders = [
        'periode', 'total_modal_IDR', 'total_penjualan_SGD',
        'total_biaya_transaksi_SGD', 'total_biaya_lain_SGD', 'total_GST_SGD',
        'transaksi_lengkap', 'transaksi_incomplete', 'top_sku_by_revenue'
      ];
      
      const rekapValues = rekapHeaders.map(header => String(report[header as keyof MonthlyReport]));
      const rekapCSV = rekapHeaders.join(',') + '\n' + rekapValues.join(',') + '\n';
      
      await fs.writeFile(rekapPath, rekapCSV, 'utf-8');

      // Generate summary
      const summary = [
        `Periode: ${ym}`,
        `Total modal: IDR ${totalModalIDR.toLocaleString()}`,
        `Total penjualan: SGD ${totalPenjualanSGD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `Biaya transaksi: SGD ${totalBiayaTransaksiSGD.toLocaleString('en-US', { minimumFractionDigits: 2 })} | Biaya lain: SGD ${totalBiayaLainSGD.toLocaleString('en-US', { minimumFractionDigits: 2 })} | GST: SGD ${totalGSTSGD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `Transaksi lengkap: ${transaksiLengkap} | Incomplete/invalid: ${transaksiIncomplete}`,
        `Top SKU (revenue): ${topSKUs.map((sku, i) => `${i + 1}) ${sku}`).join(' | ')}`
      ].join('\n');

      return {
        success: true,
        data: { report, summary }
      };

    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: 'Gagal generate rekap' };
    }
  }

  async getTransactions(ym: string, limit?: number): Promise<Transaction[]> {
    try {
      const ledgerPath = this.getLedgerPath(ym);
      
      try {
        await fs.access(ledgerPath);
      } catch {
        return [];
      }

      const csvContent = await fs.readFile(ledgerPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      if (lines.length <= 1) return [];

      const headers = lines[0].split(',');
      const transactions: Transaction[] = [];

      const linesToProcess = limit ? lines.slice(1, limit + 1) : lines.slice(1);

      for (const line of linesToProcess) {
        const values = line.split(',');
        const transaction: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (value !== undefined && value !== '') {
            if (['qty', 'modal_satuan_IDR', 'modal_total_IDR', 'harga_jual_SGD', 'pendapatan_SGD', 
                 'fee_rate', 'fee_flat_SGD', 'biaya_transaksi_SGD', 'biaya_lain_SGD', 'gst_rate', 'GST_SGD'].includes(header)) {
              transaction[header] = parseFloat(value);
            } else if (header === 'apply_gst') {
              transaction[header] = value.toLowerCase() === 'true';
            } else {
              transaction[header] = value;
            }
          }
        });
        
        transactions.push(transaction as Transaction);
      }

      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const bookkeeper = new BookkeeperService();