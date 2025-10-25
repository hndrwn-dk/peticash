import { sql } from '@vercel/postgres';
import { Product, Transaction, MonthlyReport, ApiResponse } from '@/types';

export class PostgresDatabaseService {
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🐘 Initializing PostgreSQL database...');
      
      // Create products table
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          sku VARCHAR(50) PRIMARY KEY,
          nama VARCHAR(255) NOT NULL,
          default_modal_satuan_IDR INTEGER,
          default_harga_jual_SGD DECIMAL(10,2),
          kategori VARCHAR(100) DEFAULT '',
          barcode VARCHAR(100) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create transactions table
      await sql`
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          tanggal DATE NOT NULL,
          sku VARCHAR(50) NOT NULL,
          qty INTEGER NOT NULL,
          modal_satuan_IDR INTEGER,
          modal_total_IDR INTEGER,
          harga_jual_SGD DECIMAL(10,2) NOT NULL,
          pendapatan_SGD DECIMAL(10,2) NOT NULL,
          fee_rate DECIMAL(5,2) DEFAULT 0,
          fee_flat_SGD DECIMAL(10,2) DEFAULT 0,
          biaya_transaksi_SGD DECIMAL(10,2) DEFAULT 0,
          biaya_lain_SGD DECIMAL(10,2) DEFAULT 0,
          apply_gst BOOLEAN DEFAULT FALSE,
          gst_rate DECIMAL(5,4) DEFAULT 0.09,
          GST_SGD DECIMAL(10,2) DEFAULT 0,
          pelanggan VARCHAR(255) DEFAULT '',
          metode_bayar VARCHAR(50) DEFAULT '',
          catatan TEXT DEFAULT '',
          status VARCHAR(20) DEFAULT 'complete',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sku) REFERENCES products(sku)
        )
      `;

      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions(tanggal)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_sku ON transactions(sku)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_periode ON transactions(DATE_TRUNC('month', tanggal))`;

      await this.seedSampleData();
      console.log('✅ PostgreSQL database initialized successfully');
      
    } catch (error) {
      console.error('❌ PostgreSQL initialization error:', error);
      throw error;
    }
  }

  private async seedSampleData(): Promise<void> {
    try {
      // Check if products already exist
      const existingProducts = await sql`SELECT COUNT(*) as count FROM products`;
      if (existingProducts.rows[0].count > 0) {
        console.log('📦 Sample products already exist, skipping seed');
        return;
      }

      console.log('🌱 Seeding sample products...');
      
      // Insert sample products
      await sql`
        INSERT INTO products (sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori) VALUES
        ('KOPI-ARABICA-250G', 'Kopi Arabica Premium 250g', 45000, 7.90, 'Minuman'),
        ('TEH-MATCHA-100G', 'Teh Matcha Organik 100g', 33000, 8.50, 'Minuman'),
        ('COKLAT-DARK-200G', 'Dark Chocolate 70% 200g', 28000, 6.50, 'Makanan'),
        ('KOPI-ROBUSTA-250G', 'Kopi Robusta Local 250g', 38000, 7.20, 'Minuman'),
        ('TEH-EARL-GREY-100G', 'Earl Grey Tea 100g', 25000, 5.90, 'Minuman')
      `;

      console.log('✅ Sample products seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding sample data:', error);
    }
  }

  // Helper methods
  private validateDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private roundSGD(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  private roundIDR(amount: number): number {
    return Math.round(amount);
  }

  // PRODUCT MANAGEMENT
  async getProducts(q?: string, barcode?: string): Promise<Product[]> {
    try {
      let query;
      
      if (barcode) {
        query = sql`SELECT sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode FROM products WHERE barcode = ${barcode}`;
      } else if (q) {
        const searchTerm = `%${q}%`;
        query = sql`SELECT sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode FROM products WHERE LOWER(nama) LIKE LOWER(${searchTerm}) OR LOWER(sku) LIKE LOWER(${searchTerm}) ORDER BY nama`;
      } else {
        query = sql`SELECT sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode FROM products ORDER BY nama`;
      }

      const result = await query;
      return result.rows as Product[];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async addProduct(product: Product): Promise<ApiResponse> {
    try {
      if (!product.sku || !product.nama) {
        return { success: false, error: 'SKU dan nama wajib diisi' };
      }

      await sql`
        INSERT INTO products (sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode, updated_at)
        VALUES (${product.sku}, ${product.nama}, ${product.default_modal_satuan_IDR || null}, ${product.default_harga_jual_SGD || null}, ${product.kategori || ''}, ${product.barcode || ''}, CURRENT_TIMESTAMP)
      `;

      return { 
        success: true, 
        message: 'Produk berhasil ditambahkan',
        data: product
      };
    } catch (error: any) {
      console.error('Error adding product:', error);
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'SKU sudah ada' };
      }
      return { success: false, error: 'Gagal menambahkan produk' };
    }
  }

  async updateProduct(sku: string, product: Partial<Product>): Promise<ApiResponse> {
    try {
      if (!sku) {
        return { success: false, error: 'SKU wajib diisi' };
      }

      const result = await sql`
        UPDATE products 
        SET nama = ${product.nama || ''}, 
            default_modal_satuan_IDR = ${product.default_modal_satuan_IDR || null},
            default_harga_jual_SGD = ${product.default_harga_jual_SGD || null},
            kategori = ${product.kategori || ''},
            barcode = ${product.barcode || ''},
            updated_at = CURRENT_TIMESTAMP
        WHERE sku = ${sku}
      `;

      if (!result.rowCount || result.rowCount === 0) {
        return { success: false, error: 'Produk tidak ditemukan' };
      }

      return { 
        success: true, 
        message: 'Produk berhasil diperbarui',
        data: { sku, ...product }
      };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error: 'Gagal memperbarui produk' };
    }
  }

  async deleteProduct(sku: string): Promise<ApiResponse> {
    try {
      if (!sku) {
        return { success: false, error: 'SKU wajib diisi' };
      }

      // Check if product exists
      const existing = await sql`SELECT sku FROM products WHERE sku = ${sku}`;
      if (existing.rows.length === 0) {
        return { success: false, error: 'Produk tidak ditemukan' };
      }

      // Check if product is used in transactions
      const transactionCount = await sql`SELECT COUNT(*) as count FROM transactions WHERE sku = ${sku}`;
      if (transactionCount.rows[0].count > 0) {
        return { 
          success: false, 
          error: `Produk tidak dapat dihapus karena sudah digunakan dalam ${transactionCount.rows[0].count} transaksi` 
        };
      }

      // Delete the product
      const result = await sql`DELETE FROM products WHERE sku = ${sku}`;

      if (result.rowCount && result.rowCount > 0) {
        return { 
          success: true, 
          message: 'Produk berhasil dihapus',
          data: { sku, deleted: true }
        };
      } else {
        return { success: false, error: 'Gagal menghapus produk' };
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: 'Gagal menghapus produk' };
    }
  }

  async upsertProduct(product: Product): Promise<ApiResponse> {
    try {
      if (!product.sku || !product.nama) {
        return { success: false, error: 'SKU dan nama wajib diisi' };
      }

      await sql`
        INSERT INTO products (sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode, updated_at)
        VALUES (${product.sku}, ${product.nama}, ${product.default_modal_satuan_IDR || null}, ${product.default_harga_jual_SGD || null}, ${product.kategori || ''}, ${product.barcode || ''}, CURRENT_TIMESTAMP)
        ON CONFLICT (sku) DO UPDATE SET
          nama = EXCLUDED.nama,
          default_modal_satuan_IDR = EXCLUDED.default_modal_satuan_IDR,
          default_harga_jual_SGD = EXCLUDED.default_harga_jual_SGD,
          kategori = EXCLUDED.kategori,
          barcode = EXCLUDED.barcode,
          updated_at = EXCLUDED.updated_at
      `;

      return { 
        success: true, 
        message: 'Produk berhasil disimpan',
        data: product
      };
    } catch (error: any) {
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

        try {
          await sql`
            INSERT INTO products (sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode, updated_at)
            VALUES (${row.sku}, ${row.nama}, ${parseInt(row.modal) || null}, ${parseFloat(row.harga) || null}, ${row.kategori || ''}, ${row.barcode || ''}, CURRENT_TIMESTAMP)
            ON CONFLICT (sku) DO UPDATE SET
              nama = EXCLUDED.nama,
              default_modal_satuan_IDR = EXCLUDED.default_modal_satuan_IDR,
              default_harga_jual_SGD = EXCLUDED.default_harga_jual_SGD,
              kategori = EXCLUDED.kategori,
              barcode = EXCLUDED.barcode,
              updated_at = EXCLUDED.updated_at
          `;
          imported++;
        } catch (error) {
          errors.push(`Baris ${i + 1}: ${error instanceof Error ? error.message : 'Error tidak dikenal'}`);
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
      console.log('🔍 Adding transaction:', JSON.stringify(transaction, null, 2));
      
      // Validate required fields
      if (!transaction.tanggal || !this.validateDate(transaction.tanggal)) {
        console.error('❌ Invalid date:', transaction.tanggal);
        return { success: false, error: 'Format tanggal harus YYYY-MM-DD' };
      }

      if (!transaction.sku) {
        console.error('❌ Missing SKU');
        return { success: false, error: 'SKU wajib diisi' };
      }

      // Check if product exists, create if it doesn't
      const existingProduct = await sql`SELECT sku FROM products WHERE sku = ${transaction.sku}`;
      
      if (existingProduct.rows.length === 0) {
        // Create a basic product entry for this SKU
        await sql`
          INSERT INTO products (sku, nama, created_at, updated_at)
          VALUES (${transaction.sku}, ${transaction.sku}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (sku) DO NOTHING
        `;
      }

      if (!transaction.qty || transaction.qty <= 0) {
        console.error('❌ Invalid quantity:', transaction.qty);
        return { success: false, error: 'Qty harus > 0', data: { status: 'invalid' } };
      }

      if (!transaction.harga_jual_SGD || transaction.harga_jual_SGD <= 0) {
        console.error('❌ Invalid price:', transaction.harga_jual_SGD);
        return { success: false, error: 'Harga jual SGD wajib diisi dan > 0' };
      }

      console.log('✅ Basic validation passed');

      // Calculate derived fields
      let status: 'complete' | 'incomplete' | 'invalid' = 'complete';
      
      // Calculate modal_total_IDR if not provided
      let modalTotalIDR = transaction.modal_total_IDR;
      if (!modalTotalIDR && transaction.modal_satuan_IDR) {
        modalTotalIDR = this.roundIDR(transaction.qty * transaction.modal_satuan_IDR);
      } else if (modalTotalIDR) {
        modalTotalIDR = this.roundIDR(modalTotalIDR);
      }

      const modalSatuanIDR = transaction.modal_satuan_IDR ? this.roundIDR(transaction.modal_satuan_IDR) : null;

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

      console.log('💾 Executing database insert...');

      const result = await sql`
        INSERT INTO transactions (
          tanggal, sku, qty, modal_satuan_IDR, modal_total_IDR,
          harga_jual_SGD, pendapatan_SGD, fee_rate, fee_flat_SGD,
          biaya_transaksi_SGD, biaya_lain_SGD, apply_gst, gst_rate,
          GST_SGD, pelanggan, metode_bayar, catatan, status
        ) VALUES (
          ${transaction.tanggal}, ${transaction.sku}, ${transaction.qty}, 
          ${modalSatuanIDR}, ${modalTotalIDR}, ${this.roundSGD(transaction.harga_jual_SGD)}, 
          ${pendapatanSGD}, ${transaction.fee_rate || 0}, ${feeFlatSGD || 0},
          ${biayaTransaksiSGD || 0}, ${this.roundSGD(transaction.biaya_lain_SGD || 0)}, 
          ${applyGST}, ${gstRate || 0}, ${gstSGD || 0}, 
          ${transaction.pelanggan || ''}, ${transaction.metode_bayar || ''}, 
          ${(transaction.catatan || '').replace(/\n/g, ' ').trim()}, ${status}
        )
        RETURNING id
      `;

      console.log('✅ Transaction inserted successfully, ID:', result.rows[0].id);

      const ym = transaction.tanggal.substring(0, 7); // YYYY-MM

      return { 
        success: true, 
        message: 'Transaksi berhasil disimpan',
        data: { ym, status, id: result.rows[0].id }
      };

    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      console.error('Transaction data was:', JSON.stringify(transaction, null, 2));
      return { success: false, error: `Gagal menyimpan transaksi: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async getTransactions(ym: string, limit?: number): Promise<Transaction[]> {
    try {
      let query;
      
      if (limit) {
        query = sql`
          SELECT * FROM transactions 
          WHERE TO_CHAR(tanggal, 'YYYY-MM') = ${ym}
          ORDER BY tanggal DESC, id DESC
          LIMIT ${limit}
        `;
      } else {
        query = sql`
          SELECT * FROM transactions 
          WHERE TO_CHAR(tanggal, 'YYYY-MM') = ${ym}
          ORDER BY tanggal DESC, id DESC
        `;
      }

      const result = await query;
      return result.rows as Transaction[];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async generateMonthlyReport(ym: string): Promise<ApiResponse> {
    try {
      const transactions = await this.getTransactions(ym);
      
      if (transactions.length === 0) {
        return { success: false, error: `Tidak ada transaksi untuk ${ym}` };
      }

      // Calculate totals
      let totalPendapatanSGD = 0;
      let totalModalIDR = 0;
      let totalBiayaTransaksiSGD = 0;
      let totalBiayaLainSGD = 0;
      let totalGSTSGD = 0;

      const productSummary: { [sku: string]: { qty: number, pendapatan: number, modal: number } } = {};

      transactions.forEach(tx => {
        totalPendapatanSGD += tx.pendapatan_SGD || 0;
        totalModalIDR += tx.modal_total_IDR || 0;
        totalBiayaTransaksiSGD += tx.biaya_transaksi_SGD || 0;
        totalBiayaLainSGD += tx.biaya_lain_SGD || 0;
        totalGSTSGD += tx.GST_SGD || 0;

        if (!productSummary[tx.sku]) {
          productSummary[tx.sku] = { qty: 0, pendapatan: 0, modal: 0 };
        }
        productSummary[tx.sku].qty += tx.qty;
        productSummary[tx.sku].pendapatan += tx.pendapatan_SGD || 0;
        productSummary[tx.sku].modal += tx.modal_total_IDR || 0;
      });

      // Find top SKU by revenue
      const topSku = Object.entries(productSummary)
        .sort(([,a], [,b]) => b.pendapatan - a.pendapatan)[0];

      const report: MonthlyReport = {
        periode: ym,
        total_modal_IDR: this.roundIDR(totalModalIDR),
        total_penjualan_SGD: this.roundSGD(totalPendapatanSGD),
        total_biaya_transaksi_SGD: this.roundSGD(totalBiayaTransaksiSGD),
        total_biaya_lain_SGD: this.roundSGD(totalBiayaLainSGD),
        total_GST_SGD: this.roundSGD(totalGSTSGD),
        transaksi_lengkap: transactions.filter(tx => tx.status === 'complete').length,
        transaksi_incomplete: transactions.filter(tx => tx.status === 'incomplete').length,
        top_sku_by_revenue: topSku ? topSku[0] : ''
      };

      return { success: true, data: report };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      return { success: false, error: 'Gagal membuat laporan bulanan' };
    }
  }
}

// Create singleton instance
export const postgresDatabase = new PostgresDatabaseService();