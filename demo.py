#!/usr/bin/env python3
"""
Demo script showing complete bookkeeper workflow
"""

import sys
sys.path.append('.')

from bookkeeper import BookkeeperAgent
import json

def demo_workflow():
    """Demonstrate complete bookkeeper workflow"""
    print("🏪 DEMO BOOKKEEPER AGENT - RETAIL SALES")
    print("=" * 50)
    
    agent = BookkeeperAgent()
    
    # Step 1: Setup master products
    print("\n📦 STEP 1: Setup Master Products")
    print("-" * 30)
    
    # Add some products via natural language
    products_to_add = [
        "tambah barang SKU KOPI-LATTE-300ML nama Kopi Latte 300ml modal 15k harga 4.5 kategori Minuman",
        "tambah barang SKU ROTI-TAWAR-400G nama Roti Tawar 400g modal 8k harga 2.8 kategori Makanan",
        "tambah barang SKU SUSU-UHT-1L nama Susu UHT 1L modal 12k harga 3.2 kategori Minuman"
    ]
    
    for cmd in products_to_add:
        result = agent.process_command(cmd)
        if result.get('success'):
            print(f"✅ Added: {result['sku']}")
        else:
            print(f"❌ Failed: {result}")
    
    # Show all products
    products = agent.products_list()
    print(f"\n📋 Total products in master: {len(products)}")
    
    # Step 2: Record some transactions
    print("\n💰 STEP 2: Record Daily Transactions")
    print("-" * 35)
    
    transactions = [
        {
            "tanggal": "2025-10-24",
            "sku": "KOPI-LATTE-300ML",
            "qty": 5,
            "modal_satuan_IDR": 15000,
            "harga_jual_SGD": 4.5,
            "fee_rate": 2.9,
            "fee_flat_SGD": 0.3,
            "apply_gst": True,
            "gst_rate": 0.09,
            "pelanggan": "Morning Rush",
            "metode_bayar": "Card",
            "catatan": "Popular morning item"
        },
        {
            "tanggal": "2025-10-24",
            "sku": "ROTI-TAWAR-400G",
            "qty": 3,
            "modal_satuan_IDR": 8000,
            "harga_jual_SGD": 2.8,
            "fee_rate": 2.9,
            "fee_flat_SGD": 0.3,
            "pelanggan": "Family Customer",
            "metode_bayar": "Cash"
        },
        {
            "tanggal": "2025-10-25",
            "sku": "SUSU-UHT-1L",
            "qty": 2,
            "modal_satuan_IDR": 12000,
            "harga_jual_SGD": 3.2,
            "fee_rate": 2.9,
            "fee_flat_SGD": 0.3,
            "apply_gst": True,
            "gst_rate": 0.09,
            "pelanggan": "Regular Customer",
            "metode_bayar": "Transfer"
        },
        {
            "tanggal": "2025-10-25",
            "sku": "KOPI-LATTE-300ML",
            "qty": 8,
            "modal_satuan_IDR": 15000,
            "harga_jual_SGD": 4.5,
            "fee_rate": 2.9,
            "fee_flat_SGD": 0.3,
            "apply_gst": True,
            "gst_rate": 0.09,
            "pelanggan": "Office Order",
            "metode_bayar": "Corporate Card",
            "catatan": "Bulk office order"
        }
    ]
    
    for i, tx in enumerate(transactions, 1):
        result = agent.ledger_append(tx)
        if result.get('success'):
            # Calculate display values
            modal_total = tx['qty'] * tx['modal_satuan_IDR']
            pendapatan = tx['qty'] * tx['harga_jual_SGD']
            print(f"✅ Transaction {i}: {tx['sku']} x{tx['qty']} = IDR {modal_total:,} / SGD {pendapatan:.2f}")
        else:
            print(f"❌ Transaction {i} failed: {result}")
    
    # Step 3: Search and lookup demo
    print("\n🔍 STEP 3: Search & Lookup Demo")
    print("-" * 30)
    
    # Search products
    search_commands = [
        "cari 'kopi'",
        "cari minuman"
    ]
    
    for cmd in search_commands:
        result = agent.process_command(cmd)
        if result.get('results'):
            print(f"🔍 {cmd}: Found {len(result['results'])} products")
            for p in result['results']:
                print(f"   - {p['sku']}: {p['nama']}")
        else:
            print(f"🔍 {cmd}: {result}")
    
    # Step 4: Generate monthly report
    print("\n📊 STEP 4: Monthly Report Generation")
    print("-" * 35)
    
    rekap_result = agent.rekap_generate("2025-10")
    if rekap_result.get('success'):
        print("📈 Monthly Summary Generated:")
        print(rekap_result['summary'])
        
        # Show detailed breakdown
        data = rekap_result['rekap_data']
        print(f"\n📋 Detailed Breakdown:")
        print(f"   💰 Total Modal (Cost): IDR {data['total_modal_IDR']:,}")
        print(f"   💵 Total Sales: SGD {data['total_penjualan_SGD']:.2f}")
        print(f"   💳 Transaction Fees: SGD {data['total_biaya_transaksi_SGD']:.2f}")
        print(f"   🏛️  GST Collected: SGD {data['total_GST_SGD']:.2f}")
        print(f"   ✅ Complete Transactions: {data['transaksi_lengkap']}")
        print(f"   ❓ Incomplete Transactions: {data['transaksi_incomplete']}")
    else:
        print(f"❌ Report generation failed: {rekap_result}")
    
    # Step 5: Preview ledger data
    print("\n📄 STEP 5: Data Preview")
    print("-" * 20)
    
    preview = agent.preview_head("2025-10", 3)
    print("📋 Ledger Preview (first 3 transactions):")
    print(preview.get('ledger_head', 'No data'))
    
    # Step 6: Demonstrate file structure
    print("\n📁 STEP 6: File Structure Created")
    print("-" * 30)
    
    import os
    
    def show_tree(path, prefix="", max_depth=3, current_depth=0):
        if current_depth >= max_depth:
            return
        
        items = []
        if os.path.exists(path):
            try:
                items = sorted(os.listdir(path))
            except PermissionError:
                return
        
        for i, item in enumerate(items):
            item_path = os.path.join(path, item)
            is_last = i == len(items) - 1
            
            current_prefix = "└── " if is_last else "├── "
            print(f"{prefix}{current_prefix}{item}")
            
            if os.path.isdir(item_path) and not item.startswith('.'):
                next_prefix = prefix + ("    " if is_last else "│   ")
                show_tree(item_path, next_prefix, max_depth, current_depth + 1)
    
    print("📂 data/")
    show_tree("data", "")
    
    print(f"\n🎉 DEMO COMPLETE!")
    print(f"✅ Master products: {len(agent.products_list())} items")
    print(f"✅ October 2025 transactions recorded")
    print(f"✅ Monthly report generated")
    print(f"✅ Files saved in ./data/ directory")
    
    print(f"\n🚀 Next Steps:")
    print(f"   1. Run 'python3 bookkeeper.py' for CLI interface")
    print(f"   2. Run 'python3 transaction_helper.py' for interactive transaction entry")
    print(f"   3. Check ./data/ folder for generated CSV/JSON files")

if __name__ == "__main__":
    demo_workflow()