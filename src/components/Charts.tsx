'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string | string[];
    backgroundColor?: string | string[];
    tension?: number;
    fill?: boolean;
    borderWidth?: number;
    borderRadius?: number;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    pointHoverBackgroundColor?: string;
    pointHoverBorderColor?: string;
  }[];
}

interface ChartProps {
  data: ChartData;
  title: string;
  type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'horizontalBar';
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  gradient?: boolean;
  timeRange?: number;
}

export function DashboardChart({ 
  data, 
  title, 
  type = 'line', 
  height = 280, 
  showLegend = false,
  showTooltip = true,
  gradient = false,
  timeRange = 1
}: ChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'normal' as const,
          },
          color: '#6b7280',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: showTooltip,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== undefined) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'SGD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: 'normal' as const,
          },
          padding: 12,
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value);
          }
        },
      },
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: 'normal' as const,
          },
          padding: 12,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 8,
        borderWidth: 3,
        backgroundColor: '#ffffff',
        borderColor: '#3b82f6',
        hoverBackgroundColor: '#ffffff',
        hoverBorderColor: '#1d4ed8',
      },
      line: {
        tension: 0.4,
        borderWidth: 3,
        borderCapStyle: 'round' as const,
        borderJoinStyle: 'round' as const,
      },
      bar: {
        borderRadius: type === 'horizontalBar' ? 0 : 8,
        borderSkipped: false,
      },
    },
  };

  const ChartComponent = type === 'bar' ? Bar : 
                        type === 'pie' ? Pie : 
                        type === 'doughnut' ? Doughnut : 
                        type === 'horizontalBar' ? Bar : Line;

  // Enhanced data with gradients for premium look
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: gradient && Array.isArray(dataset.backgroundColor) 
        ? dataset.backgroundColor 
        : gradient 
          ? `linear-gradient(135deg, ${Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor}20, ${Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor}80)`
          : dataset.backgroundColor,
      borderColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : (dataset.borderColor || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor)),
      pointBackgroundColor: dataset.pointBackgroundColor || '#ffffff',
      pointBorderColor: dataset.pointBorderColor || (Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor) || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor),
      pointHoverBackgroundColor: dataset.pointHoverBackgroundColor || '#ffffff',
      pointHoverBorderColor: dataset.pointHoverBorderColor || (Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor) || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor),
    }))
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm relative overflow-hidden group">
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 font-medium">
            {timeRange === 1 ? 'Performa 1 bulan terakhir' : 
             timeRange === 3 ? 'Performa 3 bulan terakhir' : 
             'Performa 6 bulan terakhir'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm border-2 border-white" 
                style={{ backgroundColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : (dataset.borderColor || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor)) }}
              />
              <span className="text-sm font-semibold text-gray-700">{dataset.label}</span>
            </div>
          ))}
          <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chart Container */}
      <div style={{ height: height }} className="relative z-10">
        <ChartComponent options={options} data={enhancedData} />
      </div>
    </div>
  );
}

// Specialized chart components for premium dashboard
export function RevenueChart({ data, title = "Tren Pendapatan" }: { data: any, title?: string }) {
  const chartData = {
    labels: data?.labels || ['10.07', '11.07', '12.07', '13.07', '14.07', '15.07', '16.07'],
    datasets: [{
      label: 'Pendapatan',
      data: data?.revenue || [9000, 6000, 8000, 14000, 13000, 18000, 14000],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  return (
    <DashboardChart 
      data={chartData} 
      title={title} 
      type="line" 
      height={320}
      gradient={true}
    />
  );
}

export function ProfitChart({ data, title = "Gross Profit" }: { data: any, title?: string }) {
  const chartData = {
    labels: data?.labels || ['10.07', '11.07', '12.07', '13.07', '14.07', '15.07', '16.07'],
    datasets: [{
      label: 'Gross Profit',
      data: data?.profit || [5000, 9000, 6500, 9000, 14000, 17000, 14000],
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  return (
    <DashboardChart 
      data={chartData} 
      title={title} 
      type="line" 
      height={320}
      gradient={true}
    />
  );
}

export function OrderTypesChart({ data, title = "Kategori Produk" }: { data: any, title?: string }) {
  const chartData = {
    labels: data?.labels || ['On-site', 'To-go', 'Delivery'],
    datasets: [{
      label: 'Pendapatan',
      data: data?.values || [4200, 5500, 800],
      backgroundColor: [
        'rgba(245, 158, 11, 0.8)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(245, 158, 11, 0.4)',
      ],
      borderColor: '#f59e0b',
      borderWidth: 0,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: SGD ${context.parsed.x.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: 'normal' as const,
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value);
          }
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-transparent to-yellow-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 font-medium">Pendapatan berdasarkan kategori produk</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
      
      <div style={{ height: 280 }} className="relative z-10">
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
}

export function PaymentMethodsChart({ data, title = "Metode Pembayaran" }: { data: any, title?: string }) {
  const chartData = {
    labels: data?.labels || ['Card', 'Cash', 'Bonus System', 'On the House'],
    datasets: [{
      label: 'Metode Pembayaran',
      data: data?.values || [35, 38, 22, 6],
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(147, 51, 234, 0.6)',
        'rgba(147, 51, 234, 0.4)',
        'rgba(147, 51, 234, 0.2)',
      ],
      borderColor: [
        'rgba(147, 51, 234, 1)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(147, 51, 234, 0.6)',
        'rgba(147, 51, 234, 0.4)',
      ],
      borderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: '#6b7280',
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                return {
                  text: `${label}: ${value}%`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: 2,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 font-medium">Distribusi Pembayaran</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
      
      <div style={{ height: 280 }} className="relative z-10">
        <Pie options={options} data={chartData} />
      </div>
    </div>
  );
}

// Sample data generators for demo purposes
export function generateSampleRevenueData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenueData = [1200, 1900, 1500, 2200, 1800, 2400];

  return {
    labels: months,
    datasets: [
      {
        label: 'Pendapatan',
        data: revenueData,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.05)',
        fill: true,
      },
    ],
  };
}

export function generateSampleModalData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const modalData = [800, 1200, 950, 1400, 1100, 1500]; // in thousands IDR

  return {
    labels: months,
    datasets: [
      {
        label: 'Modal',
        data: modalData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        fill: true,
      },
    ],
  };
}

export function generateSampleTransactionData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const transactionData = [45, 67, 52, 78, 61, 89];

  return {
    labels: months,
    datasets: [
      {
        label: 'Transaksi',
        data: transactionData,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
      },
    ],
  };
}