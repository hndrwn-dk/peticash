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
    
    // Warning about ephemeral storage
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  WARNING: Using ephemeral storage (/tmp) on Vercel. Data will be lost on deployment/restart.');
      console.warn('💡 For production, consider using Vercel Postgres, PlanetScale, or another persistent database.');
    }
    
    try {
      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      this.db = new Database(this.dbPath);
      this.initializeDatabase();
      this.seedSampleData();
      
      console.log(`📁 Database initialized at: ${this.dbPath}`);
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
        default_modal_satuan_idr INTEGER,
        default_harga_jual_sgd REAL,
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

    // Create inventory table for stock opname
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT NOT NULL,
        store_location TEXT NOT NULL,
        current_stock INTEGER DEFAULT 0,
        last_counted_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sku) REFERENCES products (sku)
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
      CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory (sku);
      CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory (store_location);
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
            default_modal_satuan_idr: 45000,
            default_harga_jual_sgd: 7.9,
            kategori: 'Kopi',
            barcode: '8991234567890'
          },
          {
            sku: 'TEH-MATCHA-100G',
            nama: 'Teh Matcha 100g',
            default_modal_satuan_idr: 33000,
            default_harga_jual_sgd: 8.5,
            kategori: 'Teh',
            barcode: '8991234567891'
          },
          {
            sku: 'COKLAT-DARK-200G',
            nama: 'Coklat Dark 200g',
            default_modal_satuan_idr: 28000,
            default_harga_jual_sgd: 6.5,
            kategori: 'Coklat',
            barcode: '8991234567892'
          },
          {
            sku: 'KOPI-ROBUSTA-250G',
            nama: 'Kopi Robusta 250g',
            default_modal_satuan_idr: 38000,
            default_harga_jual_sgd: 7.2,
            kategori: 'Kopi',
            barcode: '8991234567893'
          },
          {
            sku: 'TEH-EARL-GREY-100G',
            nama: 'Teh Earl Grey 100g',
            default_modal_satuan_idr: 25000,
            default_harga_jual_sgd: 5.9,
            kategori: 'Teh',
            barcode: '8991234567894'
          }
        ];

        const stmt = this.db.prepare(`
          INSERT INTO products 
          (sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertMany = this.db.transaction((products: any[]) => {
          for (const product of products) {
            stmt.run(
              product.sku,
              product.nama,
              product.default_modal_satuan_idr,
              product.default_harga_jual_sgd,
              product.kategori,
              product.barcode
            );
          }
        });

        insertMany(sampleProducts);
        console.log(`Added ${sampleProducts.length} sample products to database`);
        
        // Also add sample transactions
        this.seedSampleTransactions();
      }
    } catch (error) {
      console.error('Error seeding sample data:', error);
    }
  }

  private seedSampleTransactions(): void {
    try {
      // Check if transactions already exist
      const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM transactions');
      const result = countStmt.get() as { count: number };
      
      if (result.count === 0) {
        const sampleTransactions = [
          // October 2024 transactions
          { tanggal: '2024-10-01', sku: 'KOPI-ARABICA-250G', qty: 2, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-10-02', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Sarah Lim', metode_bayar: 'Kartu' },
          { tanggal: '2024-10-03', sku: 'COKLAT-DARK-200G', qty: 3, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-10-04', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'John Tan', metode_bayar: 'E-Wallet' },
          { tanggal: '2024-10-05', sku: 'TEH-EARL-GREY-100G', qty: 2, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          
          // More October transactions
          { tanggal: '2024-10-08', sku: 'KOPI-ARABICA-250G', qty: 1, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Maria Santos', metode_bayar: 'Transfer' },
          { tanggal: '2024-10-09', sku: 'TEH-MATCHA-100G', qty: 2, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-10-10', sku: 'COKLAT-DARK-200G', qty: 1, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'David Wong', metode_bayar: 'Kartu' },
          { tanggal: '2024-10-12', sku: 'KOPI-ROBUSTA-250G', qty: 3, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-10-15', sku: 'TEH-EARL-GREY-100G', qty: 1, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Lisa Chen', metode_bayar: 'E-Wallet' },
          
          // September 2024 transactions
          { tanggal: '2024-09-05', sku: 'KOPI-ARABICA-250G', qty: 2, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-09-10', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Amy Loh', metode_bayar: 'Kartu' },
          { tanggal: '2024-09-15', sku: 'COKLAT-DARK-200G', qty: 2, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-09-20', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'Robert Kim', metode_bayar: 'Transfer' },
          { tanggal: '2024-09-25', sku: 'TEH-EARL-GREY-100G', qty: 3, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          
          // August 2024 transactions
          { tanggal: '2024-08-02', sku: 'KOPI-ARABICA-250G', qty: 1, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-08-08', sku: 'TEH-MATCHA-100G', qty: 2, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Grace Ng', metode_bayar: 'E-Wallet' },
          { tanggal: '2024-08-14', sku: 'COKLAT-DARK-200G', qty: 1, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-08-20', sku: 'KOPI-ROBUSTA-250G', qty: 2, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'Michael Lee', metode_bayar: 'Kartu' },
          { tanggal: '2024-08-26', sku: 'TEH-EARL-GREY-100G', qty: 1, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          
          // July 2024 transactions
          { tanggal: '2024-07-03', sku: 'KOPI-ARABICA-250G', qty: 3, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-07-12', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Jessica Teo', metode_bayar: 'Transfer' },
          { tanggal: '2024-07-18', sku: 'COKLAT-DARK-200G', qty: 2, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-07-22', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'Daniel Koh', metode_bayar: 'E-Wallet' },
          { tanggal: '2024-07-28', sku: 'TEH-EARL-GREY-100G', qty: 2, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          
          // June 2024 transactions
          { tanggal: '2024-06-05', sku: 'KOPI-ARABICA-250G', qty: 1, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-06-11', sku: 'TEH-MATCHA-100G', qty: 3, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Rachel Sim', metode_bayar: 'Kartu' },
          { tanggal: '2024-06-17', sku: 'COKLAT-DARK-200G', qty: 1, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-06-23', sku: 'KOPI-ROBUSTA-250G', qty: 2, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'Kevin Ong', metode_bayar: 'Transfer' },
          { tanggal: '2024-06-29', sku: 'TEH-EARL-GREY-100G', qty: 1, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          
          // May 2024 transactions
          { tanggal: '2024-05-07', sku: 'KOPI-ARABICA-250G', qty: 2, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-05-13', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Helen Yap', metode_bayar: 'E-Wallet' },
          { tanggal: '2024-05-19', sku: 'COKLAT-DARK-200G', qty: 3, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
          { tanggal: '2024-05-25', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'Steven Lim', metode_bayar: 'Kartu' },
          { tanggal: '2024-05-30', sku: 'TEH-EARL-GREY-100G', qty: 2, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' }
        ];

        const stmt = this.db.prepare(`
          INSERT INTO transactions (
            tanggal, sku, qty, modal_satuan_IDR, modal_total_IDR,
            harga_jual_SGD, pendapatan_SGD, fee_rate, fee_flat_SGD,
            biaya_transaksi_SGD, biaya_lain_SGD, apply_gst, gst_rate,
            GST_SGD, pelanggan, metode_bayar, catatan, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = this.db.transaction((transactions: any[]) => {
          for (const tx of transactions) {
            const modalTotal = tx.modal_satuan_IDR * tx.qty;
            const pendapatan = tx.harga_jual_SGD * tx.qty;
            const biayaTransaksi = pendapatan * 0.029 + 0.5; // 2.9% + $0.5
            
            stmt.run(
              tx.tanggal,
              tx.sku,
              tx.qty,
              tx.modal_satuan_IDR,
              modalTotal,
              tx.harga_jual_SGD,
              this.roundSGD(pendapatan),
              2.9,
              0.5,
              this.roundSGD(biayaTransaksi),
              0,
              false,
              0.09,
              0,
              tx.pelanggan,
              tx.metode_bayar,
              '',
              'complete'
            );
          }
        });

        insertMany(sampleTransactions);
        console.log(`Added ${sampleTransactions.length} sample transactions to database`);
      }
    } catch (error) {
      console.error('Error seeding sample transactions:', error);
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
      console.log('🔍 SQLite: Getting products with query:', q, 'barcode:', barcode);
      let query = 'SELECT sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode FROM products';
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
        (sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(
        product.sku,
        product.nama,
        product.default_modal_satuan_idr || null,
        product.default_harga_jual_sgd || null,
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
        (sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode, updated_at)
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
          modal: row.default_modal_satuan_idr ? parseInt(row.default_modal_satuan_idr) : null,
          harga: row.default_harga_jual_sgd ? parseFloat(row.default_harga_jual_sgd) : null,
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

      // Check if product exists and get default cost
      const checkProductStmt = this.db.prepare('SELECT sku, default_modal_satuan_idr FROM products WHERE sku = ?');
      const existingProduct = checkProductStmt.get(transaction.sku) as { sku: string, default_modal_satuan_idr?: number } | undefined;
      
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

      if (!transaction.harga_jual_sgd || transaction.harga_jual_sgd <= 0) {
        return { success: false, error: 'Harga jual SGD wajib diisi dan > 0' };
      }

      // Modal is optional - if not provided, transaction will be marked as incomplete
      // if (!transaction.modal_satuan_idr && !transaction.modal_total_idr) {
      //   return { success: false, error: 'Modal satuan IDR atau modal total IDR wajib diisi', data: { status: 'incomplete' } };
      // }

      // Calculate derived fields
      let status: 'complete' | 'incomplete' | 'invalid' = 'complete';
      
      // Calculate modal_total_idr if not provided
      let modalTotalIDR = transaction.modal_total_IDR;
      let modalSatuanIDR = transaction.modal_satuan_IDR;
      
      // If no modal_satuan_idr provided, try to use product's default cost
      if (!modalSatuanIDR && existingProduct?.default_modal_satuan_idr) {
        modalSatuanIDR = existingProduct.default_modal_satuan_idr;
        console.log('🔍 Using product default cost:', modalSatuanIDR);
      } else if (!modalSatuanIDR) {
        console.log('⚠️ No modal_satuan_idr provided and no product default cost found for SKU:', transaction.sku);
      }
      
      // Calculate modal_total_idr
      if (!modalTotalIDR && modalSatuanIDR) {
        modalTotalIDR = this.roundIDR(transaction.qty * modalSatuanIDR);
      } else if (modalTotalIDR) {
        modalTotalIDR = this.roundIDR(modalTotalIDR);
      }

      const finalModalSatuanIDR = modalSatuanIDR ? this.roundIDR(modalSatuanIDR) : null;

      // Calculate pendapatan_sgd
      const pendapatanSGD = this.roundSGD(transaction.qty * transaction.harga_jual_sgd);

      // Calculate biaya_transaksi_SGD
      const feeRate = (transaction.fee_rate || 0) / 100;
      const feeFlatSGD = transaction.fee_flat_sgd || 0;
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

      console.log('💾 Executing database insert...');
      console.log('Insert values:', {
        tanggal: transaction.tanggal,
        sku: transaction.sku,
        qty: transaction.qty,
        modalSatuanIDR,
        modalTotalIDR,
        harga_jual_sgd: this.roundSGD(transaction.harga_jual_sgd),
        pendapatanSGD,
        fee_rate: transaction.fee_rate || 0,
        feeFlatSGD,
        biayaTransaksiSGD,
        biaya_lain_sgd: this.roundSGD(transaction.biaya_lain_sgd || 0),
        applyGST,
        gstRate,
        gstSGD,
        pelanggan: transaction.pelanggan || '',
        metode_bayar: transaction.metode_bayar || '',
        catatan: (transaction.catatan || '').replace(/\n/g, ' ').trim(),
        status
      });

      const result = stmt.run(
        transaction.tanggal,
        transaction.sku,
        transaction.qty,
        finalModalSatuanIDR || null,
        modalTotalIDR || null,
        this.roundSGD(transaction.harga_jual_sgd),
        pendapatanSGD,
        transaction.fee_rate || 0,
        feeFlatSGD || 0,
        biayaTransaksiSGD || 0,
        this.roundSGD(transaction.biaya_lain_sgd || 0),
        applyGST ? 1 : 0,
        gstRate || 0,
        gstSGD || 0,
        transaction.pelanggan || '',
        transaction.metode_bayar || '',
        (transaction.catatan || '').replace(/\n/g, ' ').trim(),
        status
      );

      console.log('✅ Transaction inserted successfully, ID:', result.lastInsertRowid);

      const ym = transaction.tanggal.substring(0, 7); // YYYY-MM

      return { 
        success: true, 
        message: 'Transaksi berhasil disimpan',
        data: { ym, status, id: result.lastInsertRowid }
      };

    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      console.error('Transaction data was:', JSON.stringify(transaction, null, 2));
      return { success: false, error: `Gagal menyimpan transaksi: ${error instanceof Error ? error.message : String(error)}` };
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

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const query = `
        SELECT * FROM transactions 
        ORDER BY tanggal DESC, id DESC
      `;
      
      const stmt = this.db.prepare(query);
      const transactions = stmt.all() as Transaction[];
      
      return transactions;
    } catch (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }
  }

  async getTransactionById(id: number): Promise<Transaction | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
      const transaction = stmt.get(id) as Transaction | undefined;
      
      return transaction || null;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return null;
    }
  }

  async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<ApiResponse> {
    try {
      // Check if transaction exists
      const existing = await this.getTransactionById(id);
      if (!existing) {
        return { success: false, error: 'Transaction not found' };
      }

      // Validate required fields
      if (transaction.qty !== undefined && transaction.qty <= 0) {
        return { success: false, error: 'Qty harus > 0' };
      }

      if (transaction.harga_jual_sgd !== undefined && transaction.harga_jual_sgd <= 0) {
        return { success: false, error: 'Harga jual SGD wajib diisi dan > 0' };
      }

      // Calculate derived fields if price or quantity changed
      let pendapatan_sgd = existing.pendapatan_sgd;
      let modal_total_idr = existing.modal_total_IDR;

      if (transaction.qty !== undefined || transaction.harga_jual_sgd !== undefined) {
        const qty = transaction.qty ?? existing.qty;
        const price = transaction.harga_jual_sgd ?? existing.harga_jual_sgd;
        pendapatan_sgd = this.roundSGD(qty * price);
      }

      if (transaction.qty !== undefined || transaction.modal_satuan_IDR !== undefined) {
        const qty = transaction.qty ?? existing.qty;
        const modalSatuan = transaction.modal_satuan_IDR ?? existing.modal_satuan_IDR;
        if (modalSatuan) {
          modal_total_idr = this.roundIDR(qty * modalSatuan);
        }
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const values: any[] = [];

      if (transaction.tanggal !== undefined) {
        updateFields.push('tanggal = ?');
        values.push(transaction.tanggal);
      }
      if (transaction.sku !== undefined) {
        updateFields.push('sku = ?');
        values.push(transaction.sku);
      }
      if (transaction.qty !== undefined) {
        updateFields.push('qty = ?');
        values.push(transaction.qty);
      }
      if (transaction.modal_satuan_IDR !== undefined) {
        updateFields.push('modal_satuan_IDR = ?');
        values.push(transaction.modal_satuan_IDR);
      }
      if (modal_total_idr !== existing.modal_total_IDR) {
        updateFields.push('modal_total_IDR = ?');
        values.push(modal_total_idr);
      }
      if (transaction.harga_jual_sgd !== undefined) {
        updateFields.push('harga_jual_sgd = ?');
        values.push(transaction.harga_jual_sgd);
      }
      if (pendapatan_sgd !== existing.pendapatan_sgd) {
        updateFields.push('pendapatan_sgd = ?');
        values.push(pendapatan_sgd);
      }
      if (transaction.pelanggan !== undefined) {
        updateFields.push('pelanggan = ?');
        values.push(transaction.pelanggan);
      }
      if (transaction.metode_bayar !== undefined) {
        updateFields.push('metode_bayar = ?');
        values.push(transaction.metode_bayar);
      }
      if (transaction.catatan !== undefined) {
        updateFields.push('catatan = ?');
        values.push(transaction.catatan);
      }

      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      const query = `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`;
      values.push(id);

      const stmt = this.db.prepare(query);
      const result = stmt.run(...values);

      if (result.changes > 0) {
        return { 
          success: true, 
          message: 'Transaction updated successfully',
          data: { id, updated: true }
        };
      } else {
        return { success: false, error: 'Failed to update transaction' };
      }

    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, error: 'Failed to update transaction' };
    }
  }

  async deleteTransaction(id: number): Promise<ApiResponse> {
    try {
      // Check if transaction exists
      const existing = await this.getTransactionById(id);
      if (!existing) {
        return { success: false, error: 'Transaction not found' };
      }

      const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes > 0) {
        return { 
          success: true, 
          message: 'Transaction deleted successfully',
          data: { id, deleted: true }
        };
      } else {
        return { success: false, error: 'Failed to delete transaction' };
      }

    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error: 'Failed to delete transaction' };
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
        if (tx.pendapatan_sgd) {
          totalPenjualanSGD += tx.pendapatan_sgd;
          skuRevenue[tx.sku] = (skuRevenue[tx.sku] || 0) + tx.pendapatan_sgd;
        }
        if (tx.biaya_transaksi_sgd) totalBiayaTransaksiSGD += tx.biaya_transaksi_sgd;
        if (tx.biaya_lain_sgd) totalBiayaLainSGD += tx.biaya_lain_sgd;
        if (tx.gst_sgd) totalGSTSGD += tx.gst_sgd;
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
        total_modal_idr: totalModalIDR,
        total_penjualan_sgd: totalPenjualanSGD,
        total_biaya_transaksi_sgd: totalBiayaTransaksiSGD,
        total_biaya_lain_sgd: totalBiayaLainSGD,
        total_gst_sgd: totalGSTSGD,
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

  // INVENTORY MANAGEMENT
  async getInventory(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          i.*,
          p.nama as product_name,
          p.kategori,
          p.default_modal_satuan_idr
        FROM inventory i
        LEFT JOIN products p ON i.sku = p.sku
        ORDER BY i.store_location, p.nama
      `;
      
      const stmt = this.db.prepare(query);
      const inventory = stmt.all() as any[];
      
      return inventory;
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async updateInventory(sku: string, storeLocation: string, currentStock: number, notes?: string): Promise<ApiResponse> {
    try {
      if (!sku || !storeLocation) {
        return { success: false, error: 'SKU dan lokasi toko wajib diisi' };
      }

      // Check if inventory record exists
      const checkStmt = this.db.prepare('SELECT id FROM inventory WHERE sku = ? AND store_location = ?');
      const existing = checkStmt.get(sku, storeLocation);

      if (existing) {
        // Update existing record
        const updateStmt = this.db.prepare(`
          UPDATE inventory 
          SET current_stock = ?, last_counted_date = CURRENT_DATE, notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE sku = ? AND store_location = ?
        `);
        
        const result = updateStmt.run(currentStock, notes || '', sku, storeLocation);
        
        if (result.changes > 0) {
          return { 
            success: true, 
            message: 'Stok berhasil diperbarui',
            data: { sku, store_location: storeLocation, current_stock: currentStock }
          };
        } else {
          return { success: false, error: 'Gagal memperbarui stok' };
        }
      } else {
        // Insert new record
        const insertStmt = this.db.prepare(`
          INSERT INTO inventory (sku, store_location, current_stock, last_counted_date, notes)
          VALUES (?, ?, ?, CURRENT_DATE, ?)
        `);
        
        const result = insertStmt.run(sku, storeLocation, currentStock, notes || '');
        
        if (result.changes > 0) {
          return { 
            success: true, 
            message: 'Stok berhasil ditambahkan',
            data: { sku, store_location: storeLocation, current_stock: currentStock }
          };
        } else {
          return { success: false, error: 'Gagal menambahkan stok' };
        }
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      return { success: false, error: 'Gagal menyimpan stok' };
    }
  }

  async getInventoryByLocation(storeLocation: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          i.*,
          p.nama as product_name,
          p.kategori,
          p.default_modal_satuan_idr
        FROM inventory i
        LEFT JOIN products p ON i.sku = p.sku
        WHERE i.store_location = ?
        ORDER BY p.nama
      `;
      
      const stmt = this.db.prepare(query);
      const inventory = stmt.all(storeLocation) as any[];
      
      return inventory;
    } catch (error) {
      console.error('Error getting inventory by location:', error);
      return [];
    }
  }

  async getTransactionsByCustomer(customer: string): Promise<Transaction[]> {
    try {
      const query = `
        SELECT t.*, p.nama as product_name
        FROM transactions t
        LEFT JOIN products p ON t.sku = p.sku
        WHERE t.pelanggan = ?
        ORDER BY t.tanggal DESC
      `;
      
      const stmt = this.db.prepare(query);
      const transactions = stmt.all(customer) as Transaction[];
      
      return transactions;
    } catch (error) {
      console.error('Error getting transactions by customer:', error);
      return [];
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