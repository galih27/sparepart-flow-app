import type { InventoryItem } from './definitions';

export const inventoryData: Omit<InventoryItem, 'id'>[] = Array.from({ length: 50 }, (_, i) => {
    const id = i + 1;
    const partNumber = `PN-00${id}`;
    const dpp = (Math.random() * 500000) + 50000;
    const ppn = dpp * 0.11;
    const qty_baik = Math.floor(Math.random() * 100);
    const qty_rusak = Math.floor(Math.random() * 10);
    return {
      part: partNumber,
      deskripsi: `Deskripsi untuk ${partNumber}`,
      harga_dpp: dpp,
      ppn: ppn,
      total_harga: dpp + ppn,
      satuan: 'pcs',
      available_qty: qty_baik + qty_rusak,
      qty_baik: qty_baik,
      qty_rusak: qty_rusak,
      lokasi: `Rak ${String.fromCharCode(65 + (i % 5))}-${Math.ceil((i+1)/5)}`,
      return_to_factory: Math.floor(Math.random() * 5),
      qty_real: qty_baik + qty_rusak,
    };
  });
  