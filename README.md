# Bookkeeper - Retail Sales Management

A modern web application for retail bookkeeping with IDR cost and SGD sales tracking, built with Next.js and ready for Vercel deployment.

## Features

- Product Management - Add, edit, and search products with barcode support
- Transaction Recording - Fast transaction entry with validation
- Monthly Reports - Comprehensive sales and cost analysis
- Dual Currency - IDR costs and SGD sales without conversion
- Mobile Responsive - Works on desktop, tablet, and mobile
- Real-time Dashboard - Live stats and recent activity
- CSV Import/Export - Bulk product import with SQLite storage

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS
- Storage: SQLite Database
- Deployment: Vercel

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. Clone and install dependencies
```bash
git clone <repository-url>
cd bookkeeper
npm install
```

2. Run development server
```bash
npm run dev
```

3. Open in browser
```
http://localhost:3000
```

## Deployment to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. Deploy on Vercel
- Go to vercel.com
- Click "New Project"
- Import your GitHub repository
- Configure build settings (auto-detected)
- Deploy

### Option 2: Deploy with Vercel CLI

1. Install Vercel CLI
```bash
npm i -g vercel
```

2. Deploy
```bash
vercel --prod
```

## Project Structure

```
bookkeeper/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── products/      # Product management APIs
│   │   │   ├── transactions/  # Transaction APIs
│   │   │   └── reports/       # Report generation APIs
│   │   ├── products/          # Product pages
│   │   ├── transactions/      # Transaction pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage/Dashboard
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and services
│   │   └── bookkeeper.ts      # Core business logic
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── vercel.json               # Vercel configuration
├── tailwind.config.js        # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

## Usage Guide

### 1. Product Management

Add Products
- Navigate to Products → Add Product
- Fill in SKU, name, and optional pricing
- Save to add to catalog

Bulk Import
- Prepare CSV with headers: sku,nama,default_modal_satuan_IDR,default_harga_jual_SGD,kategori,barcode
- Go to Products → Import CSV
- Paste CSV content and import

### 2. Transaction Recording

New Transaction
- Go to Transactions → New Transaction
- Select product (with autocomplete)
- Enter quantity and pricing
- Add customer and payment details
- Save transaction

### 3. Reports

Monthly Summary
- Navigate to Reports
- Select month/year
- View comprehensive breakdown:
  - Total costs (IDR)
  - Total sales (SGD) 
  - Transaction fees and GST
  - Top-selling products

## API Endpoints

### Products
- GET /api/products - List/search products
- POST /api/products - Create/update product
- POST /api/products/bulk-import - Bulk import from CSV

### Transactions  
- GET /api/transactions?periode=YYYY-MM - Get transactions
- POST /api/transactions - Add new transaction

### Reports
- GET /api/reports/[periode] - Generate monthly report

## Configuration

### Data Storage

Data is stored in a SQLite database:

```
data/
└── bookkeeper.db              # SQLite database file

Database Tables:
├── products                   # Product catalog with indexes
└── transactions              # All transactions with relationships
```

### Vercel Considerations

- File Storage: Vercel's filesystem is read-only in production except for /tmp
- Persistence: For production use, consider external storage (AWS S3, Database)
- Serverless Functions: API routes run as serverless functions with 30s timeout

## License

MIT License - Free for commercial and personal use.