import Database from 'better-sqlite3';
import path from 'path';
import { Product, Transaction, MonthlyReport, ApiResponse } from '@/types';

export class DatabaseService {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Use /tmp on Vercel production, ./data locally
    const dataDir = process.env.NODE_ENV === 'production' ? '/tmp' : './data';
    this.dbPath = dbPath || path.join(dataDir, 'bookkeeper.db');
    
    try {
      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      this.db = new Database(this.dbPath);
      this.initializeDatabase();
      this.seedSampleData();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private initializeDatabase(): void {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        sku TEXT PRIMARY KEY,
        nama TEXT NOT NULL,
        default_modal_satuan_IDR INTEGER,
        default_harga_jual_SGD REAL,
        kategori TEXT,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal DATE NOT NULL,
        sku TEXT NOT NULL,
        qty INTEGER NOT NULL,
        modal_satuan_IDR INTEGER,
        modal_total_IDR INTEGER,
        harga_jual_SGD REAL NOT NULL,
        pendapatan_SGD REAL,
        fee_rate REAL DEFAULT 0,
        fee_flat_SGD REAL DEFAULT 0,
        biaya_transaksi_SGD REAL DEFAULT 0,
        biaya_lain_SGD REAL DEFAULT 0,
        apply_gst BOOLEAN DEFAULT FALSE,
        gst_rate REAL DEFAULT 0.09,
        GST_SGD REAL DEFAULT 0,
        pelanggan TEXT,
        metode_bayar TEXT,
        catatan TEXT,
        status TEXT DEFAULT 'complete',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_nama ON products (nama);
      CREATE INDEX IF NOT EXISTS idx_products_kategori ON products (kategori);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
      CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions (tanggal);
      CREATE INDEX IF NOT EXISTS idx_transactions_sku ON transactions (sku);
      CREATE INDEX IF NOT EXISTS idx_transactions_periode ON transactions (substr(tanggal, 1, 7));
    `);
  }

  private seedSampleData(): void {
    try {
      // Check if products already exist
      const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM products');
      const result = countStmt.get() as { count: number };
      
      // Only add sample data if database is empty
      if (result.count === 0) {
        const sampleProducts = [
          {
            sku: 'KOPI-ARABICA-250G',
            nama: 'Kopi Arabica 250g',
            default_modal_satuan_IDR: 45000,
            default_harga_jual_SGD: 7.9,
            kategori: 'Kopi',
            barcode: '8991234567890'
          },
          {
            sku: 'TEH-MATCHA-100G',
            nama: 'Teh Matcha 100g',
            default_modal_satuan_IDR: 33000,
            default_harga_jual_SGD: 8.5,
            kategori: 'Teh',
            barcode: '8991234567891'
          },
          {
            sku: 'COKLAT-DARK-200G',
            nama: 'Coklat Dark 200g',
            default_modal_satuan_IDR: 28000,
            default_harga_jual_SGD: 6.5,
            kategori: 'Coklat',
            barcode: '8991234567892'
          },
          {
            sku: 'KOPI-ROBUSTA-250G',
            nama: 'Kopi Robusta 250g',
            default_modal_satuan_IDR: 38000,
            default_harga_jual_SGD: 7.2,
            kategori: 'Kopi',
            barcode: '8991234567893'
          },
          {
            sku: 'TEH-EARL-GREY-100G',
            nama: 'Teh Earl Grey 100g',
            default_modal_satuan_IDR: 25000,
            default_harga_jual_SGD: 5.9,
            kategori: 'Teh',
            barcode: '8991234567894'
          }
        ];

        const stmt = this.db.prepare(`
          INSERT INTO products 
          (sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertMany = this.db.transaction((products: any[]) => {
          for (const product of products) {
            stmt.run(
              product.sku,
              product.nama,
              product.default_modal_satuan_IDR,
              product.default_harga_jual_SGD,
              product.kategori,
              product.barcode
            );
          }
        });

        insertMany(sampleProducts);
        console.log(`Added ${sampleProducts.length} sample products to database`);
      }
    } catch (error) {
      console.error('Error seeding sample data:', error);
    }
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

  // PRODUCT MANAGEMENT
  async getProducts(q?: string, barcode?: string): Promise<Product[]> {
    try {
      let query = 'SELECT sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode FROM products';
      const params: any[] = [];

      if (barcode) {
        query += ' WHERE barcode = ?';
        params.push(barcode);
      } else if (q) {
        query += ' WHERE (sku LIKE ? OR nama LIKE ? OR kategori LIKE ?)';
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY sku';

      const stmt = this.db.prepare(query);
      const products = stmt.all(...params) as Product[];
      
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

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO products 
        (sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(
        product.sku,
        product.nama,
        product.default_modal_satuan_IDR || null,
        product.default_harga_jual_SGD || null,
        product.kategori || '',
        product.barcode || ''
      );

      const action = result.changes > 0 ? 'saved' : 'updated';
      
      return { 
        success: true, 
        message: `Produk ${action}`, 
        data: { sku: product.sku, action } 
      };
    } catch (error) {
      console.error('Error upserting product:', error);
      return { success: false, error: 'Gagal menyimpan produk' };
    }
  }

  async deleteProduct(sku: string): Promise<ApiResponse> {
    try {
      if (!sku) {
        return { success: false, error: 'SKU wajib diisi' };
      }

      // Check if product exists
      const checkStmt = this.db.prepare('SELECT sku FROM products WHERE sku = ?');
      const existing = checkStmt.get(sku);
      
      if (!existing) {
        return { success: false, error: 'Produk tidak ditemukan' };
      }

      // Check if product is used in transactions
      const transactionStmt = this.db.prepare('SELECT COUNT(*) as count FROM transactions WHERE sku = ?');
      const transactionCount = transactionStmt.get(sku) as { count: number };
      
      if (transactionCount.count > 0) {
        return { 
          success: false, 
          error: `Produk tidak dapat dihapus karena sudah digunakan dalam ${transactionCount.count} transaksi` 
        };
      }

      // Delete the product
      const deleteStmt = this.db.prepare('DELETE FROM products WHERE sku = ?');
      const result = deleteStmt.run(sku);

      if (result.changes > 0) {
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

  async bulkImportProducts(csvText: string): Promise<ApiResponse> {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, error: 'CSV harus memiliki header dan minimal 1 baris data' };
      }

      const headers = lines[0].split(',').map(h => h.trim());
      let imported = 0;
      const errors: string[] = [];

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO products 
        (sku, nama, default_modal_satuan_IDR, default_harga_jual_SGD, kategori, barcode, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      // Use transaction for bulk insert
      const insertMany = this.db.transaction((rows: any[]) => {
        for (const row of rows) {
          stmt.run(row.sku, row.nama, row.modal, row.harga, row.kategori, row.barcode);
        }
      });

      const rowsToInsert = [];

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

        const productRow = {
          sku: row.sku,
          nama: row.nama,
          modal: row.default_modal_satuan_IDR ? parseInt(row.default_modal_satuan_IDR) : null,
          harga: row.default_harga_jual_SGD ? parseFloat(row.default_harga_jual_SGD) : null,
          kategori: row.kategori || '',
          barcode: row.barcode || ''
        };

        rowsToInsert.push(productRow);
        imported++;
      }

      if (rowsToInsert.length > 0) {
        insertMany(rowsToInsert);
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

      // Check if product exists, create if it doesn't
      const checkProductStmt = this.db.prepare('SELECT sku FROM products WHERE sku = ?');
      const existingProduct = checkProductStmt.get(transaction.sku);
      
      if (!existingProduct) {
        // Create a basic product entry for this SKU
        const insertProductStmt = this.db.prepare(`
          INSERT OR IGNORE INTO products (sku, nama, created_at, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        insertProductStmt.run(transaction.sku, transaction.sku); // Use SKU as name if not provided
      }

      if (!transaction.qty || transaction.qty <= 0) {
        return { success: false, error: 'Qty harus > 0', data: { status: 'invalid' } };
      }

      if (!transaction.harga_jual_SGD || transaction.harga_jual_SGD <= 0) {
        return { success: false, error: 'Harga jual SGD wajib diisi dan > 0' };
      }

      // Modal is optional - if not provided, transaction will be marked as incomplete
      // if (!transaction.modal_satuan_IDR && !transaction.modal_total_IDR) {
      //   return { success: false, error: 'Modal satuan IDR atau modal total IDR wajib diisi', data: { status: 'incomplete' } };
      // }

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

      // Insert transaction
      const stmt = this.db.prepare(`
        INSERT INTO transactions (
          tanggal, sku, qty, modal_satuan_IDR, modal_total_IDR,
          harga_jual_SGD, pendapatan_SGD, fee_rate, fee_flat_SGD,
          biaya_transaksi_SGD, biaya_lain_SGD, apply_gst, gst_rate,
          GST_SGD, pelanggan, metode_bayar, catatan, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        transaction.tanggal,
        transaction.sku,
        transaction.qty,
        modalSatuanIDR,
        modalTotalIDR,
        this.roundSGD(transaction.harga_jual_SGD),
        pendapatanSGD,
        transaction.fee_rate || 0,
        feeFlatSGD,
        biayaTransaksiSGD,
        this.roundSGD(transaction.biaya_lain_SGD || 0),
        applyGST,
        gstRate,
        gstSGD,
        transaction.pelanggan || '',
        transaction.metode_bayar || '',
        (transaction.catatan || '').replace(/\n/g, ' ').trim(),
        status
      );

      const ym = transaction.tanggal.substring(0, 7); // YYYY-MM

      return { 
        success: true, 
        message: 'Transaksi berhasil disimpan',
        data: { ym, status, id: result.lastInsertRowid }
      };

    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error: 'Gagal menyimpan transaksi' };
    }
  }

  async getTransactions(ym: string, limit?: number): Promise<Transaction[]> {
    try {
      let query = `
        SELECT * FROM transactions 
        WHERE substr(tanggal, 1, 7) = ?
        ORDER BY tanggal DESC, id DESC
      `;
      
      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const stmt = this.db.prepare(query);
      const transactions = stmt.all(ym) as Transaction[];
      
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // REPORTING
  async generateMonthlyReport(ym: string): Promise<ApiResponse<{ report: MonthlyReport, summary: string }>> {
    try {
      const transactions = await this.getTransactions(ym);
      
      if (transactions.length === 0) {
        return { success: false, error: `Tidak ada transaksi untuk ${ym}` };
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

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

// Export singleton instance
export const database = new DatabaseService();