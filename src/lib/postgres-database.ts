import { sql } from '@vercel/postgres';
import { Product, Transaction, MonthlyReport, ApiResponse } from '@/types';

export class PostgresDatabaseService {
  private initialized = false;

  constructor() {
    console.log('🐘 PostgreSQL service constructor called');
    console.log('🔍 Environment check:', {
      POSTGRES_URL: process.env.POSTGRES_URL ? 'present' : 'missing',
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'present' : 'missing',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? 'present' : 'missing'
    });
    
    // Check if we have a connection string
    if (!process.env.POSTGRES_URL && !process.env.POSTGRES_PRISMA_URL) {
      const error = new Error('No PostgreSQL connection string found. Please set POSTGRES_URL or POSTGRES_PRISMA_URL environment variable.');
      console.error('❌ PostgreSQL connection string missing:', error.message);
      throw error;
    }
    
    try {
      // Test the connection by importing the sql function
      console.log('🔍 Testing @vercel/postgres import...');
      const { sql } = require('@vercel/postgres');
      console.log('✅ @vercel/postgres imported successfully');
      console.log('🐘 PostgreSQL database service created');
    } catch (error) {
      console.error('❌ Failed to import @vercel/postgres:', error);
      throw new Error(`Failed to initialize PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDatabase();
      this.initialized = true;
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🐘 Initializing PostgreSQL database...');
      
      // Create products table
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          sku VARCHAR(50) PRIMARY KEY,
          nama VARCHAR(255) NOT NULL,
          default_modal_satuan_idr INTEGER,
          default_harga_jual_sgd DECIMAL(10,2),
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

      // Create inventory table
      await sql`
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(50) NOT NULL,
          store_location VARCHAR(255) NOT NULL,
          current_stock INTEGER DEFAULT 0,
          last_counted_date DATE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sku) REFERENCES products (sku),
          UNIQUE(sku, store_location)
        )
      `;

      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions(tanggal)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_transactions_sku ON transactions(sku)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(store_location)`;
      // Remove the problematic DATE_TRUNC index - we'll use a simpler approach

      await this.seedSampleData();
      console.log('✅ PostgreSQL database initialized successfully');
      this.initialized = true;
      
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
        INSERT INTO products (sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori) VALUES
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
      await this.ensureInitialized();
      console.log('🔍 Getting products with query:', q, 'barcode:', barcode);
      let query;
      
      if (barcode) {
        query = sql`SELECT sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode FROM products WHERE barcode = ${barcode}`;
      } else if (q) {
        const searchTerm = `%${q}%`;
        query = sql`SELECT sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode FROM products WHERE LOWER(nama) LIKE LOWER(${searchTerm}) OR LOWER(sku) LIKE LOWER(${searchTerm}) ORDER BY nama`;
      } else {
        query = sql`SELECT sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode FROM products ORDER BY nama`;
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
        INSERT INTO products (sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode, updated_at)
        VALUES (${product.sku}, ${product.nama}, ${product.default_modal_satuan_idr || null}, ${product.default_harga_jual_sgd || null}, ${product.kategori || ''}, ${product.barcode || ''}, CURRENT_TIMESTAMP)
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
            default_modal_satuan_idr = ${product.default_modal_satuan_idr || null},
            default_harga_jual_sgd = ${product.default_harga_jual_sgd || null},
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
      console.log('🔍 Upserting product:', JSON.stringify(product, null, 2));
      
      if (!product.sku || !product.nama) {
        return { success: false, error: 'SKU dan nama wajib diisi' };
      }

      await sql`
        INSERT INTO products (sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode, updated_at)
        VALUES (${product.sku}, ${product.nama}, ${product.default_modal_satuan_idr || null}, ${product.default_harga_jual_sgd || null}, ${product.kategori || ''}, ${product.barcode || ''}, CURRENT_TIMESTAMP)
        ON CONFLICT (sku) DO UPDATE SET
          nama = EXCLUDED.nama,
          default_modal_satuan_idr = EXCLUDED.default_modal_satuan_idr,
          default_harga_jual_sgd = EXCLUDED.default_harga_jual_sgd,
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
            INSERT INTO products (sku, nama, default_modal_satuan_idr, default_harga_jual_sgd, kategori, barcode, updated_at)
            VALUES (${row.sku}, ${row.nama}, ${parseInt(row.modal) || null}, ${parseFloat(row.harga) || null}, ${row.kategori || ''}, ${row.barcode || ''}, CURRENT_TIMESTAMP)
            ON CONFLICT (sku) DO UPDATE SET
              nama = EXCLUDED.nama,
              default_modal_satuan_idr = EXCLUDED.default_modal_satuan_idr,
              default_harga_jual_sgd = EXCLUDED.default_harga_jual_sgd,
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
      await this.ensureInitialized();
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

      if (!transaction.harga_jual_sgd || transaction.harga_jual_sgd <= 0) {
        console.error('❌ Invalid price:', transaction.harga_jual_sgd);
        return { success: false, error: 'Harga jual SGD wajib diisi dan > 0' };
      }

      console.log('✅ Basic validation passed');

      // Calculate derived fields
      let status: 'complete' | 'incomplete' | 'invalid' = 'complete';
      
      // Calculate modal_total_idr if not provided
      let modalTotalIDR = transaction.modal_total_idr;
      if (!modalTotalIDR && transaction.modal_satuan_idr) {
        modalTotalIDR = this.roundIDR(transaction.qty * transaction.modal_satuan_idr);
      } else if (modalTotalIDR) {
        modalTotalIDR = this.roundIDR(modalTotalIDR);
      }

      const modalSatuanIDR = transaction.modal_satuan_idr ? this.roundIDR(transaction.modal_satuan_idr) : null;

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

      console.log('💾 Executing database insert...');

      const result = await sql`
        INSERT INTO transactions (
          tanggal, sku, qty, modal_satuan_IDR, modal_total_IDR,
          harga_jual_SGD, pendapatan_SGD, fee_rate, fee_flat_SGD,
          biaya_transaksi_SGD, biaya_lain_SGD, apply_gst, gst_rate,
          GST_SGD, pelanggan, metode_bayar, catatan, status
        ) VALUES (
          ${transaction.tanggal}, ${transaction.sku}, ${transaction.qty}, 
          ${modalSatuanIDR}, ${modalTotalIDR}, ${this.roundSGD(transaction.harga_jual_sgd)}, 
          ${pendapatanSGD}, ${transaction.fee_rate || 0}, ${feeFlatSGD || 0},
          ${biayaTransaksiSGD || 0}, ${this.roundSGD(transaction.biaya_lain_sgd || 0)}, 
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

  async getTransactionById(id: number): Promise<Transaction | null> {
    try {
      const query = sql`SELECT * FROM transactions WHERE id = ${id}`;
      const result = await query;
      
      return result.rows.length > 0 ? result.rows[0] as Transaction : null;
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
      let modal_total_idr = existing.modal_total_idr;

      if (transaction.qty !== undefined || transaction.harga_jual_sgd !== undefined) {
        const qty = transaction.qty ?? existing.qty;
        const price = transaction.harga_jual_sgd ?? existing.harga_jual_sgd;
        pendapatan_sgd = this.roundSGD(qty * price);
      }

      if (transaction.qty !== undefined || transaction.modal_satuan_idr !== undefined) {
        const qty = transaction.qty ?? existing.qty;
        const modalSatuan = transaction.modal_satuan_idr ?? existing.modal_satuan_idr;
        if (modalSatuan) {
          modal_total_idr = this.roundIDR(qty * modalSatuan);
        }
      }

      // Simple update approach - update all provided fields
      await sql`
        UPDATE transactions 
        SET 
          tanggal = ${transaction.tanggal ?? existing.tanggal},
          sku = ${transaction.sku ?? existing.sku},
          qty = ${transaction.qty ?? existing.qty},
          modal_satuan_idr = ${transaction.modal_satuan_idr ?? existing.modal_satuan_idr},
          modal_total_idr = ${modal_total_idr ?? existing.modal_total_idr},
          harga_jual_sgd = ${transaction.harga_jual_sgd ?? existing.harga_jual_sgd},
          pendapatan_sgd = ${pendapatan_sgd ?? existing.pendapatan_sgd},
          pelanggan = ${transaction.pelanggan ?? existing.pelanggan},
          metode_bayar = ${transaction.metode_bayar ?? existing.metode_bayar},
          catatan = ${transaction.catatan ?? existing.catatan}
        WHERE id = ${id}
      `;

      return { 
        success: true, 
        message: 'Transaction updated successfully',
        data: { id, updated: true }
      };

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

      const query = sql`DELETE FROM transactions WHERE id = ${id}`;
      await query;

      return { 
        success: true, 
        message: 'Transaction deleted successfully',
        data: { id, deleted: true }
      };

    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error: 'Failed to delete transaction' };
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
        totalPendapatanSGD += tx.pendapatan_sgd || 0;
        totalModalIDR += tx.modal_total_idr || 0;
        totalBiayaTransaksiSGD += tx.biaya_transaksi_sgd || 0;
        totalBiayaLainSGD += tx.biaya_lain_sgd || 0;
        totalGSTSGD += tx.gst_sgd || 0;

        if (!productSummary[tx.sku]) {
          productSummary[tx.sku] = { qty: 0, pendapatan: 0, modal: 0 };
        }
        productSummary[tx.sku].qty += tx.qty;
        productSummary[tx.sku].pendapatan += tx.pendapatan_sgd || 0;
        productSummary[tx.sku].modal += tx.modal_total_idr || 0;
      });

      // Find top SKU by revenue
      const topSku = Object.entries(productSummary)
        .sort(([,a], [,b]) => b.pendapatan - a.pendapatan)[0];

      const report: MonthlyReport = {
        periode: ym,
        total_modal_idr: this.roundIDR(totalModalIDR),
        total_penjualan_sgd: this.roundSGD(totalPendapatanSGD),
        total_biaya_transaksi_sgd: this.roundSGD(totalBiayaTransaksiSGD),
        total_biaya_lain_sgd: this.roundSGD(totalBiayaLainSGD),
        total_gst_sgd: this.roundSGD(totalGSTSGD),
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

  // INVENTORY MANAGEMENT
  async getInventory(): Promise<any[]> {
    try {
      await this.ensureInitialized();
      const result = await sql`
        SELECT i.*, p.nama as product_name 
        FROM inventory i 
        LEFT JOIN products p ON i.sku = p.sku 
        ORDER BY i.store_location, p.nama
      `;
      return result.rows;
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async updateInventory(sku: string, storeLocation: string, currentStock: number, notes?: string): Promise<ApiResponse> {
    try {
      await this.ensureInitialized();
      
      // Check if product exists
      const product = await sql`SELECT sku FROM products WHERE sku = ${sku}`;
      if (product.rows.length === 0) {
        return { success: false, error: 'Produk tidak ditemukan' };
      }

      // Upsert inventory record
      await sql`
        INSERT INTO inventory (sku, store_location, current_stock, last_counted_date, notes, updated_at)
        VALUES (${sku}, ${storeLocation}, ${currentStock}, CURRENT_DATE, ${notes || ''}, CURRENT_TIMESTAMP)
        ON CONFLICT (sku, store_location) 
        DO UPDATE SET
          current_stock = EXCLUDED.current_stock,
          last_counted_date = EXCLUDED.last_counted_date,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at
      `;

      return { 
        success: true, 
        message: 'Inventory updated successfully',
        data: { sku, store_location: storeLocation, current_stock: currentStock }
      };
    } catch (error) {
      console.error('Error updating inventory:', error);
      return { success: false, error: 'Failed to update inventory' };
    }
  }

  async getInventoryByLocation(storeLocation: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      const result = await sql`
        SELECT i.*, p.nama as product_name 
        FROM inventory i 
        LEFT JOIN products p ON i.sku = p.sku 
        WHERE i.store_location = ${storeLocation}
        ORDER BY p.nama
      `;
      return result.rows;
    } catch (error) {
      console.error('Error getting inventory by location:', error);
      return [];
    }
  }

  async getTransactionsByCustomer(customer: string): Promise<Transaction[]> {
    try {
      await this.ensureInitialized();
      const result = await sql`
        SELECT t.*, p.nama as product_name
        FROM transactions t
        LEFT JOIN products p ON t.sku = p.sku
        WHERE LOWER(t.pelanggan) = LOWER(${customer})
        ORDER BY t.tanggal DESC, t.id DESC
      `;
      return result.rows as Transaction[];
    } catch (error) {
      console.error('Error getting transactions by customer:', error);
      return [];
    }
  }
}

// Create singleton instance
export const postgresDatabase = new PostgresDatabaseService();