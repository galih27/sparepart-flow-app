
"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import type { Msk, InventoryItem, User } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';

import PageHeader from '@/components/app/page-header';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  part: z.string().min(1, "Part wajib diisi"),
  deskripsi: z.string(),
  qty_msk: z.coerce.number().min(1, "Kuantitas harus lebih dari 0"),
  harga: z.number(),
  site_msk: z.string().min(1, "Site/asal wajib diisi"),
  no_transaksi: z.string().min(1, "No Transaksi wajib diisi"),
  status_msk: z.enum(["BON", "RECEIVED", "CANCELED"]),
  keterangan: z.string().optional(),
});

const ITEMS_PER_PAGE = 10;

export default function MskClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isLoading: isLoadingAuth } = useUser();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isLoadingUser } = useDoc<User>(userDocRef);

  const mskQuery = useMemo(() => firestore ? collection(firestore, 'msk') : null, [firestore]);
  const inventoryQuery = useMemo(() => firestore ? collection(firestore, 'inventory') : null, [firestore]);
  
  const { data, isLoading: isLoadingData } = useCollection<Msk>(mskQuery);
  const { data: inventory, isLoading: isLoadingInventory } = useCollection<InventoryItem>(inventoryQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMsk, setSelectedMsk] = useState<Msk | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      part: "",
      deskripsi: "",
      qty_msk: 1,
      harga: 0,
      site_msk: "",
      no_transaksi: "",
      status_msk: "BON",
      keterangan: "",
    },
  });
  
  const watchedPart = useWatch({ control: form.control, name: "part" });

  useEffect(() => {
    if (inventory) {
      const inventoryItem = inventory.find(item => item.part.toLowerCase() === watchedPart.toLowerCase());
      if (inventoryItem) {
        form.setValue("deskripsi", inventoryItem.deskripsi);
        form.setValue("harga", inventoryItem.total_harga);
      } else {
        form.setValue("deskripsi", "");
        form.setValue("harga", 0);
      }
    }
  }, [watchedPart, inventory, form]);


  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item =>
      item.no_transaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.part.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.tanggal_msk).getTime() - new Date(a.tanggal_msk).getTime());
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);
  
  const handleView = (msk: Msk) => {
    setSelectedMsk(msk);
    setIsViewModalOpen(true);
  };
  
  const handleEdit = (msk: Msk) => {
    if (currentUser?.role === 'Admin' || currentUser?.role === 'Manager') {
        setSelectedMsk(msk);
        form.reset({
            part: msk.part,
            deskripsi: msk.deskripsi,
            qty_msk: msk.qty_msk,
            harga: inventory?.find(i => i.part === msk.part)?.total_harga || 0,
            site_msk: msk.site_msk,
            no_transaksi: msk.no_transaksi,
            status_msk: msk.status_msk,
            keterangan: msk.keterangan || '',
        });
        setIsEditModalOpen(true);
    } else {
         toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk mengedit data ini.' });
    }
  };

  const handleDelete = (msk: Msk) => {
    if (permissions?.msk_delete) {
      setSelectedMsk(msk);
      setIsDeleting(true);
    } else {
       toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menghapus data ini.' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedMsk || !selectedMsk.id || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'msk', selectedMsk.id));
      toast({ title: "Sukses", description: "Data MSK telah dihapus." });
    } catch (error: any) {
      console.error("Error deleting document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: error.message || "Gagal menghapus data MSK." });
    } finally {
      setIsDeleting(false);
      setSelectedMsk(null);
    }
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    
    const isEditing = !!selectedMsk?.id;
    const mskToSave = { ...values, tanggal_msk: isEditing ? selectedMsk.tanggal_msk : new Date().toISOString().split('T')[0] };

    // Find the corresponding inventory item before starting the transaction
    const inventoryCol = collection(firestore, 'inventory');
    const q = query(inventoryCol, where("part", "==", values.part));
    const inventorySnapshot = await getDocs(q);
    const inventoryDoc = inventorySnapshot.docs.length > 0 ? inventorySnapshot.docs[0] : null;
    const inventoryRef = inventoryDoc ? inventoryDoc.ref : null;

    try {
        await runTransaction(firestore, async (transaction) => {
            let originalStatus: Msk['status_msk'] | undefined = undefined;

            if (isEditing) {
                if (!selectedMsk?.id) throw new Error("ID MSK tidak ditemukan untuk diedit.");
                const mskRef = doc(firestore, 'msk', selectedMsk.id);
                const mskDoc = await transaction.get(mskRef);
                if (!mskDoc.exists()) throw new Error("Dokumen MSK tidak ditemukan.");
                originalStatus = mskDoc.data().status_msk;
                transaction.update(mskRef, mskToSave);
            } else {
                const mskRef = doc(collection(firestore, 'msk'));
                transaction.set(mskRef, mskToSave);
            }
            
            const wasReceived = originalStatus === 'RECEIVED';
            const isNowReceived = values.status_msk === 'RECEIVED';

            if (!inventoryRef) {
                if(isNowReceived) {
                    throw new Error(`Part ${values.part} tidak ditemukan di Report Stock. Transaksi masuk tidak dapat diselesaikan.`);
                } else {
                    // Allow creating BON transaction even if part doesn't exist
                    return; 
                }
            }
            
            // Logic to add stock
            if (isNowReceived && !wasReceived) {
                const currentInventoryDoc = await transaction.get(inventoryRef);
                if (!currentInventoryDoc.exists()) {
                    throw new Error(`Part ${values.part} tidak ditemukan di Report Stock saat transaksi.`);
                }
                const currentInventory = currentInventoryDoc.data() as InventoryItem;
                const newQtyBaik = currentInventory.qty_baik + values.qty_msk;
                const newAvailableQty = currentInventory.available_qty + values.qty_msk;
                transaction.update(inventoryRef, { qty_baik: newQtyBaik, available_qty: newAvailableQty });
            }
        });

        toast({ title: "Sukses", description: `Data MSK berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'} dan stok disesuaikan.` });
        if (isEditing) setIsEditModalOpen(false);
        else setIsAddModalOpen(false);
        setSelectedMsk(null);
        form.reset();

    } catch (error: any) {
        console.error("Error in transaction: ", error);
        toast({ variant: "destructive", title: "Gagal", description: error.message || "Gagal menyimpan data MSK." });
    }
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  }

  const statusVariant = {
    'BON': 'default',
    'RECEIVED': 'secondary',
    'CANCELED': 'destructive'
  } as const;

  const isLoading = isLoadingData || isLoadingInventory || isLoadingAuth || isLoadingUser;
  const permissions = currentUser?.permissions;

  const renderActionCell = (item: Msk) => {
    const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
    const canDelete = permissions?.msk_delete;

    return (
        <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                <Eye className="h-4 w-4" />
            </Button>
            {canEdit && (
                 <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            )}
            {canDelete && (
                 <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
  };

  const renderForm = (isEdit: boolean) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <FormField control={form.control} name="part" render={({ field }) => (
            <FormItem><FormLabel>Part</FormLabel><FormControl><Input placeholder="PN-001" {...field} disabled={isEdit} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="deskripsi" render={({ field }) => (
            <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Input placeholder="Deskripsi Part" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="qty_msk" render={({ field }) => (
            <FormItem><FormLabel>Qty</FormLabel><FormControl><Input type="number" {...field} disabled={isEdit && selectedMsk?.status_msk === 'RECEIVED'} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="harga" render={({ field }) => (
            <FormItem><FormLabel>Harga</FormLabel><FormControl><Input value={formatCurrency(field.value)} readOnly className="bg-muted"/></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField
            control={form.control}
            name="status_msk"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="BON">BON</SelectItem>
                            <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                            <SelectItem value="CANCELED">CANCELED</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField control={form.control} name="site_msk" render={({ field }) => (
            <FormItem><FormLabel>Asal Site/Cabang</FormLabel><FormControl><Input placeholder="Kantor Pusat" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="no_transaksi" render={({ field }) => (
            <FormItem className="md:col-span-2"><FormLabel>No. Transaksi</FormLabel><FormControl><Input placeholder="TRX-MSK-..." {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="keterangan" render={({ field }) => (
            <FormItem className="md:col-span-2"><FormLabel>Keterangan</FormLabel><FormControl><Textarea placeholder="Keterangan opsional..." {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <DialogFooter className="md:col-span-2">
          <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
          <Button type="submit">Simpan</Button>
        </DialogFooter>
      </form>
    </Form>
  )

  return (
    <>
      <PageHeader title="Material Service Kiriman (MSK)">
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari no transaksi atau part..."
                className="w-full rounded-lg bg-background pl-8 sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
            <Button onClick={() => {
              form.reset({
                part: "",
                deskripsi: "",
                qty_msk: 1,
                harga: 0,
                site_msk: "",
                no_transaksi: `TRX-MSK-${Date.now()}`,
                status_msk: "BON",
                keterangan: "",
              }); 
              setSelectedMsk(null);
              setIsAddModalOpen(true);
            }}>
                <Plus className="mr-2 h-4 w-4" /> Tambah
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
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Asal Site/Cabang</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Transaksi</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
                 Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    </TableRow>
                 ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    Tidak ada data MSK.
                  </TableCell>
                </TableRow>
              ) : (paginatedData.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{renderActionCell(item)}</TableCell>
                  <TableCell className="font-medium">{item.part}</TableCell>
                  <TableCell>{item.deskripsi}</TableCell>
                  <TableCell>{item.qty_msk}</TableCell>
                  <TableCell><Badge variant={statusVariant[item.status_msk] || 'default'}>{item.status_msk}</Badge></TableCell>
                  <TableCell>{item.site_msk}</TableCell>
                  <TableCell>{item.tanggal_msk}</TableCell>
                  <TableCell>{item.no_transaksi}</TableCell>
                  <TableCell>{item.keterangan}</TableCell>
                </TableRow>
              )))}
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
      
       <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data MSK untuk <strong>{selectedMsk?.part}</strong>. Jika stok sudah ditambahkan, maka akan dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah MSK</DialogTitle>
            <DialogDescription>Isi form untuk menambah transaksi masuk.</DialogDescription>
          </DialogHeader>
          {renderForm(false)}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit MSK: {selectedMsk?.part}</DialogTitle>
            <DialogDescription>Perbarui detail transaksi masuk.</DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      {selectedMsk && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Detail MSK: {selectedMsk.part}</DialogTitle>
                    <DialogDescription>Deskripsi: {selectedMsk.deskripsi}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Qty</span>
                        <span>{selectedMsk.qty_msk}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={statusVariant[selectedMsk.status_msk] || 'default'}>{selectedMsk.status_msk}</Badge>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Asal Site</span>
                        <span>{selectedMsk.site_msk}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Tanggal</span>
                        <span>{selectedMsk.tanggal_msk}</span>
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">No. Transaksi</span>
                        <span>{selectedMsk.no_transaksi}</span>
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Keterangan</span>
                        <span>{selectedMsk.keterangan || "-"}</span>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Tutup</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
