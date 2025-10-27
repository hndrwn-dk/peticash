import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/dashboard/stats - Get dashboard statistics and chart data
export async function GET(request: NextRequest) {
  try {
    // Get months parameter from URL, default to 6
    const months = parseInt(request.nextUrl.searchParams.get('months') || '6');
    
    // Get current date and calculate months back
    const now = new Date();
    const chartData = {
      labels: [] as string[],
      revenue: [] as number[],
      modal: [] as number[],
      transactions: [] as number[],
      grossProfit: [] as number[],
      paymentMethods: {} as Record<string, number>,
      orderTypes: {} as Record<string, number>
    };

    // Generate last N months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periode = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Format month name
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      chartData.labels.push(monthLabel);
      
      try {
        // Get transactions for this month
        const transactions = await database.getTransactions(periode);
        
        // Calculate totals
        let monthlyRevenue = 0;
        let monthlyModal = 0;
        let monthlyGrossProfit = 0;
        let transactionCount = transactions.length;
        
        transactions.forEach((tx: any) => {
          if (tx.pendapatan_sgd) monthlyRevenue += tx.pendapatan_sgd;
          if (tx.modal_total_IDR) monthlyModal += tx.modal_total_IDR;
          
          // Calculate gross profit (revenue - cost)
          const revenue = tx.pendapatan_sgd || 0;
          const cost = tx.modal_total_IDR || 0;
          monthlyGrossProfit += (revenue - cost);
          
          // Count payment methods
          if (tx.metode_bayar) {
            chartData.paymentMethods[tx.metode_bayar] = (chartData.paymentMethods[tx.metode_bayar] || 0) + 1;
          }
          
          // For now, we'll use a simple categorization based on pelanggan field
          // In a real system, you'd have an order_type field
          const orderType = tx.pelanggan ? 'On-site' : 'To-go'; // Simple logic for demo
          chartData.orderTypes[orderType] = (chartData.orderTypes[orderType] || 0) + (tx.pendapatan_sgd || 0);
        });
        
        chartData.revenue.push(Math.round(monthlyRevenue * 100) / 100);
        chartData.modal.push(Math.round(monthlyModal / 1000)); // Convert to thousands
        chartData.grossProfit.push(Math.round(monthlyGrossProfit * 100) / 100);
        chartData.transactions.push(transactionCount);
      } catch (error) {
        console.error(`Error getting data for ${periode}:`, error);
        chartData.revenue.push(0);
        chartData.modal.push(0);
        chartData.grossProfit.push(0);
        chartData.transactions.push(0);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}