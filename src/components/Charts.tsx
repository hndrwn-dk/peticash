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
  Legend
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
  }[];
}

interface ChartProps {
  data: ChartData;
  title: string;
  type?: 'line' | 'bar';
  height?: number;
}

export function DashboardChart({ data, title, type = 'line', height = 300 }: ChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
        },
      },
      x: {
        grid: {
          color: '#f3f4f6',
        },
      },
    },
  };

  const ChartComponent = type === 'bar' ? Bar : Line;

  return (
    <div className="card" style={{ height: height + 60 }}>
      <ChartComponent options={options} data={data} height={height} />
    </div>
  );
}

// Sample data generators for demo purposes
export function generateSampleRevenueData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenueData = [1200, 1900, 1500, 2200, 1800, 2400];
  const modalData = [800000, 1200000, 950000, 1400000, 1100000, 1500000];

  return {
    labels: months,
    datasets: [
      {
        label: 'Revenue (SGD)',
        data: revenueData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
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
        label: 'Modal (Ribu IDR)',
        data: modalData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
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
        label: 'Jumlah Transaksi',
        data: transactionData,
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
      },
    ],
  };
}