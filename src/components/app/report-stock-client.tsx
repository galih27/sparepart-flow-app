"use client";

import { useState, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, FileDown, FileUp, Pencil, Search } from 'lucide-react';
import type { InventoryItem } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { inventoryData as mockInventory } from '@/lib/inventory-mock';


import PageHeader from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/app/data-table-pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from '../ui/skeleton';

const editSchema = z.object({
  qty_baik: z.coerce.number().min(0, "Kuantitas tidak boleh negatif"),
  qty_rusak: z.coerce.number().min(0, "Kuantitas tidak boleh negatif"),
});

const ITEMS_PER_PAGE = 10;

export default function ReportStockClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const inventoryQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'inventory');
  }, [firestore]);
  
  const { data: initialData, isLoading } = useCollection<InventoryItem>(inventoryQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const filteredData = useMemo(() => {
    if (!initialData) return [];
    return initialData.filter(item =>
      item.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);


  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditing(false);
    form.reset({ qty_baik: item.qty_baik, qty_rusak: item.qty_rusak });
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleImport = async () => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Gagal", description: "Koneksi Firestore tidak tersedia." });
      return;
    }
    if (initialData && initialData.length > 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Data inventaris sudah ada. Hapus data lama untuk mengimpor." });
      return;
    }
    setIsImporting(true);
    toast({ title: "Mengimpor Data", description: "Mohon tunggu, data sedang diimpor ke Firestore..." });

    try {
      const batch = writeBatch(firestore);
      mockInventory.forEach((item) => {
        const docRef = doc(collection(firestore, "inventory"));
        batch.set(docRef, item);
      });
      await batch.commit();
      toast({ title: "Sukses", description: `${mockInventory.length} data inventaris berhasil diimpor.` });
    } catch (error) {
      console.error("Error importing data: ", error);
      toast({ variant: "destructive", title: "Gagal Impor", description: "Terjadi kesalahan saat mengimpor data." });
    } finally {
      setIsImporting(false);
    }
  };

  async function onSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedItem || !selectedItem.id || !firestore) return;

    const itemRef = doc(firestore, 'inventory', selectedItem.id);
    
    try {
      await updateDoc(itemRef, {
        ...values,
        available_qty: values.qty_baik + values.qty_rusak,
        qty_real: values.qty_baik + values.qty_rusak,
      });
      toast({ title: "Sukses", description: "Data stok berhasil diperbarui." });
      setIsModalOpen(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui data stok." });
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  }

  return (
    <>
      <PageHeader title="Report Stock">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari part atau deskripsi..."
            className="w-full rounded-lg bg-background pl-8 sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <Button variant="outline" onClick={handleImport} disabled={isImporting || (initialData && initialData.length > 0)}>
          <FileUp className="mr-2" /> {isImporting ? 'Mengimpor...' : 'Import'}
        </Button>
        <Button><FileDown className="mr-2" /> Export</Button>
      </PageHeader>

      <div className="p-4 md:p-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Part</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Total Harga</TableHead>
                <TableHead>Available Qty</TableHead>
                <TableHead>Qty Baik</TableHead>
                <TableHead>Qty Rusak</TableHead>
                <TableHead>Lokasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    Tidak ada data. Klik tombol 'Import' untuk mengisi data inventaris awal.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>{item.part}</TableCell>
                    <TableCell>{item.deskripsi}</TableCell>
                    <TableCell>{formatCurrency(item.total_harga)}</TableCell>
                    <TableCell>{item.available_qty}</TableCell>
                    <TableCell>{item.qty_baik}</TableCell>
                    <TableCell>{item.qty_rusak}</TableCell>
                    <TableCell>{item.lokasi}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && paginatedData.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              canPreviousPage={currentPage > 1}
              canNextPage={currentPage < totalPages}
            />
          )}
        </div>
      </div>

      {selectedItem && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? `Edit ${selectedItem.part}` : `Detail ${selectedItem.part}`}</DialogTitle>
              <DialogDescription>{selectedItem.deskripsi}</DialogDescription>
            </DialogHeader>
            
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="qty_baik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty Baik</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="qty_rusak"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty Rusak</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Batal</Button>
                    </DialogClose>
                    <Button type="submit">Simpan Perubahan</Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
               <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground">Harga DPP</span>
                  <span>{formatCurrency(selectedItem.harga_dpp)}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground">PPN</span>
                  <span>{formatCurrency(selectedItem.ppn)}</span>
                </div>
                 <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground font-semibold">Total Harga</span>
                  <span className="font-semibold">{formatCurrency(selectedItem.total_harga)}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground">Qty Baik</span>
                  <span>{selectedItem.qty_baik} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground">Qty Rusak</span>
                  <span>{selectedSistem.qty_rusak} {selectedItem.satuan}</span>
                </div>
                 <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground">Qty Real</span>
                  <span>{selectedItem.qty_real} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground">Return to Factory</span>
                  <span>{selectedItem.return_to_factory} {selectedItem.satuan}</span>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Close</Button>
                  </DialogClose>
                  <Button onClick={handleEdit}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
