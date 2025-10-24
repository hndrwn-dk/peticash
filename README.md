# Bookkeeper Agent - Pembukuan Penjualan Retail

Sistem pembukuan sederhana untuk bisnis retail kecil dengan modal dalam IDR dan penjualan dalam SGD, tanpa konversi mata uang.

## Fitur Utama

- ✅ **Master Barang**: Kelola produk dengan SKU, nama, modal default, harga jual, kategori, dan barcode
- ✅ **Pencatatan Transaksi**: Catat penjualan harian ke ledger bulanan (CSV)
- ✅ **Rekap Bulanan**: Generate ringkasan dengan total IDR (modal) dan SGD (penjualan) terpisah
- ✅ **Input Cepat**: Autocomplete, recent items, dan dukungan barcode
- ✅ **Validasi**: Status transaksi (complete/incomplete/invalid)
- ✅ **Natural Language**: Interface perintah bahasa alami

## Struktur File

```
data/
├── master/
│   └── products.json          # Master barang
└── pembukuan/
    ├── ledger_YYYY-MM.csv     # Ledger bulanan
    └── rekap_YYYY-MM.csv      # Rekap bulanan
```

## Instalasi & Penggunaan

### 1. Setup
```bash
# Clone atau download files
mkdir bookkeeper-retail
cd bookkeeper-retail

# Buat struktur direktori
mkdir -p data/master data/pembukuan
```

### 2. Import Master Barang
```bash
# Jalankan dan import sample data
python3 bookkeeper.py

> impor master barang dari CSV
# Kemudian paste isi sample_products.csv
```

### 3. Penggunaan CLI

#### Interface Utama
```bash
python3 bookkeeper.py
```

#### Helper Transaksi Interaktif
```bash
python3 transaction_helper.py
```

## Perintah Natural Language

### Manajemen Produk
```bash
# Tambah produk baru
> tambah barang SKU KOPI-ROBUSTA-250G nama Robusta 250g modal 38k harga 7.5 kategori Kopi

# Cari produk
> cari 'kopi'
> cari arabica

# Scan barcode
> scan barcode 8991234567890
```

### Pencatatan Transaksi
```bash
# Gunakan transaction helper untuk input interaktif
python3 transaction_helper.py
```

### Laporan
```bash
# Generate rekap bulanan
> rekap Oktober 2025
> rekap 2025-10

# Preview data
> preview 2025-10
```

## Format Data

### Master Barang (JSON)
```json
[
  {
    "sku": "KOPI-ARABICA-250G",
    "nama": "Kopi Arabica 250g",
    "default_modal_satuan_IDR": 45000,
    "default_harga_jual_SGD": 7.9,
    "kategori": "Kopi",
    "barcode": "8991234567890"
  }
]
```

### Ledger Transaksi (CSV)
```csv
tanggal,sku,qty,modal_satuan_IDR,modal_total_IDR,harga_jual_SGD,pendapatan_SGD,fee_rate,fee_flat_SGD,biaya_transaksi_SGD,biaya_lain_SGD,apply_gst,gst_rate,GST_SGD,pelanggan,metode_bayar,catatan,status
2025-10-24,KOPI-ARABICA-250G,3,45000,135000,7.9,23.7,2.9,0.5,1.19,0.0,False,0.09,0,Walk-in,Cash,promo,complete
```

### Rekap Bulanan (CSV)
```csv
periode,total_modal_IDR,total_penjualan_SGD,total_biaya_transaksi_SGD,total_biaya_lain_SGD,total_GST_SGD,transaksi_lengkap,transaksi_incomplete,top_sku_by_revenue
2025-10,229000,47.2,2.87,0.0,1.53,3,0,"KOPI-ARABICA-250G, TEH-MATCHA-100G, COKLAT-DARK-200G"
```

## Contoh Penggunaan

### 1. Import Produk dari CSV
```csv
sku,nama,default_modal_satuan_IDR,default_harga_jual_SGD,kategori,barcode
KOPI-ARABICA-250G,Kopi Arabica 250g,45000,7.9,Kopi,8991234567890
TEH-MATCHA-100G,Teh Matcha 100g,33000,8.5,Teh,8991234567891
```

### 2. Catat Transaksi
```python
transaksi = {
    "tanggal": "2025-10-24",
    "sku": "KOPI-ARABICA-250G",
    "qty": 3,
    "modal_satuan_IDR": 45000,
    "harga_jual_SGD": 7.9,
    "fee_rate": 2.9,
    "fee_flat_SGD": 0.5,
    "pelanggan": "Walk-in",
    "metode_bayar": "Cash"
}
```

### 3. Rekap Bulanan
```
Periode: 2025-10
Total modal: IDR 229,000
Total penjualan: SGD 47.20
Biaya transaksi: SGD 2.87 | Biaya lain: SGD 0.00 | GST: SGD 1.53
Transaksi lengkap: 3 | Incomplete/invalid: 0
Top SKU (revenue): 1) KOPI-ARABICA-250G 2) TEH-MATCHA-100G 3) COKLAT-DARK-200G
```

## Testing

```bash
# Jalankan test lengkap
python3 test_bookkeeper.py
```

## Aturan & Batasan

- ❌ **Tidak ada konversi kurs** - IDR dan SGD tetap terpisah
- ✅ **Pembulatan**: IDR ke integer, SGD ke 2 desimal
- ✅ **Persistensi**: File CSV/JSON, bukan database
- ✅ **Validasi**: Status incomplete/invalid untuk data tidak lengkap
- ✅ **Performance**: Optimized untuk input barang cepat

## API Methods

### Products
- `products_list(q="", barcode="")` - List/search products
- `products_upsert(item)` - Add/update product
- `products_bulk_import(csv_text)` - Bulk import from CSV

### Ledger
- `ledger_append(transaksi)` - Add transaction
- `rekap_generate(ym)` - Generate monthly summary
- `preview_head(ym, n=5)` - Preview data

### Natural Language
- `process_command(command)` - Process natural language commands

## Roadmap

- [ ] Web interface (Next.js)
- [ ] Barcode scanner integration
- [ ] Export to Excel
- [ ] Multi-currency support (optional)
- [ ] Inventory tracking
- [ ] Customer management

## License

MIT License - Bebas digunakan untuk keperluan komersial dan non-komersial.