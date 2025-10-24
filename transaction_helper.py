#!/usr/bin/env python3
"""
Transaction Helper - Interactive transaction recording
"""

import sys
sys.path.append('.')

from bookkeeper import BookkeeperAgent
from datetime import datetime
import json

class TransactionHelper:
    def __init__(self):
        self.agent = BookkeeperAgent()
    
    def interactive_transaction(self):
        """Interactive transaction recording with autocomplete"""
        print("=== CATAT TRANSAKSI BARU ===\n")
        
        # Get date
        today = datetime.now().strftime('%Y-%m-%d')
        tanggal = input(f"Tanggal [{today}]: ").strip() or today
        
        # Product selection with autocomplete
        print("\nPilih produk:")
        sku = self.select_product()
        if not sku:
            return
        
        # Get product details for prefill
        products = self.agent.products_list(q=sku)
        product = None
        if products:
            for p in products:
                if p['sku'] == sku:
                    product = p
                    break
        
        if product:
            print(f"Produk dipilih: {product['nama']}")
            default_modal = product.get('default_modal_satuan_IDR', '')
            default_harga = product.get('default_harga_jual_SGD', '')
        else:
            print(f"SKU: {sku} (produk baru)")
            default_modal = ''
            default_harga = ''
        
        # Get quantity
        while True:
            try:
                qty = int(input("Quantity: "))
                if qty > 0:
                    break
                print("Quantity harus > 0")
            except ValueError:
                print("Masukkan angka yang valid")
        
        # Get modal
        modal_input = input(f"Modal satuan IDR [{default_modal}]: ").strip()
        if modal_input:
            try:
                modal_satuan_idr = int(modal_input.replace('k', '000').replace('K', '000'))
            except ValueError:
                print("Modal tidak valid, menggunakan default")
                modal_satuan_idr = default_modal
        else:
            modal_satuan_idr = default_modal
        
        # Get harga jual
        harga_input = input(f"Harga jual SGD [{default_harga}]: ").strip()
        if harga_input:
            try:
                harga_jual_sgd = float(harga_input)
            except ValueError:
                print("Harga tidak valid, menggunakan default")
                harga_jual_sgd = default_harga
        else:
            harga_jual_sgd = default_harga
        
        # Optional fields
        fee_rate = input("Fee rate % [2.9]: ").strip() or "2.9"
        fee_flat = input("Fee flat SGD [0.5]: ").strip() or "0.5"
        biaya_lain = input("Biaya lain SGD [0]: ").strip() or "0"
        
        apply_gst_input = input("Apply GST? (y/n) [n]: ").strip().lower()
        apply_gst = apply_gst_input in ['y', 'yes', 'ya']
        
        gst_rate = "0.09"
        if apply_gst:
            gst_rate = input("GST rate [0.09]: ").strip() or "0.09"
        
        pelanggan = input("Pelanggan [Walk-in]: ").strip() or "Walk-in"
        metode_bayar = input("Metode bayar [Cash]: ").strip() or "Cash"
        catatan = input("Catatan: ").strip()
        
        # Prepare transaction
        transaksi = {
            "tanggal": tanggal,
            "sku": sku,
            "qty": qty,
            "modal_satuan_IDR": int(modal_satuan_idr) if modal_satuan_idr else None,
            "harga_jual_SGD": float(harga_jual_sgd) if harga_jual_sgd else None,
            "fee_rate": float(fee_rate),
            "fee_flat_SGD": float(fee_flat),
            "biaya_lain_SGD": float(biaya_lain),
            "apply_gst": apply_gst,
            "gst_rate": float(gst_rate),
            "pelanggan": pelanggan,
            "metode_bayar": metode_bayar,
            "catatan": catatan
        }
        
        # Show preview
        print("\n=== PREVIEW TRANSAKSI ===")
        print(json.dumps(transaksi, indent=2, ensure_ascii=False))
        
        confirm = input("\nSimpan transaksi? (y/n): ").strip().lower()
        if confirm in ['y', 'yes', 'ya']:
            result = self.agent.ledger_append(transaksi)
            if result.get('success'):
                print("✅ Transaksi berhasil disimpan!")
                
                # Calculate totals for display
                modal_total = qty * (modal_satuan_idr or 0)
                pendapatan = qty * (harga_jual_sgd or 0)
                
                print(f"Modal total: IDR {modal_total:,}")
                print(f"Pendapatan: SGD {pendapatan:.2f}")
            else:
                print(f"❌ Error: {result.get('error')}")
        else:
            print("Transaksi dibatalkan")
    
    def select_product(self):
        """Product selection with search"""
        while True:
            query = input("Cari produk (ketik SKU/nama/scan barcode): ").strip()
            
            if not query:
                continue
            
            # Check if it's a barcode (all digits)
            if query.isdigit() and len(query) >= 8:
                products = self.agent.products_list(barcode=query)
                if products:
                    return products[0]['sku']
                else:
                    print("Barcode tidak ditemukan")
                    continue
            
            # Search by keyword
            products = self.agent.products_list(q=query)
            
            if not products:
                print("Produk tidak ditemukan")
                add_new = input("Tambah produk baru? (y/n): ").strip().lower()
                if add_new in ['y', 'yes', 'ya']:
                    return self.add_quick_product(query)
                continue
            
            if len(products) == 1:
                return products[0]['sku']
            
            # Multiple results - show selection
            print(f"\nDitemukan {len(products)} produk:")
            for i, p in enumerate(products):
                modal = f"IDR {p.get('default_modal_satuan_IDR', 0):,}" if p.get('default_modal_satuan_IDR') else "No modal"
                harga = f"SGD {p.get('default_harga_jual_SGD', 0):.2f}" if p.get('default_harga_jual_SGD') else "No price"
                print(f"{i+1}. {p['sku']} - {p['nama']} ({modal} / {harga})")
            
            try:
                choice = int(input("Pilih nomor (0 untuk cari lagi): "))
                if choice == 0:
                    continue
                if 1 <= choice <= len(products):
                    return products[choice-1]['sku']
                print("Pilihan tidak valid")
            except ValueError:
                print("Masukkan angka yang valid")
    
    def add_quick_product(self, initial_query):
        """Quick add new product"""
        print(f"\n=== TAMBAH PRODUK BARU ===")
        
        sku = input(f"SKU [{initial_query.upper()}]: ").strip() or initial_query.upper()
        nama = input("Nama produk: ").strip()
        
        if not nama:
            print("Nama produk wajib diisi")
            return None
        
        kategori = input("Kategori: ").strip()
        
        modal_input = input("Modal satuan IDR (opsional): ").strip()
        modal = None
        if modal_input:
            try:
                modal = int(modal_input.replace('k', '000').replace('K', '000'))
            except ValueError:
                pass
        
        harga_input = input("Harga jual SGD (opsional): ").strip()
        harga = None
        if harga_input:
            try:
                harga = float(harga_input)
            except ValueError:
                pass
        
        barcode = input("Barcode (opsional): ").strip()
        
        # Create product
        product = {
            "sku": sku,
            "nama": nama,
            "kategori": kategori
        }
        
        if modal:
            product["default_modal_satuan_IDR"] = modal
        if harga:
            product["default_harga_jual_SGD"] = harga
        if barcode:
            product["barcode"] = barcode
        
        result = self.agent.products_upsert(product)
        if result.get('success'):
            print(f"✅ Produk {sku} berhasil ditambahkan!")
            return sku
        else:
            print(f"❌ Error: {result.get('error')}")
            return None

def main():
    helper = TransactionHelper()
    
    while True:
        print("\n=== TRANSACTION HELPER ===")
        print("1. Catat transaksi baru")
        print("2. Keluar")
        
        choice = input("Pilih menu: ").strip()
        
        if choice == "1":
            helper.interactive_transaction()
        elif choice == "2":
            break
        else:
            print("Pilihan tidak valid")

if __name__ == "__main__":
    main()