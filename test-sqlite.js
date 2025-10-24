const { DatabaseService } = require('./src/lib/database.ts');

async function testDatabase() {
  console.log('Testing SQLite database...');
  
  try {
    const db = new DatabaseService();
    
    // Test getting products
    const products = await db.getProducts();
    console.log(`Found ${products.length} products in database`);
    
    if (products.length > 0) {
      console.log('Sample product:', products[0]);
    }
    
    // Test adding a transaction
    const testTransaction = {
      tanggal: '2025-01-15',
      sku: products[0]?.sku || 'KOPI-ARABICA-250G',
      qty: 2,
      modal_satuan_IDR: 45000,
      harga_jual_SGD: 7.9,
      fee_rate: 2.9,
      fee_flat_SGD: 0.5,
      pelanggan: 'Test Customer',
      metode_bayar: 'Tunai'
    };
    
    const result = await db.addTransaction(testTransaction);
    console.log('Transaction result:', result);
    
    // Test getting transactions
    const transactions = await db.getTransactions('2025-01');
    console.log(`Found ${transactions.length} transactions for 2025-01`);
    
    // Test generating report
    if (transactions.length > 0) {
      const report = await db.generateMonthlyReport('2025-01');
      console.log('Report generated:', report.success);
    }
    
    db.close();
    console.log('Database test completed successfully!');
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();