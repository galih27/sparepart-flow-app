
"use client";

import { useState, useMemo, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, FileDown, FileUp, Pencil, Search, Trash2 } from 'lucide-react';
import type { InventoryItem, User } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, doc, updateDoc, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const { user: authUser, isLoading: isLoadingAuth } = useUser();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isLoadingUser } = useDoc<User>(userDocRef);

  const inventoryQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'inventory');
  }, [firestore]);
  
  const { data: initialData, isLoading: isLoadingInventory, refetch } = useCollection<InventoryItem>(inventoryQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (currentUser?.permissions.reportstock_edit) {
      setIsEditing(true);
    } else {
      toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk mengedit data ini.' });
    }
  };

  const handleDelete = (item: InventoryItem) => {
    if (currentUser?.permissions.reportstock_delete) {
      setSelectedItem(item);
      setIsDeleting(true);
    } else {
       toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menghapus data ini.' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem || !selectedItem.id || !firestore) return;

    try {
      await deleteDoc(doc(firestore, 'inventory', selectedItem.id));
      toast({ title: "Sukses", description: `Item ${selectedItem.part} telah dihapus.` });
      await refetch();
    } catch (error) {
       console.error("Error deleting document: ", error);
       toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus item." });
    } finally {
      setIsDeleting(false);
      setSelectedItem(null);
    }
  };

  const confirmDeleteAll = async () => {
    if (!firestore || !inventoryQuery) return;
    setIsDeletingAll(false); // Close dialog immediately
    toast({ title: "Menghapus Semua Data", description: "Proses ini mungkin memerlukan beberapa saat..." });

    try {
        const querySnapshot = await getDocs(inventoryQuery);
        const batch = writeBatch(firestore);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        toast({ title: "Sukses", description: "Semua data report stock telah dihapus." });
        await refetch();
    } catch (error) {
        console.error("Error deleting all documents: ", error);
        toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus semua data report stock." });
    }
  };


  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    toast({ title: "Mengimpor Data", description: "Mohon tunggu, file Excel sedang diproses..." });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!firestore) {
            throw new Error("Koneksi Firestore tidak tersedia.");
        }

        if (json.length > 0 && !json[0].hasOwnProperty('part')) {
            throw new Error("Format file Excel tidak sesuai. Pastikan ada kolom 'part'.");
        }

        const batch = writeBatch(firestore);
        json.forEach((row) => {
          const docRef = doc(collection(firestore, "inventory")); 
          const inventoryItem: Omit<InventoryItem, 'id'> = {
            part: row.part || '',
            deskripsi: row.deskripsi || '',
            harga_dpp: Number(row.harga_dpp) || 0,
            ppn: Number(row.ppn) || 0,
            total_harga: Number(row.total_harga) || 0,
            satuan: row.satuan || 'pcs',
            available_qty: (Number(row.qty_baik) || 0) + (Number(row.qty_rusak) || 0),
            qty_baik: Number(row.qty_baik) || 0,
            qty_rusak: Number(row.qty_rusak) || 0,
            lokasi: row.lokasi || '',
            return_to_factory: Number(row.return_to_factory) || 0,
            qty_real: (Number(row.qty_baik) || 0) + (Number(row.qty_rusak) || 0),
          };
          batch.set(docRef, inventoryItem);
        });

        await batch.commit();
        toast({ title: "Sukses", description: `${json.length} data inventaris berhasil diimpor.` });
        await refetch();

      } catch (error: any) {
        console.error("Error importing data: ", error);
        toast({ variant: "destructive", title: "Gagal Impor", description: error.message || "Terjadi kesalahan saat mengimpor data." });
      } finally {
        setIsImporting(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (!initialData || initialData.length === 0) {
      toast({ variant: 'destructive', title: 'Gagal Export', description: 'Tidak ada data untuk diexport.' });
      return;
    }
    setIsExporting(true);
    toast({ title: 'Mengekspor Data', description: 'Mohon tunggu, data sedang disiapkan...' });

    try {
      const dataToExport = initialData.map(({ id, ...item }) => item);
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Stock');
      XLSX.writeFile(workbook, 'report_stock.xlsx');
      toast({ title: 'Sukses', description: 'Data inventaris berhasil diexport.' });
    } catch (error) {
      console.error('Error exporting data: ', error);
      toast({ variant: 'destructive', title: 'Gagal Export', description: 'Terjadi kesalahan saat mengekspor data.' });
    } finally {
      setIsExporting(false);
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
      await refetch();
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui data stok." });
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  }

  const isLoading = isLoadingInventory || isLoadingAuth || isLoadingUser;
  const permissions = currentUser?.permissions;

  return (
    <>
      <PageHeader title="Report Stock">
        <div className="flex items-center gap-2">
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
            {permissions?.reportstock_edit && (
                <>
                    <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".xlsx, .xls"
                        />
                    <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
                        <FileUp className="mr-2" /> {isImporting ? 'Mengimpor...' : 'Upload Excel'}
                    </Button>
                </>
            )}
            <Button onClick={handleExport} disabled={isExporting}>
                <FileDown className="mr-2" /> {isExporting ? 'Mengekspor...' : 'Export Excel'}
            </Button>
             {permissions?.reportstock_delete && (
                <Button variant="destructive" onClick={() => setIsDeletingAll(true)} disabled={isLoading || !initialData || initialData.length === 0}>
                    <Trash2 className="mr-2" /> Hapus Semua
                </Button>
            )}
        </div>
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
                    <TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
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
                    Tidak ada data. Klik tombol 'Upload Excel' untuk mengimpor data.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex gap-0">
                        <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {permissions?.reportstock_delete && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus item <strong>{selectedItem?.part}</strong> secara permanen. Data yang dihapus tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={isDeletingAll} onOpenChange={setIsDeletingAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Report Stock?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus <strong>SEMUA</strong> item inventaris secara permanen. Data yang dihapus tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAll} className="bg-destructive hover:bg-destructive/90">Ya, Hapus Semua</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View/Edit Modal */}
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
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Batal</Button>
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
                  <span>{selectedItem.qty_rusak} {selectedItem.satuan}</span>
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
                    <Button variant="secondary">Tutup</Button>                  
                  </DialogClose>
                  {permissions?.reportstock_edit && <Button onClick={handleEdit}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    