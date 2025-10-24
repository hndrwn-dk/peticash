# 🏪 Bookkeeper Web - Retail Sales Management

A modern web application for retail bookkeeping with IDR cost and SGD sales tracking, built with Next.js and deployed on Vercel.

## 🚀 Features

- ✅ **Product Management** - Add, edit, and search products with barcode support
- ✅ **Transaction Recording** - Fast transaction entry with autocomplete
- ✅ **Monthly Reports** - Comprehensive sales and cost analysis
- ✅ **Dual Currency** - IDR costs and SGD sales without conversion
- ✅ **Mobile Responsive** - Works on desktop, tablet, and mobile
- ✅ **Real-time Dashboard** - Live stats and recent activity
- ✅ **CSV Import/Export** - Bulk product import and data export

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: File-based (CSV/JSON)
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd bookkeeper-web
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local as needed
```

3. **Run development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 🚀 Deployment to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Deploy on Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Configure build settings (auto-detected)
- Deploy!

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
# Follow the prompts
```

### Environment Variables for Production

In your Vercel dashboard, add these environment variables:

```
DATA_DIR=./data
NODE_ENV=production
```

## 📁 Project Structure

```
bookkeeper-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── products/      # Product management APIs
│   │   │   ├── transactions/  # Transaction APIs
│   │   │   └── reports/       # Report generation APIs
│   │   ├── products/          # Product pages
│   │   ├── transactions/      # Transaction pages
│   │   ├── reports/           # Report pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage/Dashboard
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and services
│   │   └── bookkeeper.ts      # Core business logic
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── data/                      # Data storage (created automatically)
│   ├── master/
│   │   └── products.json      # Product catalog
│   └── pembukuan/
│       ├── ledger_YYYY-MM.csv # Monthly transactions
│       └── rekap_YYYY-MM.csv  # Monthly reports
├── vercel.json               # Vercel configuration
├── tailwind.config.js        # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

## 🎯 Usage Guide

### 1. Product Management

**Add Products**
- Navigate to Products → Add Product
- Fill in SKU, name, and optional pricing
- Save to add to catalog

**Bulk Import**
- Prepare CSV with headers: `sku,nama,default_modal_satuan_IDR,default_harga_jual_SGD,kategori,barcode`
- Go to Products → Import CSV
- Paste CSV content and import

### 2. Transaction Recording

**New Transaction**
- Go to Transactions → New Transaction
- Select product (with autocomplete)
- Enter quantity and pricing
- Add customer and payment details
- Save transaction

### 3. Reports

**Monthly Summary**
- Navigate to Reports
- Select month/year
- View comprehensive breakdown:
  - Total costs (IDR)
  - Total sales (SGD) 
  - Transaction fees and GST
  - Top-selling products

## 📊 API Endpoints

### Products
- `GET /api/products` - List/search products
- `POST /api/products` - Create/update product
- `POST /api/products/bulk-import` - Bulk import from CSV

### Transactions  
- `GET /api/transactions?periode=YYYY-MM` - Get transactions
- `POST /api/transactions` - Add new transaction

### Reports
- `GET /api/reports/[periode]` - Generate monthly report

## 🔧 Configuration

### Data Storage

By default, data is stored in the `./data` directory as CSV and JSON files:

```
data/
├── master/
│   └── products.json          # Product catalog
└── pembukuan/
    ├── ledger_2025-01.csv     # January 2025 transactions
    ├── rekap_2025-01.csv      # January 2025 summary
    └── ...
```

### Vercel Considerations

- **File Storage**: Vercel's filesystem is read-only in production except for `/tmp`
- **Persistence**: For production use, consider external storage (AWS S3, Database)
- **Serverless Functions**: API routes run as serverless functions with 30s timeout

### Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] External file storage (AWS S3)
- [ ] Real-time barcode scanning
- [ ] Multi-user support with authentication
- [ ] Advanced analytics and charts
- [ ] Mobile app (React Native)

## 🐛 Troubleshooting

### Common Issues

1. **Data not persisting on Vercel**
   - Vercel's filesystem is ephemeral
   - Use external storage for production

2. **API timeout errors**
   - Large CSV imports may timeout
   - Break into smaller batches

3. **Build errors**
   - Check TypeScript types
   - Ensure all dependencies are installed

### Development Tips

- Use `npm run dev` for hot reloading
- Check browser console for client-side errors
- Use Vercel logs for server-side debugging

## 📄 License

MIT License - Free for commercial and personal use.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check documentation
- Review API endpoints

---

**Built with ❤️ for retail businesses**