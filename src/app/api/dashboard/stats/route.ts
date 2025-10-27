import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/dashboard/stats - Get dashboard statistics and chart data
export async function GET(request: NextRequest) {
  try {
    // Get months parameter from URL, default to 1
    const months = parseInt(request.nextUrl.searchParams.get('months') || '1');
    
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
        console.log('Raw transactions for', periode, ':', JSON.stringify(transactions, null, 2));
        console.log('Transaction fields:', transactions.length > 0 ? Object.keys(transactions[0]) : 'No transactions');
        console.log('Pendapatan SGD values:', transactions.map((tx: any) => ({ sku: tx.sku, pendapatan_sgd: tx.pendapatan_sgd, type: typeof tx.pendapatan_sgd })));
        
        // Get products to get categories
        const products = await database.getProducts();
        const productMap = new Map(products.map((p: any) => [p.sku, p]));
        console.log('Products with categories:', products.map((p: any) => ({ sku: p.sku, kategori: p.kategori })));
        
        // Calculate totals
        let monthlyRevenue = 0;
        let monthlyModal = 0;
        let monthlyGrossProfit = 0;
        let transactionCount = transactions.length;
        
        transactions.forEach((tx: any) => {
          // Fix revenue calculation - ensure we convert to number and handle null/undefined
          const pendapatanSgd = Number(tx.pendapatan_sgd) || 0;
          const hargaJualSgd = Number(tx.harga_jual_sgd) || 0;
          const revenue = pendapatanSgd || hargaJualSgd;
          console.log(`Transaction ${tx.sku}: pendapatan_sgd=${tx.pendapatan_sgd} (${typeof tx.pendapatan_sgd}), harga_jual_sgd=${tx.harga_jual_sgd} (${typeof tx.harga_jual_sgd}), calculated revenue=${revenue}`);
          monthlyRevenue += revenue;
          
          if (tx.modal_total_IDR) monthlyModal += tx.modal_total_IDR;
          
          // Calculate gross profit (revenue - cost)
          const cost = tx.modal_total_IDR || 0;
          monthlyGrossProfit += (revenue - cost);
          
          // Count payment methods
          if (tx.metode_bayar) {
            chartData.paymentMethods[tx.metode_bayar] = (chartData.paymentMethods[tx.metode_bayar] || 0) + 1;
          }
          
          // Categorize by product categories instead of order types
          // Get product category from the product map
          const product = productMap.get(tx.sku) as any;
          const productCategory = product?.kategori || 'Other';
          const currentValue = Number(chartData.orderTypes[productCategory]) || 0;
          chartData.orderTypes[productCategory] = currentValue + revenue;
        });
        
        chartData.revenue.push(Math.round(monthlyRevenue * 100) / 100);
        chartData.modal.push(Math.round(monthlyModal / 1000)); // Convert to thousands
        chartData.grossProfit.push(Math.round(monthlyGrossProfit * 100) / 100);
        chartData.transactions.push(transactionCount);
        
        // Debug logging
        console.log(`Month ${periode}: ${transactionCount} transactions, Revenue: ${monthlyRevenue}, Modal: ${monthlyModal}`);
        console.log('Product Categories:', chartData.orderTypes);
        console.log('All products in database:', products.map((p: any) => ({ sku: p.sku, kategori: p.kategori })));
        console.log('Transaction SKUs:', transactions.map((tx: any) => ({ sku: tx.sku, pendapatan_sgd: tx.pendapatan_sgd, harga_jual_sgd: tx.harga_jual_sgd })));
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