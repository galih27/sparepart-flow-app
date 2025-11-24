
"use client";

import { useState, useMemo, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, FileDown, FileUp, Pencil, Search, Trash2, MoreVertical, Plus } from 'lucide-react';
import type { InventoryItem, User } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, doc, updateDoc, writeBatch, deleteDoc, getDocs, addDoc, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const addSchema = z.object({
  part: z.string().min(1, "Part wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  harga_dpp: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  ppn: z.coerce.number().min(0, "PPN tidak boleh negatif"),
  satuan: z.string().min(1, "Satuan wajib diisi"),
  qty_baik: z.coerce.number().min(0, "Qty Baik tidak boleh negatif"),
  qty_rusak: z.coerce.number().min(0, "Qty Rusak tidak boleh negatif"),
  lokasi: z.string().min(1, "Lokasi wajib diisi"),
  return_to_factory: z.enum(['YES', 'NO']),
});

const editSchema = z.object({
  qty_baik: z.coerce.number().min(0, "Kuantitas tidak boleh negatif"),
  qty_rusak: z.coerce.number().min(0, "Kuantitas tidak boleh negatif"),
  lokasi: z.string().min(1, "Lokasi tidak boleh kosong"),
  return_to_factory: z.enum(['YES', 'NO']),
});

const ITEMS_PER_PAGE = 10;

// Helper function to parse numbers from Excel more reliably
const parseNumber = (value: any): number => {
  if (typeof value === 'number') {
    return isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9,.-]+/g, '').replace(',', '.'));
    return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
  }
  return 0;
};


