import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// POST /api/quick-seed - Quick seed with just a few transactions for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Quick seeding for testing...');

    // Add just 5 simple transactions for immediate testing
    const quickTransactions = [
      {
        tanggal: '2024-10-25', // Today
        sku: 'KOPI-ARABICA-250G',
        qty: 2,
        modal_satuan_IDR: 45000,
        harga_jual_SGD: 7.9,
        fee_rate: 2.9,
        fee_flat_SGD: 0.5,
        biaya_lain_SGD: 0,
        apply_gst: false,
        gst_rate: 0.09,
        pelanggan: 'Test Customer',
        metode_bayar: 'Tunai',
        catatan: 'Test transaction 1'
      },
      {
        tanggal: '2024-10-24',
        sku: 'TEH-MATCHA-100G',
        qty: 1,
        modal_satuan_IDR: 33000,
        harga_jual_SGD: 8.5,
        fee_rate: 2.9,
        fee_flat_SGD: 0.5,
        biaya_lain_SGD: 0,
        apply_gst: false,
        gst_rate: 0.09,
        pelanggan: 'Sarah Lim',
        metode_bayar: 'Kartu',
        catatan: 'Test transaction 2'
      },
      {
        tanggal: '2024-10-23',
        sku: 'COKLAT-DARK-200G',
        qty: 3,
        modal_satuan_IDR: 28000,
        harga_jual_SGD: 6.5,
        fee_rate: 2.9,
        fee_flat_SGD: 0.5,
        biaya_lain_SGD: 0,
        apply_gst: false,
        gst_rate: 0.09,
        pelanggan: 'Walk-in',
        metode_bayar: 'Tunai',
        catatan: 'Test transaction 3'
      }
    ];

    let successCount = 0;
    const errors = [];

    console.log('📊 Adding quick test transactions...');

    for (const tx of quickTransactions) {
      try {
        console.log(`Adding: ${tx.tanggal} ${tx.sku} x${tx.qty}`);
        const result = await database.addTransaction(tx);
        
        if (result.success) {
          successCount++;
          console.log(`✅ Success: ${tx.sku}`);
        } else {
          console.error(`❌ Failed: ${tx.sku} - ${result.error}`);
          errors.push(`${tx.sku}: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Exception: ${tx.sku} - ${error}`);
        errors.push(`${tx.sku}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      message: `Quick seed completed! Added ${successCount} transactions`,
      data: {
        successful: successCount,
        failed: errors.length,
        errors: errors,
        transactions_added: quickTransactions.slice(0, successCount).map(tx => ({
          date: tx.tanggal,
          sku: tx.sku,
          qty: tx.qty,
          revenue: (tx.qty * tx.harga_jual_SGD).toFixed(2)
        }))
      }
    });

  } catch (error) {
    console.error('Quick seed error:', error);
    return NextResponse.json(
      { success: false, error: `Quick seed failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}