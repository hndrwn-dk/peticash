import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// POST /api/invoice - Generate invoice for customer or financial report
export async function POST(request: NextRequest) {
  try {
    const { type, customer, period, transactionIds } = await request.json();
    
    if (type === 'customer') {
      // Generate customer invoice
      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer name is required for customer invoice' },
          { status: 400 }
        );
      }

      // Get transactions for the customer
      const transactions = await database.getTransactionsByCustomer(customer);
      
      if (transactions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No transactions found for this customer' },
          { status: 404 }
        );
      }

      const invoiceData = {
        customer,
        transactions,
        totalAmount: transactions.reduce((sum: number, tx: any) => sum + (tx.pendapatan_sgd || 0), 0),
        generatedAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: invoiceData
      });

    } else if (type === 'financial') {
      // Generate financial report
      if (!period) {
        return NextResponse.json(
          { success: false, error: 'Period is required for financial report' },
          { status: 400 }
        );
      }

      const transactions = await database.getTransactions(period);
      
      if (transactions.length === 0) {
        return NextResponse.json(
          { success: false, error: `No transactions found for period ${period}` },
          { status: 404 }
        );
      }

      const reportData = {
        period,
        transactions,
        totalRevenue: transactions.reduce((sum: number, tx: any) => sum + (tx.pendapatan_sgd || 0), 0),
        totalTransactions: transactions.length,
        generatedAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: reportData
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid invoice type. Use "customer" or "financial"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('POST /api/invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
