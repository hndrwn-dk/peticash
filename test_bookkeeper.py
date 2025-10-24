#!/usr/bin/env python3
"""
Test script for Bookkeeper Agent
"""

import sys
import os
sys.path.append('.')

from bookkeeper import BookkeeperAgent
import json

def test_bookkeeper():
    """Test all bookkeeper functionality"""
    print("=== TESTING BOOKKEEPER AGENT ===\n")
    
    agent = BookkeeperAgent()
    
    # Test 1: Import sample products
    print("1. Testing bulk import products...")
    with open('sample_products.csv', 'r') as f:
        csv_content = f.read()
    
    result = agent.products_bulk_import(csv_content)
    print(f"Import result: {result}")
    
    # Test 2: List products
    print("\n2. Testing product listing...")
    products = agent.products_list()
    print(f"Total products: {len(products)}")
    for p in products[:3]:
        print(f"  - {p['sku']}: {p['nama']}")
    
    # Test 3: Search products
    print("\n3. Testing product search...")
    search_result = agent.products_list(q="kopi")
    print(f"Search 'kopi' found {len(search_result)} products:")
    for p in search_result:
        print(f"  - {p['sku']}: {p['nama']}")
    
    # Test 4: Barcode lookup
    print("\n4. Testing barcode lookup...")
    barcode_result = agent.products_list(barcode="8991234567890")
    print(f"Barcode lookup result: {barcode_result}")
    
    # Test 5: Add new product
    print("\n5. Testing add product...")
    new_product = {
        "sku": "BISKUIT-MARIE-300G",
        "nama": "Biskuit Marie 300g",
        "default_modal_satuan_IDR": 15000,
        "default_harga_jual_SGD": 3.5,
        "kategori": "Biskuit",
        "barcode": "8991234567895"
    }
    add_result = agent.products_upsert(new_product)
    print(f"Add product result: {add_result}")
    
    # Test 6: Record transactions
    print("\n6. Testing transaction recording...")
    
    # Sample transactions for October 2025
    transactions = [
        {
            "tanggal": "2025-10-24",
            "sku": "KOPI-ARABICA-250G",
            "qty": 3,
            "modal_satuan_IDR": 45000,
            "harga_jual_SGD": 7.9,
            "fee_rate": 2.9,
            "fee_flat_SGD": 0.5,
            "biaya_lain_SGD": 0,
            "apply_gst": False,
            "gst_rate": 0.09,
            "pelanggan": "Walk-in",
            "metode_bayar": "Cash",
            "catatan": "promo hari ini"
        },
        {
            "tanggal": "2025-10-24",
            "sku": "TEH-MATCHA-100G",
            "qty": 2,
            "modal_satuan_IDR": 33000,
            "harga_jual_SGD": 8.5,
            "fee_rate": 2.9,
            "fee_flat_SGD": 0.5,
            "apply_gst": True,
            "gst_rate": 0.09,
            "pelanggan": "Regular Customer",
            "metode_bayar": "Card"
        },
        {
            "tanggal": "2025-10-25",
            "sku": "COKLAT-DARK-200G",
            "qty": 1,
            "modal_satuan_IDR": 28000,
            "harga_jual_SGD": 6.5,
            "fee_rate": 2.9,
            "fee_flat_SGD": 0.5,
            "pelanggan": "Online Order",
            "metode_bayar": "Transfer"
        }
    ]
    
    for i, tx in enumerate(transactions):
        result = agent.ledger_append(tx)
        print(f"  Transaction {i+1}: {result}")
    
    # Test 7: Generate monthly summary
    print("\n7. Testing monthly summary generation...")
    rekap_result = agent.rekap_generate("2025-10")
    if rekap_result.get('success'):
        print("Monthly Summary:")
        print(rekap_result['summary'])
    else:
        print(f"Rekap error: {rekap_result}")
    
    # Test 8: Preview data
    print("\n8. Testing data preview...")
    preview_result = agent.preview_head("2025-10", 3)
    print("Ledger preview:")
    print(preview_result.get('ledger_head', 'No ledger data'))
    print("\nRekap preview:")
    print(preview_result.get('rekap_content', 'No rekap data'))
    
    # Test 9: Natural language commands
    print("\n9. Testing natural language interface...")
    
    commands = [
        "cari 'kopi'",
        "scan barcode 8991234567891",
        "tambah barang SKU GULA-PASIR-1KG nama Gula Pasir 1kg modal 12k harga 2.8 kategori Bumbu",
        "rekap Oktober 2025"
    ]
    
    for cmd in commands:
        print(f"\nCommand: {cmd}")
        result = agent.process_command(cmd)
        if isinstance(result, dict):
            if 'results' in result:
                print(f"  Found {len(result['results'])} results")
            elif 'summary' in result:
                print("  Summary generated:")
                print("  " + result['summary'].replace('\n', '\n  '))
            else:
                print(f"  Result: {result}")
        else:
            print(f"  Result: {result}")

if __name__ == "__main__":
    test_bookkeeper()