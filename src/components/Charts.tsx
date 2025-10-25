'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
    fill?: boolean;
    borderWidth?: number;
    borderRadius?: number;
  }[];
}

interface ChartProps {
  data: ChartData;
  title: string;
  type?: 'line' | 'bar';
  height?: number;
}

export function DashboardChart({ data, title, type = 'line', height = 280 }: ChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
      },
      title: {
        display: false, // We'll add title outside the chart
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: '#f1f5f9',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
          padding: 8,
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
          color: '#64748b',
          font: {
            size: 11,
          },
          padding: 8,
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: '#ffffff',
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      },
    },
  };

  const ChartComponent = type === 'bar' ? Bar : Line;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-xs text-gray-500">Data from last 6 months</p>
        </div>
        <div className="flex items-center space-x-3">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-1.5">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: dataset.borderColor || dataset.backgroundColor }}
              />
              <span className="text-xs font-medium text-gray-600">{dataset.label}</span>
            </div>
          ))}
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div style={{ height: height }} className="relative">
        <ChartComponent options={options} data={data} />
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