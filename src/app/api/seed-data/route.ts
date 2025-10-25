import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// POST /api/seed-data - Seed dummy transaction data
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding dummy transaction data...');

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

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Add each transaction
    for (const tx of sampleTransactions) {
      try {
        const result = await database.addTransaction({
          tanggal: tx.tanggal,
          sku: tx.sku,
          qty: tx.qty,
          modal_satuan_IDR: tx.modal_satuan_IDR,
          harga_jual_SGD: tx.harga_jual_SGD,
          fee_rate: 2.9,
          fee_flat_SGD: 0.5,
          biaya_lain_SGD: 0,
          apply_gst: false,
          gst_rate: 0.09,
          pelanggan: tx.pelanggan,
          metode_bayar: tx.metode_bayar,
          catatan: ''
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${tx.tanggal} ${tx.sku}: ${result.error}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`${tx.tanggal} ${tx.sku}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Dummy data seeded successfully!`,
      data: {
        total_transactions: sampleTransactions.length,
        successful: successCount,
        failed: errorCount,
        errors: errors.slice(0, 5), // Show first 5 errors only
        summary: {
          products_covered: ['KOPI-ARABICA-250G', 'TEH-MATCHA-100G', 'COKLAT-DARK-200G', 'KOPI-ROBUSTA-250G', 'TEH-EARL-GREY-100G'],
          date_range: '2024-05-07 to 2024-10-15',
          months_covered: 6
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