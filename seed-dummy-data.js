const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const dbPath = path.join(dataDir, 'bookkeeper.db');
const db = new Database(dbPath);

console.log('🌱 Seeding dummy transaction data...');

// Sample transactions for all 5 products across 6 months
const sampleTransactions = [
  // October 2024 transactions
  { tanggal: '2024-10-01', sku: 'KOPI-ARABICA-250G', qty: 2, modal_satuan_IDR: 45000, harga_jual_SGD: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
  { tanggal: '2024-10-02', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_IDR: 33000, harga_jual_SGD: 8.5, pelanggan: 'Sarah Lim', metode_bayar: 'Kartu' },
  { tanggal: '2024-10-03', sku: 'COKLAT-DARK-200G', qty: 3, modal_satuan_IDR: 28000, harga_jual_SGD: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
  { tanggal: '2024-10-04', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_IDR: 38000, harga_jual_SGD: 7.2, pelanggan: 'John Tan', metode_bayar: 'E-Wallet' },
  { tanggal: '2024-10-05', sku: 'TEH-EARL-GREY-100G', qty: 2, modal_satuan_IDR: 25000, harga_jual_SGD: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
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

function roundSGD(value) {
  return Math.round(value * 100) / 100;
}

function roundIDR(value) {
  return Math.round(value);
}

try {
  // Clear existing transactions
  console.log('🗑️  Clearing existing transactions...');
  db.prepare('DELETE FROM transactions').run();
  
  // Prepare insert statement
  const stmt = db.prepare(`
    INSERT INTO transactions (
      tanggal, sku, qty, modal_satuan_IDR, modal_total_IDR,
      harga_jual_SGD, pendapatan_SGD, fee_rate, fee_flat_SGD,
      biaya_transaksi_SGD, biaya_lain_SGD, apply_gst, gst_rate,
      GST_SGD, pelanggan, metode_bayar, catatan, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert transactions in a transaction
  const insertMany = db.transaction((transactions) => {
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
        roundSGD(pendapatan),
        2.9,
        0.5,
        roundSGD(biayaTransaksi),
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
  
  console.log(`✅ Successfully added ${sampleTransactions.length} sample transactions!`);
  console.log('📊 Data includes:');
  console.log('   - All 5 products (Kopi Arabica, Teh Matcha, Coklat Dark, Kopi Robusta, Teh Earl Grey)');
  console.log('   - 6 months of data (May - October 2024)');
  console.log('   - Various customers and payment methods');
  console.log('   - Realistic pricing and quantities');
  
  // Show summary
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      SUM(pendapatan_SGD) as total_revenue_sgd,
      SUM(modal_total_IDR) as total_modal_idr
    FROM transactions
  `).get();
  
  console.log('\n📈 Summary:');
  console.log(`   - Total Transactions: ${summary.total_transactions}`);
  console.log(`   - Total Revenue: SGD ${summary.total_revenue_sgd.toFixed(2)}`);
  console.log(`   - Total Modal: IDR ${summary.total_modal_idr.toLocaleString('id-ID')}`);
  
} catch (error) {
  console.error('❌ Error seeding data:', error);
} finally {
  db.close();
  console.log('\n🎉 Dummy data seeding completed!');
  console.log('You can now test all functions in your Peti Cash application.');
}