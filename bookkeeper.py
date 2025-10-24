#!/usr/bin/env python3
"""
Bookkeeper Agent for Retail Sales
IDR modal / SGD jual, Tanpa Konversi, Input Barang Cepat

Peran: Membantu pembukuan penjualan sederhana untuk bisnis retail kecil
- Modal dicatat dalam IDR, penjualan dalam SGD, tanpa konversi kurs
- Simpan data di file CSV/JSON (bukan database)
- Optimalkan kecepatan input barang (autocomplete, recent items, barcode)
"""

import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Optional, Any
import re
from decimal import Decimal, ROUND_HALF_UP

class BookkeeperAgent:
    def __init__(self, storage_prefix: str = "./data"):
        self.storage_prefix = storage_prefix
        self.master_dir = os.path.join(storage_prefix, "master")
        self.ledger_dir = os.path.join(storage_prefix, "pembukuan")
        self.products_file = os.path.join(self.master_dir, "products.json")
        self.max_recent = 5
        self.rekap_top_n = 3
        
        # Ensure directories exist
        os.makedirs(self.master_dir, exist_ok=True)
        os.makedirs(self.ledger_dir, exist_ok=True)
    
    def _round_idr(self, value: float) -> int:
        """Round IDR to integer"""
        return int(Decimal(str(value)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    
    def _round_sgd(self, value: float) -> float:
        """Round SGD to 2 decimal places"""
        return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
    def _validate_date(self, date_str: str) -> bool:
        """Validate date format YYYY-MM-DD"""
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return True
        except ValueError:
            return False
    
    def _get_ledger_path(self, ym: str) -> str:
        """Get ledger file path for YYYY-MM"""
        return os.path.join(self.ledger_dir, f"ledger_{ym}.csv")
    
    def _get_rekap_path(self, ym: str) -> str:
        """Get rekap file path for YYYY-MM"""
        return os.path.join(self.ledger_dir, f"rekap_{ym}.csv")
    
    # PRODUCTS MANAGEMENT
    def products_list(self, q: str = "", barcode: str = "") -> List[Dict]:
        """
        Baca products.json dengan filter keyword atau barcode lookup
        """
        if not os.path.exists(self.products_file):
            return []
        
        try:
            with open(self.products_file, 'r', encoding='utf-8') as f:
                products = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
        
        if barcode:
            # Exact barcode match
            return [p for p in products if p.get('barcode') == barcode]
        
        if q:
            # Filter by keyword in sku, nama, or kategori
            q_lower = q.lower()
            filtered = []
            for p in products:
                if (q_lower in p.get('sku', '').lower() or 
                    q_lower in p.get('nama', '').lower() or 
                    q_lower in p.get('kategori', '').lower()):
                    filtered.append(p)
            return filtered
        
        return products
    
    def products_upsert(self, item: Dict) -> Dict:
        """
        Tambah/update 1 produk berdasarkan sku
        """
        if 'sku' not in item or not item['sku']:
            return {"error": "SKU wajib diisi"}
        
        if 'nama' not in item or not item['nama']:
            return {"error": "Nama wajib diisi"}
        
        # Load existing products
        products = self.products_list()
        
        # Find existing product by SKU
        existing_idx = None
        for i, p in enumerate(products):
            if p['sku'] == item['sku']:
                existing_idx = i
                break
        
        # Prepare product data
        product = {
            'sku': item['sku'],
            'nama': item['nama'],
            'default_modal_satuan_IDR': item.get('default_modal_satuan_IDR'),
            'default_harga_jual_SGD': item.get('default_harga_jual_SGD'),
            'kategori': item.get('kategori', ''),
            'barcode': item.get('barcode', '')
        }
        
        # Update or append
        if existing_idx is not None:
            products[existing_idx] = product
            action = "updated"
        else:
            products.append(product)
            action = "added"
        
        # Sort by SKU alphabetically
        products.sort(key=lambda x: x['sku'])
        
        # Save to file
        try:
            with open(self.products_file, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2, ensure_ascii=False)
            return {"success": True, "action": action, "sku": item['sku']}
        except Exception as e:
            return {"error": f"Gagal menyimpan: {str(e)}"}
    
    def products_bulk_import(self, csv_text: str) -> Dict:
        """
        Import produk dari CSV text
        Header: sku,nama,default_modal_satuan_IDR,default_harga_jual_SGD,kategori,barcode
        """
        try:
            lines = csv_text.strip().split('\n')
            if len(lines) < 2:
                return {"error": "CSV harus memiliki header dan minimal 1 baris data"}
            
            reader = csv.DictReader(lines)
            imported = 0
            errors = []
            
            for row_num, row in enumerate(reader, 2):
                if not row.get('sku') or not row.get('nama'):
                    errors.append(f"Baris {row_num}: SKU dan nama wajib diisi")
                    continue
                
                # Convert numeric fields
                item = {
                    'sku': row['sku'].strip(),
                    'nama': row['nama'].strip(),
                    'kategori': row.get('kategori', '').strip(),
                    'barcode': row.get('barcode', '').strip()
                }
                
                # Handle numeric fields
                if row.get('default_modal_satuan_IDR'):
                    try:
                        item['default_modal_satuan_IDR'] = int(float(row['default_modal_satuan_IDR']))
                    except ValueError:
                        errors.append(f"Baris {row_num}: default_modal_satuan_IDR harus angka")
                        continue
                
                if row.get('default_harga_jual_SGD'):
                    try:
                        item['default_harga_jual_SGD'] = float(row['default_harga_jual_SGD'])
                    except ValueError:
                        errors.append(f"Baris {row_num}: default_harga_jual_SGD harus angka")
                        continue
                
                result = self.products_upsert(item)
                if result.get('success'):
                    imported += 1
                else:
                    errors.append(f"Baris {row_num}: {result.get('error')}")
            
            return {
                "success": True,
                "imported": imported,
                "errors": errors
            }
            
        except Exception as e:
            return {"error": f"Gagal memproses CSV: {str(e)}"}
    
    # LEDGER MANAGEMENT
    def ledger_append(self, transaksi: Dict) -> Dict:
        """
        Tambahkan transaksi ke ledger bulanan
        """
        # Validate required fields
        if not transaksi.get('tanggal'):
            return {"error": "Tanggal wajib diisi"}
        
        if not self._validate_date(transaksi['tanggal']):
            return {"error": "Format tanggal harus YYYY-MM-DD"}
        
        if not transaksi.get('sku'):
            return {"error": "SKU wajib diisi"}
        
        qty = transaksi.get('qty', 0)
        if qty <= 0:
            return {"error": "Qty harus > 0", "status": "invalid"}
        
        harga_jual_sgd = transaksi.get('harga_jual_SGD')
        if not harga_jual_sgd or harga_jual_sgd <= 0:
            return {"error": "Harga jual SGD wajib diisi dan > 0"}
        
        # Check modal
        modal_satuan_idr = transaksi.get('modal_satuan_IDR')
        modal_total_idr = transaksi.get('modal_total_IDR')
        
        if not modal_satuan_idr and not modal_total_idr:
            return {"error": "Modal satuan IDR atau modal total IDR wajib diisi", "status": "incomplete"}
        
        # Calculate derived fields
        status = "complete"
        
        # Calculate modal_total_IDR if not provided
        if not modal_total_idr and modal_satuan_idr:
            modal_total_idr = self._round_idr(qty * modal_satuan_idr)
        elif modal_total_idr:
            modal_total_idr = self._round_idr(modal_total_idr)
        
        if modal_satuan_idr:
            modal_satuan_idr = self._round_idr(modal_satuan_idr)
        
        # Calculate pendapatan_SGD
        pendapatan_sgd = self._round_sgd(qty * harga_jual_sgd)
        
        # Calculate biaya_transaksi_SGD
        fee_rate = transaksi.get('fee_rate', 0) / 100  # Convert percentage
        fee_flat_sgd = transaksi.get('fee_flat_SGD', 0)
        biaya_transaksi_sgd = self._round_sgd((fee_rate * pendapatan_sgd) + fee_flat_sgd)
        
        # Calculate GST
        apply_gst = transaksi.get('apply_gst', False)
        gst_rate = transaksi.get('gst_rate', 0.09)
        gst_sgd = self._round_sgd(pendapatan_sgd * gst_rate) if apply_gst else 0
        
        # Prepare row data
        row_data = {
            'tanggal': transaksi['tanggal'],
            'sku': transaksi['sku'],
            'qty': qty,
            'modal_satuan_IDR': modal_satuan_idr or '',
            'modal_total_IDR': modal_total_idr or '',
            'harga_jual_SGD': self._round_sgd(harga_jual_sgd),
            'pendapatan_SGD': pendapatan_sgd,
            'fee_rate': transaksi.get('fee_rate', ''),
            'fee_flat_SGD': fee_flat_sgd,
            'biaya_transaksi_SGD': biaya_transaksi_sgd,
            'biaya_lain_SGD': self._round_sgd(transaksi.get('biaya_lain_SGD', 0)),
            'apply_gst': apply_gst,
            'gst_rate': gst_rate,
            'GST_SGD': gst_sgd,
            'pelanggan': transaksi.get('pelanggan', ''),
            'metode_bayar': transaksi.get('metode_bayar', ''),
            'catatan': transaksi.get('catatan', '').replace('\n', ' ').strip(),
            'status': status
        }
        
        # Get target file
        ym = transaksi['tanggal'][:7]  # YYYY-MM
        ledger_path = self._get_ledger_path(ym)
        
        # Check if file exists, create with header if not
        file_exists = os.path.exists(ledger_path)
        
        try:
            with open(ledger_path, 'a', newline='', encoding='utf-8') as f:
                fieldnames = [
                    'tanggal', 'sku', 'qty', 'modal_satuan_IDR', 'modal_total_IDR',
                    'harga_jual_SGD', 'pendapatan_SGD', 'fee_rate', 'fee_flat_SGD',
                    'biaya_transaksi_SGD', 'biaya_lain_SGD', 'apply_gst', 'gst_rate',
                    'GST_SGD', 'pelanggan', 'metode_bayar', 'catatan', 'status'
                ]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                
                if not file_exists:
                    writer.writeheader()
                
                writer.writerow(row_data)
            
            return {"success": True, "ym": ym, "status": status}
            
        except Exception as e:
            return {"error": f"Gagal menyimpan transaksi: {str(e)}"}
    
    # REKAP GENERATION
    def rekap_generate(self, ym: str) -> Dict:
        """
        Generate monthly summary for YYYY-MM
        """
        ledger_path = self._get_ledger_path(ym)
        
        if not os.path.exists(ledger_path):
            return {"error": f"Ledger untuk {ym} tidak ditemukan"}
        
        try:
            # Read ledger data
            with open(ledger_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                transactions = list(reader)
            
            if not transactions:
                return {"error": f"Tidak ada transaksi di {ym}"}
            
            # Initialize totals
            total_modal_idr = 0
            total_penjualan_sgd = 0
            total_biaya_transaksi_sgd = 0
            total_biaya_lain_sgd = 0
            total_gst_sgd = 0
            transaksi_lengkap = 0
            transaksi_incomplete = 0
            
            # SKU revenue tracking
            sku_revenue = {}
            
            # Process transactions
            for tx in transactions:
                status = tx.get('status', 'complete')
                
                if status == 'complete':
                    transaksi_lengkap += 1
                else:
                    transaksi_incomplete += 1
                
                # Add to totals (even incomplete ones for partial data)
                try:
                    if tx.get('modal_total_IDR'):
                        total_modal_idr += int(float(tx['modal_total_IDR']))
                    
                    if tx.get('pendapatan_SGD'):
                        penjualan = float(tx['pendapatan_SGD'])
                        total_penjualan_sgd += penjualan
                        
                        # Track SKU revenue
                        sku = tx.get('sku', '')
                        if sku:
                            sku_revenue[sku] = sku_revenue.get(sku, 0) + penjualan
                    
                    if tx.get('biaya_transaksi_SGD'):
                        total_biaya_transaksi_sgd += float(tx['biaya_transaksi_SGD'])
                    
                    if tx.get('biaya_lain_SGD'):
                        total_biaya_lain_sgd += float(tx['biaya_lain_SGD'])
                    
                    if tx.get('GST_SGD'):
                        total_gst_sgd += float(tx['GST_SGD'])
                        
                except (ValueError, TypeError):
                    continue
            
            # Round totals
            total_modal_idr = self._round_idr(total_modal_idr)
            total_penjualan_sgd = self._round_sgd(total_penjualan_sgd)
            total_biaya_transaksi_sgd = self._round_sgd(total_biaya_transaksi_sgd)
            total_biaya_lain_sgd = self._round_sgd(total_biaya_lain_sgd)
            total_gst_sgd = self._round_sgd(total_gst_sgd)
            
            # Get top SKUs by revenue
            top_skus = sorted(sku_revenue.items(), key=lambda x: x[1], reverse=True)[:self.rekap_top_n]
            top_sku_by_revenue = ', '.join([f"{sku}" for sku, _ in top_skus])
            
            # Prepare rekap data
            rekap_data = {
                'periode': ym,
                'total_modal_IDR': total_modal_idr,
                'total_penjualan_SGD': total_penjualan_sgd,
                'total_biaya_transaksi_SGD': total_biaya_transaksi_sgd,
                'total_biaya_lain_SGD': total_biaya_lain_sgd,
                'total_GST_SGD': total_gst_sgd,
                'transaksi_lengkap': transaksi_lengkap,
                'transaksi_incomplete': transaksi_incomplete,
                'top_sku_by_revenue': top_sku_by_revenue
            }
            
            # Save rekap CSV
            rekap_path = self._get_rekap_path(ym)
            with open(rekap_path, 'w', newline='', encoding='utf-8') as f:
                fieldnames = [
                    'periode', 'total_modal_IDR', 'total_penjualan_SGD',
                    'total_biaya_transaksi_SGD', 'total_biaya_lain_SGD', 'total_GST_SGD',
                    'transaksi_lengkap', 'transaksi_incomplete', 'top_sku_by_revenue'
                ]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerow(rekap_data)
            
            # Generate summary text
            summary_lines = [
                f"Periode: {ym}",
                f"Total modal: IDR {total_modal_idr:,}",
                f"Total penjualan: SGD {total_penjualan_sgd:,.2f}",
                f"Biaya transaksi: SGD {total_biaya_transaksi_sgd:,.2f} | Biaya lain: SGD {total_biaya_lain_sgd:,.2f} | GST: SGD {total_gst_sgd:,.2f}",
                f"Transaksi lengkap: {transaksi_lengkap} | Incomplete/invalid: {transaksi_incomplete}",
                f"Top SKU (revenue): {' | '.join([f'{i+1}) {sku}' for i, (sku, _) in enumerate(top_skus)])}"
            ]
            
            return {
                "success": True,
                "rekap_data": rekap_data,
                "summary": '\n'.join(summary_lines),
                "rekap_path": rekap_path
            }
            
        except Exception as e:
            return {"error": f"Gagal generate rekap: {str(e)}"}
    
    def preview_head(self, ym: str, n: int = 5) -> Dict:
        """
        Tampilkan n baris pertama ledger dan rekap
        """
        ledger_path = self._get_ledger_path(ym)
        rekap_path = self._get_rekap_path(ym)
        
        result = {"ym": ym}
        
        # Read ledger head
        if os.path.exists(ledger_path):
            try:
                with open(ledger_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    result["ledger_head"] = ''.join(lines[:n+1])  # +1 for header
            except Exception as e:
                result["ledger_error"] = str(e)
        else:
            result["ledger_head"] = f"Ledger {ym} tidak ditemukan"
        
        # Read rekap
        if os.path.exists(rekap_path):
            try:
                with open(rekap_path, 'r', encoding='utf-8') as f:
                    result["rekap_content"] = f.read()
            except Exception as e:
                result["rekap_error"] = str(e)
        else:
            result["rekap_content"] = f"Rekap {ym} belum dibuat"
        
        return result

    # NATURAL LANGUAGE INTERFACE
    def process_command(self, command: str) -> Dict:
        """
        Process natural language commands
        """
        command = command.strip().lower()
        
        # Product management commands
        if command.startswith("tambah barang") or command.startswith("add product"):
            return self._parse_add_product(command)
        
        elif command.startswith("impor") and "csv" in command:
            return {"action": "bulk_import", "message": "Silakan berikan teks CSV untuk diimpor"}
        
        elif command.startswith("cari") or command.startswith("search"):
            query = self._extract_search_query(command)
            products = self.products_list(q=query)
            return {"action": "search_products", "results": products, "query": query}
        
        elif command.startswith("scan") and "barcode" in command:
            barcode = self._extract_barcode(command)
            if barcode:
                products = self.products_list(barcode=barcode)
                return {"action": "barcode_lookup", "results": products, "barcode": barcode}
            return {"error": "Barcode tidak ditemukan dalam perintah"}
        
        # Transaction commands
        elif command.startswith("catat") or command.startswith("record"):
            return {"action": "record_transaction", "message": "Silakan berikan detail transaksi"}
        
        # Report commands
        elif command.startswith("rekap"):
            ym = self._extract_period(command)
            if ym:
                return self.rekap_generate(ym)
            return {"error": "Periode tidak ditemukan. Format: rekap YYYY-MM atau rekap Bulan YYYY"}
        
        elif command.startswith("preview") or command.startswith("lihat"):
            ym = self._extract_period(command)
            if ym:
                return self.preview_head(ym)
            return {"error": "Periode tidak ditemukan"}
        
        else:
            return {
                "error": "Perintah tidak dikenali",
                "available_commands": [
                    "tambah barang SKU ... nama ... modal ... harga ... kategori ...",
                    "impor master barang dari CSV",
                    "cari barang 'keyword'",
                    "scan barcode 123456789",
                    "catat penjualan ...",
                    "rekap Oktober 2025",
                    "preview 2025-10"
                ]
            }
    
    def _parse_add_product(self, command: str) -> Dict:
        """Parse add product command"""
        # Extract SKU
        sku_match = re.search(r'sku\s+([A-Z0-9\-]+)', command, re.IGNORECASE)
        if not sku_match:
            return {"error": "SKU tidak ditemukan"}
        
        sku = sku_match.group(1)
        
        # Extract nama - more flexible pattern
        nama_match = re.search(r'nama\s+([^0-9]+?)(?:\s+modal|\s+harga|\s+kategori|$)', command, re.IGNORECASE)
        if not nama_match:
            # Try alternative pattern
            nama_match = re.search(r'sku\s+[A-Z0-9\-]+\s+nama\s+(.+?)(?:\s+modal|\s+harga|\s+kategori|$)', command, re.IGNORECASE)
        
        if not nama_match:
            return {"error": "Nama tidak ditemukan"}
        
        nama = nama_match.group(1).strip()
        
        # Extract modal
        modal_match = re.search(r'modal\s+(\d+k?)', command, re.IGNORECASE)
        modal = None
        if modal_match:
            modal_str = modal_match.group(1)
            if modal_str.endswith('k'):
                modal = int(modal_str[:-1]) * 1000
            else:
                modal = int(modal_str)
        
        # Extract harga
        harga_match = re.search(r'harga\s+([\d.]+)', command, re.IGNORECASE)
        harga = None
        if harga_match:
            harga = float(harga_match.group(1))
        
        # Extract kategori
        kategori_match = re.search(r'kategori\s+([^0-9]+?)(?:\s+|$)', command, re.IGNORECASE)
        kategori = kategori_match.group(1).strip() if kategori_match else ""
        
        # Create product
        item = {
            "sku": sku,
            "nama": nama,
            "kategori": kategori
        }
        
        if modal:
            item["default_modal_satuan_IDR"] = modal
        if harga:
            item["default_harga_jual_SGD"] = harga
        
        return self.products_upsert(item)
    
    def _extract_search_query(self, command: str) -> str:
        """Extract search query from command"""
        # Look for quoted strings first
        quote_match = re.search(r"['\"]([^'\"]+)['\"]", command)
        if quote_match:
            return quote_match.group(1)
        
        # Look for word after "cari" or "search"
        word_match = re.search(r'(?:cari|search)\s+(\w+)', command, re.IGNORECASE)
        if word_match:
            return word_match.group(1)
        
        return ""
    
    def _extract_barcode(self, command: str) -> str:
        """Extract barcode from command"""
        barcode_match = re.search(r'(?:barcode|kode)\s+(\d+)', command, re.IGNORECASE)
        return barcode_match.group(1) if barcode_match else ""
    
    def _extract_period(self, command: str) -> str:
        """Extract period YYYY-MM from command"""
        # Direct YYYY-MM format
        period_match = re.search(r'(\d{4}-\d{2})', command)
        if period_match:
            return period_match.group(1)
        
        # Month name and year
        month_map = {
            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
            'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
            'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
        }
        
        for month_name, month_num in month_map.items():
            if month_name in command.lower():
                year_match = re.search(r'(\d{4})', command)
                if year_match:
                    return f"{year_match.group(1)}-{month_num}"
        
        return ""


def main():
    """Main CLI interface"""
    agent = BookkeeperAgent()
    
    print("=== BOOKKEEPER AGENT ===")
    print("Pembukuan Penjualan (IDR modal / SGD jual)")
    print("Ketik 'help' untuk bantuan, 'exit' untuk keluar\n")
    
    while True:
        try:
            command = input("> ").strip()
            
            if command.lower() in ['exit', 'quit', 'keluar']:
                print("Terima kasih!")
                break
            
            elif command.lower() == 'help':
                print("""
Perintah yang tersedia:
1. Tambah barang: tambah barang SKU KOPI-001 nama Kopi Arabica modal 45k harga 7.9 kategori Kopi
2. Cari barang: cari 'kopi' atau cari arabica
3. Scan barcode: scan barcode 1234567890
4. Rekap bulanan: rekap Oktober 2025 atau rekap 2025-10
5. Preview data: preview 2025-10
6. Import CSV: impor master barang dari CSV
                """)
                continue
            
            elif not command:
                continue
            
            # Process command
            result = agent.process_command(command)
            
            # Display result
            if result.get('error'):
                print(f"❌ Error: {result['error']}")
            elif result.get('success'):
                if 'summary' in result:
                    print("✅ Rekap berhasil dibuat:")
                    print(result['summary'])
                else:
                    print(f"✅ {result}")
            else:
                print(f"📋 {result}")
            
            print()
            
        except KeyboardInterrupt:
            print("\nTerima kasih!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()