import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// GET /api/seed-data - Check current data status
export async function GET(request: NextRequest) {
  try {
    const products = await database.getProducts();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const transactions = await database.getTransactions(currentMonth);
    
    return NextResponse.json({
      success: true,
      data: {
        total_products: products.length,
        current_month_transactions: transactions.length,
        products: products.map(p => ({ sku: p.sku, nama: p.nama })),
        sample_transactions: transactions.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('GET /api/seed-data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check data status' },
      { status: 500 }
    );
  }
}

// POST /api/seed-data - Seed dummy transaction data
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting comprehensive data seeding...');

    // First, add more products
    console.log('📦 Adding additional products...');
    const additionalProducts = [
      { sku: 'BISKUIT-MARIE-200G', nama: 'Biskuit Marie 200g', default_modal_satuan_idr: 15000, default_harga_jual_sgd: 3.5, kategori: 'Snack' },
      { sku: 'KERIPIK-SINGKONG-150G', nama: 'Keripik Singkong 150g', default_modal_satuan_idr: 12000, default_harga_jual_sgd: 2.8, kategori: 'Snack' },
      { sku: 'MINYAK-KELAPA-500ML', nama: 'Minyak Kelapa 500ml', default_modal_satuan_idr: 35000, default_harga_jual_sgd: 8.0, kategori: 'Minyak' },
      { sku: 'GULA-AREN-250G', nama: 'Gula Aren 250g', default_modal_satuan_idr: 22000, default_harga_jual_sgd: 5.2, kategori: 'Pemanis' },
      { sku: 'KACANG-METE-100G', nama: 'Kacang Mete 100g', default_modal_satuan_idr: 45000, default_harga_jual_sgd: 9.8, kategori: 'Kacang' }
    ];

    let productsAdded = 0;
    for (const product of additionalProducts) {
      try {
        const result = await database.upsertProduct(product);
        if (result.success) {
          productsAdded++;
        }
      } catch (error) {
        console.error('Error adding product:', product.sku, error);
      }
    }

    console.log(`✅ Added ${productsAdded} additional products`);

    // Now add comprehensive transaction data
    const sampleTransactions = [
      // October 2024 transactions
      { tanggal: '2024-10-01', sku: 'KOPI-ARABICA-250G', qty: 2, modal_satuan_idr: 45000, harga_jual_sgd: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-10-02', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_idr: 33000, harga_jual_sgd: 8.5, pelanggan: 'Sarah Lim', metode_bayar: 'Kartu' },
      { tanggal: '2024-10-03', sku: 'COKLAT-DARK-200G', qty: 3, modal_satuan_idr: 28000, harga_jual_sgd: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-10-04', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_idr: 38000, harga_jual_sgd: 7.2, pelanggan: 'John Tan', metode_bayar: 'E-Wallet' },
      { tanggal: '2024-10-05', sku: 'TEH-EARL-GREY-100G', qty: 2, modal_satuan_idr: 25000, harga_jual_sgd: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      
      // More October transactions
      { tanggal: '2024-10-08', sku: 'KOPI-ARABICA-250G', qty: 1, modal_satuan_idr: 45000, harga_jual_sgd: 7.9, pelanggan: 'Maria Santos', metode_bayar: 'Transfer' },
      { tanggal: '2024-10-09', sku: 'TEH-MATCHA-100G', qty: 2, modal_satuan_idr: 33000, harga_jual_sgd: 8.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-10-10', sku: 'COKLAT-DARK-200G', qty: 1, modal_satuan_idr: 28000, harga_jual_sgd: 6.5, pelanggan: 'David Wong', metode_bayar: 'Kartu' },
      { tanggal: '2024-10-12', sku: 'KOPI-ROBUSTA-250G', qty: 3, modal_satuan_idr: 38000, harga_jual_sgd: 7.2, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-10-15', sku: 'TEH-EARL-GREY-100G', qty: 1, modal_satuan_idr: 25000, harga_jual_sgd: 5.9, pelanggan: 'Lisa Chen', metode_bayar: 'E-Wallet' },
      
      // September 2024 transactions
      { tanggal: '2024-09-05', sku: 'KOPI-ARABICA-250G', qty: 2, modal_satuan_idr: 45000, harga_jual_sgd: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-09-10', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_idr: 33000, harga_jual_sgd: 8.5, pelanggan: 'Amy Loh', metode_bayar: 'Kartu' },
      { tanggal: '2024-09-15', sku: 'COKLAT-DARK-200G', qty: 2, modal_satuan_idr: 28000, harga_jual_sgd: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-09-20', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_idr: 38000, harga_jual_sgd: 7.2, pelanggan: 'Robert Kim', metode_bayar: 'Transfer' },
      { tanggal: '2024-09-25', sku: 'TEH-EARL-GREY-100G', qty: 3, modal_satuan_idr: 25000, harga_jual_sgd: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      
      // August 2024 transactions
      { tanggal: '2024-08-02', sku: 'KOPI-ARABICA-250G', qty: 1, modal_satuan_idr: 45000, harga_jual_sgd: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-08-08', sku: 'TEH-MATCHA-100G', qty: 2, modal_satuan_idr: 33000, harga_jual_sgd: 8.5, pelanggan: 'Grace Ng', metode_bayar: 'E-Wallet' },
      { tanggal: '2024-08-14', sku: 'COKLAT-DARK-200G', qty: 1, modal_satuan_idr: 28000, harga_jual_sgd: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-08-20', sku: 'KOPI-ROBUSTA-250G', qty: 2, modal_satuan_idr: 38000, harga_jual_sgd: 7.2, pelanggan: 'Michael Lee', metode_bayar: 'Kartu' },
      { tanggal: '2024-08-26', sku: 'TEH-EARL-GREY-100G', qty: 1, modal_satuan_idr: 25000, harga_jual_sgd: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      
      // July 2024 transactions
      { tanggal: '2024-07-03', sku: 'KOPI-ARABICA-250G', qty: 3, modal_satuan_idr: 45000, harga_jual_sgd: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-07-12', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_idr: 33000, harga_jual_sgd: 8.5, pelanggan: 'Jessica Teo', metode_bayar: 'Transfer' },
      { tanggal: '2024-07-18', sku: 'COKLAT-DARK-200G', qty: 2, modal_satuan_idr: 28000, harga_jual_sgd: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-07-22', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_idr: 38000, harga_jual_sgd: 7.2, pelanggan: 'Daniel Koh', metode_bayar: 'E-Wallet' },
      { tanggal: '2024-07-28', sku: 'TEH-EARL-GREY-100G', qty: 2, modal_satuan_idr: 25000, harga_jual_sgd: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      
      // June 2024 transactions
      { tanggal: '2024-06-05', sku: 'KOPI-ARABICA-250G', qty: 1, modal_satuan_idr: 45000, harga_jual_sgd: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-06-11', sku: 'TEH-MATCHA-100G', qty: 3, modal_satuan_idr: 33000, harga_jual_sgd: 8.5, pelanggan: 'Rachel Sim', metode_bayar: 'Kartu' },
      { tanggal: '2024-06-17', sku: 'COKLAT-DARK-200G', qty: 1, modal_satuan_idr: 28000, harga_jual_sgd: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-06-23', sku: 'KOPI-ROBUSTA-250G', qty: 2, modal_satuan_idr: 38000, harga_jual_sgd: 7.2, pelanggan: 'Kevin Ong', metode_bayar: 'Transfer' },
      { tanggal: '2024-06-29', sku: 'TEH-EARL-GREY-100G', qty: 1, modal_satuan_idr: 25000, harga_jual_sgd: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      
      // May 2024 transactions
      { tanggal: '2024-05-07', sku: 'KOPI-ARABICA-250G', qty: 2, modal_satuan_idr: 45000, harga_jual_sgd: 7.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-05-13', sku: 'TEH-MATCHA-100G', qty: 1, modal_satuan_idr: 33000, harga_jual_sgd: 8.5, pelanggan: 'Helen Yap', metode_bayar: 'E-Wallet' },
      { tanggal: '2024-05-19', sku: 'COKLAT-DARK-200G', qty: 3, modal_satuan_idr: 28000, harga_jual_sgd: 6.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-05-25', sku: 'KOPI-ROBUSTA-250G', qty: 1, modal_satuan_idr: 38000, harga_jual_sgd: 7.2, pelanggan: 'Steven Lim', metode_bayar: 'Kartu' },
      { tanggal: '2024-05-30', sku: 'TEH-EARL-GREY-100G', qty: 2, modal_satuan_idr: 25000, harga_jual_sgd: 5.9, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      
      // Additional transactions with new products
      { tanggal: '2024-10-16', sku: 'BISKUIT-MARIE-200G', qty: 4, modal_satuan_idr: 15000, harga_jual_sgd: 3.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-10-17', sku: 'KERIPIK-SINGKONG-150G', qty: 2, modal_satuan_idr: 12000, harga_jual_sgd: 2.8, pelanggan: 'Ahmad Rizki', metode_bayar: 'E-Wallet' },
      { tanggal: '2024-10-18', sku: 'MINYAK-KELAPA-500ML', qty: 1, modal_satuan_idr: 35000, harga_jual_sgd: 8.0, pelanggan: 'Siti Nurhaliza', metode_bayar: 'Transfer' },
      { tanggal: '2024-10-19', sku: 'GULA-AREN-250G', qty: 3, modal_satuan_idr: 22000, harga_jual_sgd: 5.2, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-10-20', sku: 'KACANG-METE-100G', qty: 1, modal_satuan_idr: 45000, harga_jual_sgd: 9.8, pelanggan: 'Budi Santoso', metode_bayar: 'Kartu' },
      
      // More transactions for better charts
      { tanggal: '2024-09-28', sku: 'BISKUIT-MARIE-200G', qty: 2, modal_satuan_idr: 15000, harga_jual_sgd: 3.5, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-08-30', sku: 'KERIPIK-SINGKONG-150G', qty: 3, modal_satuan_idr: 12000, harga_jual_sgd: 2.8, pelanggan: 'Rina Sari', metode_bayar: 'E-Wallet' },
      { tanggal: '2024-07-31', sku: 'MINYAK-KELAPA-500ML', qty: 2, modal_satuan_idr: 35000, harga_jual_sgd: 8.0, pelanggan: 'Walk-in', metode_bayar: 'Tunai' },
      { tanggal: '2024-06-30', sku: 'GULA-AREN-250G', qty: 1, modal_satuan_idr: 22000, harga_jual_sgd: 5.2, pelanggan: 'Indra Wijaya', metode_bayar: 'Transfer' },
      { tanggal: '2024-05-31', sku: 'KACANG-METE-100G', qty: 2, modal_satuan_idr: 45000, harga_jual_sgd: 9.8, pelanggan: 'Walk-in', metode_bayar: 'Kartu' }
    ];

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    console.log(`📊 Processing ${sampleTransactions.length} transactions...`);

    // Add each transaction
    for (let i = 0; i < sampleTransactions.length; i++) {
      const tx = sampleTransactions[i];
      try {
        console.log(`Processing transaction ${i + 1}/${sampleTransactions.length}: ${tx.tanggal} ${tx.sku}`);
        
        const result = await database.addTransaction({
          tanggal: tx.tanggal,
          sku: tx.sku,
          qty: tx.qty,
          modal_satuan_idr: tx.modal_satuan_idr,
          harga_jual_sgd: tx.harga_jual_sgd,
          fee_rate: 2.9,
          fee_flat_sgd: 0.5,
          biaya_lain_sgd: 0,
          apply_gst: false,
          gst_rate: 0.09,
          pelanggan: tx.pelanggan,
          metode_bayar: tx.metode_bayar,
          catatan: ''
        });

        if (result.success) {
          successCount++;
          console.log(`✅ Success: ${tx.tanggal} ${tx.sku}`);
        } else {
          errorCount++;
          console.error(`❌ Failed: ${tx.tanggal} ${tx.sku} - ${result.error}`);
          errors.push(`${tx.tanggal} ${tx.sku}: ${result.error}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Exception: ${tx.tanggal} ${tx.sku} - ${error}`);
        errors.push(`${tx.tanggal} ${tx.sku}: ${error}`);
      }
    }

    console.log(`🎉 Seeding completed! Success: ${successCount}, Failed: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Comprehensive dummy data seeded successfully!`,
      data: {
        products_added: productsAdded,
        total_transactions: sampleTransactions.length,
        successful: successCount,
        failed: errorCount,
        errors: errors.slice(0, 5), // Show first 5 errors only
        summary: {
          total_products: 10, // 5 original + 5 new
          products_covered: [
            'KOPI-ARABICA-250G', 'TEH-MATCHA-100G', 'COKLAT-DARK-200G', 
            'KOPI-ROBUSTA-250G', 'TEH-EARL-GREY-100G', 'BISKUIT-MARIE-200G',
            'KERIPIK-SINGKONG-150G', 'MINYAK-KELAPA-500ML', 'GULA-AREN-250G', 'KACANG-METE-100G'
          ],
          date_range: '2024-05-07 to 2024-10-20',
          months_covered: 6,
          categories: ['Kopi', 'Teh', 'Coklat', 'Snack', 'Minyak', 'Pemanis', 'Kacang']
        }
      }
    });
  } catch (error) {
    console.error('Error seeding dummy data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed dummy data' },
      { status: 500 }
    );
  }
}