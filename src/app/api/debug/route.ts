import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// GET /api/debug - Check database contents for debugging
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking database contents...');

    // Get current month for comparison
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get current month transactions
    const transactions = await database.getTransactions(currentMonth);

    // Get all products
    const products = await database.getProducts();

    // All transactions are already filtered to current month
    const currentMonthTransactions = transactions;

    return NextResponse.json({
      success: true,
      debug_info: {
        current_date: now.toISOString().split('T')[0],
        current_month: currentMonth,
        total_products: products.length,
        total_transactions: transactions.length,
        current_month_transactions: currentMonthTransactions.length,
        recent_transactions: transactions.slice(0, 5).map((tx: any) => ({
          date: tx.tanggal,
          sku: tx.sku,
          qty: tx.qty,
          revenue_sgd: tx.pendapatan_SGD
        })),
        current_month_transactions_detail: currentMonthTransactions.map((tx: any) => ({
          date: tx.tanggal,
          sku: tx.sku,
          qty: tx.qty,
          revenue_sgd: tx.pendapatan_SGD
        }))
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: `Debug failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}