export default function ReportStockClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isLoading: isLoadingAuth } = useUser();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser?.uid) return null;
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addForm = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      part: "",
      deskripsi: "",
      harga_dpp: 0,
      ppn: 0,
      satuan: "pcs",
      qty_baik: 0,
      qty_rusak: 0,
      lokasi: "",
      return_to_factory: "NO",
    }
  });

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const filteredData = useMemo(() => {
    if (!initialData) return [];
    return initialData.filter(item =>
      item.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialData, searchTerm]);

  const totalSelisihNilai = useMemo(() => {
    if (!filteredData) return 0;
    return filteredData.reduce((total, item) => {
      const selisihQty = item.qty_real - item.available_qty;
      if (selisihQty !== 0) {
        return total + (item.total_harga * selisihQty);
      }
      return total;
    }, 0);
  }, [filteredData]);


  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);


  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditing(false);
    editForm.reset({ 
      qty_baik: item.qty_baik, 
      qty_rusak: item.qty_rusak,
      lokasi: item.lokasi,
      return_to_factory: item.return_to_factory === 'YES' ? 'YES' : 'NO',
     });
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (currentUser?.permissions.reportstock_edit) {
      setIsEditing(true);
    } else {
      toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk mengedit data ini.' });
    }
  };

  const handleDelete = () => {
    if (currentUser?.permissions.reportstock_delete) {
      setIsModalOpen(false); // Close the view/edit modal
      setIsDeleting(true); // Open the delete confirmation dialog
    } else {
       toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menghapus data ini.' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem || !selectedItem.id || !firestore) return;
    const itemRef = doc(firestore, 'inventory', selectedItem.id);

    deleteDoc(itemRef)
      .then(async () => {
        toast({ title: "Sukses", description: `Item ${selectedItem.part} telah dihapus.` });
        await refetch();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: itemRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsDeleting(false);
        setSelectedItem(null);
      });
  };

  const confirmDeleteAll = async () => {
    if (!firestore || !inventoryQuery) return;
    setIsDeletingAll(false);
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
        const permissionError = new FirestorePermissionError({
          path: 'inventory',
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
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
        if (!firestore || !inventoryQuery) {
          throw new Error("Koneksi Firestore tidak tersedia.");
        }

        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        const dataRows = json.slice(1);
        if (dataRows.length === 0) {
          throw new Error("File Excel tidak berisi data.");
        }

        toast({ description: "Memvalidasi data dan membandingkan dengan stok saat ini..." });

        const existingInventorySnapshot = await getDocs(inventoryQuery);
        const existingInventoryMap = new Map<string, InventoryItem>();
        existingInventorySnapshot.forEach(doc => {
            const item = { id: doc.id, ...doc.data() } as InventoryItem;
            existingInventoryMap.set(String(item.part).toLowerCase(), item);
        });

        const batch = writeBatch(firestore);
        let updatedCount = 0;
        let newCount = 0;

        dataRows.forEach((row) => {
          if (!row || row.length === 0 || !row[0]) return;
          
          // Map columns by order as requested
          const part = String(row[0] || '').trim();
          if (!part) return;

          const deskripsi = String(row[1] || '');
          const harga_dpp = parseNumber(row[2]);
          const ppn = parseNumber(row[3]);
          const total_harga = parseNumber(row[4]);
          const satuan = String(row[5] || 'pcs');
          const available_qty = parseNumber(row[6]); // This is now the source of truth from Excel
          const qty_baik = parseNumber(row[7]);
          const qty_rusak = parseNumber(row[8]);
          const lokasi = String(row[9] || '');
          const return_to_factory_raw = String(row[10] || 'NO').toUpperCase();
          const return_to_factory = return_to_factory_raw === 'YES' ? 'YES' : 'NO';
          const qty_real = qty_baik + qty_rusak;


          const existingItem = existingInventoryMap.get(part.toLowerCase());
          
          if (existingItem?.id) {
            // Item exists, update it
            const docRef = doc(firestore, "inventory", existingItem.id);
            const updateData: Partial<InventoryItem> = {
                deskripsi: deskripsi,
                harga_dpp: harga_dpp,
                ppn: ppn,
                total_harga: total_harga,
                satuan: satuan,
                available_qty: available_qty, // Overwrite with value from Excel
                qty_baik: qty_baik,
                qty_rusak: qty_rusak,
                lokasi: lokasi,
                return_to_factory: return_to_factory,
                qty_real: qty_real,
            };
            batch.update(docRef, updateData);
            updatedCount++;
          } else {
            // Item doesn't exist, create it
            const docRef = doc(collection(firestore, "inventory"));
            const newItemData: Omit<InventoryItem, 'id'> = {
              part: part,
              deskripsi: deskripsi,
              harga_dpp: harga_dpp,
              ppn: ppn,
              total_harga: total_harga,
              satuan: satuan,
              available_qty: available_qty, // Set from Excel for new item
              qty_baik: qty_baik,
              qty_rusak: qty_rusak,
              lokasi: lokasi,
              return_to_factory: return_to_factory,
              qty_real: qty_real,
            };
            batch.set(docRef, newItemData);
            newCount++;
          }
        });

        await batch.commit();
        toast({ title: "Sukses", description: `${updatedCount} data diperbarui, ${newCount} data baru ditambahkan.` });
        await refetch();

      } catch (error: any) {
        console.error("Error importing Excel:", error);
        toast({
          variant: "destructive",
          title: "Gagal Impor",
          description: error.message || "Terjadi kesalahan saat memproses file.",
        });
        const permissionError = new FirestorePermissionError({
          path: 'inventory',
          operation: 'create',
          requestResourceData: 'Multiple documents from Excel file',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
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


  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedItem || !selectedItem.id || !firestore) return;

    const itemRef = doc(firestore, 'inventory', selectedItem.id);
    const selisihQty = values.qty_baik - selectedItem.qty_baik;

    const updatedData = {
      ...values,
      qty_real: values.qty_baik + values.qty_rusak,
      available_qty: selectedItem.available_qty + selisihQty,
    };
    
    updateDoc(itemRef, updatedData)
      .then(async () => {
        toast({ title: "Sukses", description: "Data stok berhasil diperbarui." });
        setIsModalOpen(false);
        setIsEditing(false);
        await refetch();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: itemRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  async function onAddSubmit(values: z.infer<typeof addSchema>) {
    if (!firestore) return;

    const newItem: Omit<InventoryItem, 'id'> = {
      ...values,
      total_harga: values.harga_dpp + values.ppn,
      available_qty: values.qty_baik,
      qty_real: values.qty_baik + values.qty_rusak,
    };

    addDoc(collection(firestore, "inventory"), newItem)
      .then(async () => {
        toast({ title: "Sukses", description: "Item inventaris baru berhasil ditambahkan." });
        setIsAddModalOpen(false);
        addForm.reset();
        await refetch();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'inventory',
          operation: 'create',
          requestResourceData: newItem,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
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
            
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {permissions?.reportstock_edit && (
                  <>
                  <DropdownMenuItem onSelect={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Tambah Data</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleImportClick} disabled={isImporting}>
                    <FileUp className="mr-2 h-4 w-4" />
                    <span>{isImporting ? 'Mengimpor...' : 'Upload Excel'}</span>
                  </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onSelect={handleExport} disabled={isExporting}>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
                </DropdownMenuItem>
                {permissions?.reportstock_delete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={() => setIsDeletingAll(true)} 
                      disabled={isLoading || !initialData || initialData.length === 0}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Hapus Semua</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nilai Selisih Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalSelisihNilai < 0 ? 'text-destructive' : ''}`}>
              {isLoading ? <Skeleton className="h-8 w-48" /> : formatCurrency(totalSelisihNilai)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total nilai dari selisih antara stok fisik (real) dan stok tersedia.
            </p>
          </CardContent>
        </Card>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Action</TableHead>
                <TableHead className="w-[120px]">Part</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="w-[120px]">Total Harga</TableHead>
                <TableHead className="w-[100px]">Available Qty</TableHead>
                <TableHead className="w-[100px]">Qty Baik</TableHead>
                <TableHead className="w-[100px]">Qty Rusak</TableHead>
                <TableHead className="w-[100px]">Lokasi</TableHead>
                <TableHead className="w-[150px]">Return to Factory</TableHead>
                <TableHead className="w-[120px]">Nilai Selisih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">
                    Tidak ada data. Klik 'Upload Excel' atau 'Tambah Data' untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map(item => {
                  const selisihQty = item.qty_real - item.available_qty;
                  const nilaiSelisih = item.total_harga * selisihQty;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex gap-0">
                          <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.part}</TableCell>
                      <TableCell><span className="block w-40 truncate">{item.deskripsi}</span></TableCell>
                      <TableCell>{formatCurrency(item.total_harga)}</TableCell>
                      <TableCell>{item.available_qty}</TableCell>
                      <TableCell>{item.qty_baik}</TableCell>
                      <TableCell>{item.qty_rusak}</TableCell>
                      <TableCell>{item.lokasi}</TableCell>
                      <TableCell>{item.return_to_factory}</TableCell>
                      <TableCell className={selisihQty !== 0 ? 'text-destructive' : ''}>{formatCurrency(nilaiSelisih)}</TableCell>
                    </TableRow>
                  )
                })
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

       {/* Add Data Modal */}
       <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Item Inventaris Baru</DialogTitle>
            <DialogDescription>Isi detail untuk menambahkan item baru ke dalam stok.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <FormField control={addForm.control} name="part" render={({ field }) => (
                  <FormItem className="md:col-span-1"><FormLabel>Part Number</FormLabel><FormControl><Input placeholder="PN-001" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={addForm.control} name="lokasi" render={({ field }) => (
                  <FormItem className="md:col-span-1"><FormLabel>Lokasi</FormLabel><FormControl><Input placeholder="Rak A-1" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={addForm.control} name="deskripsi" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Deskripsi</FormLabel><FormControl><Textarea placeholder="Deskripsi lengkap part..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={addForm.control} name="harga_dpp" render={({ field }) => (
                  <FormItem><FormLabel>Harga DPP</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={addForm.control} name="ppn" render={({ field }) => (
                  <FormItem><FormLabel>PPN</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={addForm.control} name="qty_baik" render={({ field }) => (
                  <FormItem><FormLabel>Qty Baik</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={addForm.control} name="qty_rusak" render={({ field }) => (
                  <FormItem><FormLabel>Qty Rusak</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={addForm.control} name="satuan" render={({ field }) => (
                  <FormItem><FormLabel>Satuan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={addForm.control} name="return_to_factory" render={({ field }) => (
                <FormItem>
                  <FormLabel>Return to Factory</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO">NO</SelectItem>
                      <SelectItem value="YES">YES</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <DialogFooter className="md:col-span-2 sticky bottom-0 bg-background py-4">
                <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
                <Button type="submit" disabled={addForm.formState.isSubmitting}>Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
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
        <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsEditing(false);
          }
          setIsModalOpen(isOpen);
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? `Edit ${selectedItem.part}` : `Detail ${selectedItem.part}`}</DialogTitle>
              <DialogDescription>{selectedItem.deskripsi}</DialogDescription>
            </DialogHeader>
            
            {isEditing ? (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
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
                  <FormField
                    control={editForm.control}
                    name="lokasi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lokasi</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="return_to_factory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return to Factory</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NO">NO</SelectItem>
                            <SelectItem value="YES">YES</SelectItem>
                          </SelectContent>
                        </Select>
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
                  <span>{selectedItem.return_to_factory}</span>
                </div>
                 <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <span className="text-muted-foreground">Lokasi</span>
                  <span>{selectedItem.lokasi}</span>
                </div>
                <DialogFooter className="sm:justify-between pt-4">
                  <div>
                    {permissions?.reportstock_delete && <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Hapus</Button>}
                  </div>
                  <div className='flex gap-2'>
                    <DialogClose asChild>
                      <Button variant="secondary" size="sm">Tutup</Button>                  
                    </DialogClose>
                    {permissions?.reportstock_edit && <Button onClick={handleEdit} size="sm"><Pencil className="mr-2 h-4 w-4" /> Edit</Button>}
                  </div>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    
