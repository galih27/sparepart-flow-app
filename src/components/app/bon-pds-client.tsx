
"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Plus, Search, Trash2, Pencil, Eye } from 'lucide-react';
import type { BonPDS, InventoryItem, User } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';

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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const addSchema = z.object({
  part: z.string().min(1, "Part wajib diisi"),
  deskripsi: z.string(),
  qty_bonpds: z.coerce.number().min(1, "Kuantitas harus lebih dari 0"),
  harga: z.number(),
  site_bonpds: z.string().min(1, "Site wajib diisi"),
  keterangan: z.string().optional(),
});

const editSchema = z.object({
  status_bonpds: z.enum(["BON", "RECEIVED", "CANCELED"]),
  no_transaksi: z.string().min(1, "No. Transaksi wajib diisi"),
  keterangan: z.string().optional(),
});

const ITEMS_PER_PAGE = 10;

export default function BonPdsClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isLoading: isLoadingAuth } = useUser();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isLoadingUser } = useDoc<User>(userDocRef);


  const bonPdsQuery = useMemo(() => firestore ? collection(firestore, 'bon_pds') : null, [firestore]);
  const inventoryQuery = useMemo(() => firestore ? collection(firestore, 'inventory') : null, [firestore]);
  
  const { data, isLoading: isLoadingData } = useCollection<BonPDS>(bonPdsQuery);
  const { data: inventory, isLoading: isLoadingInventory } = useCollection<InventoryItem>(inventoryQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBon, setSelectedBon] = useState<BonPDS | null>(null);

  const addForm = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      part: "",
      deskripsi: "",
      qty_bonpds: 1,
      harga: 0,
      site_bonpds: "",
      keterangan: "",
    },
  });

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const watchedPart = useWatch({ control: addForm.control, name: "part" });

  useEffect(() => {
    if (inventory) {
      const inventoryItem = inventory.find(item => item.part.toLowerCase() === watchedPart.toLowerCase());
      if (inventoryItem) {
        addForm.setValue("deskripsi", inventoryItem.deskripsi);
        addForm.setValue("harga", inventoryItem.total_harga);
      } else {
        addForm.setValue("deskripsi", "");
        addForm.setValue("harga", 0);
      }
    }
  }, [watchedPart, inventory, addForm]);


  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item =>
      (filterStatus === '' || item.status_bonpds === filterStatus) &&
      (
        (item.site_bonpds && item.site_bonpds.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.part && item.part.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    ).sort((a, b) => new Date(b.tanggal_bonpds).getTime() - new Date(a.tanggal_bonpds).getTime());
  }, [data, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const handleView = (bon: BonPDS) => {
    setSelectedBon(bon);
    setIsViewModalOpen(true);
  };
  
  const handleEdit = (bon: BonPDS) => {
    if (permissions?.bonpds_edit) {
        setSelectedBon(bon);
        editForm.reset({
            status_bonpds: bon.status_bonpds,
            no_transaksi: bon.no_transaksi || '',
            keterangan: bon.keterangan || '',
        });
        setIsEditModalOpen(true);
    } else {
         toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk mengedit data ini.' });
    }
  };

  const handleDelete = (bon: BonPDS) => {
    if (permissions?.bonpds_delete) {
      setSelectedBon(bon);
      setIsDeleting(true);
    } else {
       toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menghapus data ini.' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedBon || !selectedBon.id || !firestore) return;

    try {
      await deleteDoc(doc(firestore, 'bon_pds', selectedBon.id));
      toast({ title: "Sukses", description: "Bon PDS telah dihapus." });
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus Bon PDS." });
    } finally {
      setIsDeleting(false);
      setSelectedBon(null);
    }
  };
  
  async function onAddSubmit(values: z.infer<typeof addSchema>) {
    if (!firestore) return;
    
    const newBon: Omit<BonPDS, 'id'> = {
        part: values.part,
        deskripsi: values.deskripsi,
        qty_bonpds: values.qty_bonpds,
        status_bonpds: 'BON',
        site_bonpds: values.site_bonpds,
        tanggal_bonpds: new Date().toISOString().split('T')[0],
        no_transaksi: `TRX-PDS-${Date.now()}`,
        keterangan: values.keterangan || '',
    };
    
    try {
        await addDoc(collection(firestore, 'bon_pds'), newBon);
        toast({ title: "Sukses", description: "Data Bon PDS berhasil ditambahkan." });
        setIsAddModalOpen(false);
        addForm.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ variant: "destructive", title: "Gagal", description: "Gagal menambahkan data Bon PDS." });
    }
  }

  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!firestore || !selectedBon || !selectedBon.id) return;
  
    const bonRef = doc(firestore, 'bon_pds', selectedBon.id);
    const originalStatus = selectedBon.status_bonpds;
    const newStatus = values.status_bonpds;
  
    try {
      await runTransaction(firestore, async (transaction) => {
        // 1. Update the Bon PDS document
        transaction.update(bonRef, {
          status_bonpds: values.status_bonpds,
          no_transaksi: values.no_transaksi,
          keterangan: values.keterangan
        });
  
        // 2. Check if we need to update inventory
        const shouldUpdateInventory = 
          newStatus === 'RECEIVED' && originalStatus !== 'RECEIVED';
  
        if (shouldUpdateInventory) {
          const inventoryCol = collection(firestore, 'inventory');
          const q = query(inventoryCol, where("part", "==", selectedBon.part));
          const inventorySnapshot = await getDocs(q);
  
          if (inventorySnapshot.empty) {
            throw new Error(`Part ${selectedBon.part} tidak ditemukan di Report Stock.`);
          }
  
          const inventoryDoc = inventorySnapshot.docs[0];
          const inventoryRef = inventoryDoc.ref;
          const currentInventory = inventoryDoc.data() as InventoryItem;
  
          const newQtyBaik = currentInventory.qty_baik - selectedBon.qty_bonpds;
          const newAvailableQty = currentInventory.available_qty - selectedBon.qty_bonpds;
  
          if (newQtyBaik < 0) {
            throw new Error(`Stok 'baik' untuk part ${selectedBon.part} tidak mencukupi.`);
          }
  
          transaction.update(inventoryRef, {
            qty_baik: newQtyBaik,
            available_qty: newAvailableQty
          });
        }
      });
  
      toast({ title: "Sukses", description: "Status bon berhasil diperbarui dan stok telah disesuaikan." });
      setIsEditModalOpen(false);
      setSelectedBon(null);
    } catch (error: any) {
      console.error("Error updating document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: error.message || "Gagal memperbarui status bon." });
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

  const renderActionCell = (item: BonPDS) => {
    const canEdit = permissions?.bonpds_edit && !(item.status_bonpds === 'RECEIVED' || item.status_bonpds === 'CANCELED');
    const canDelete = permissions?.bonpds_delete;

    return (
        <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                <Eye className="h-4 w-4" />
            </Button>
            {(currentUser?.role === 'Admin' || canEdit) && (
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

  return (
    <>
      <PageHeader title="Bon PDS">
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari site atau part..."
                className="w-full rounded-lg bg-background pl-8 sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
             <Select value={filterStatus} onValueChange={(value) => {setFilterStatus(value === 'all' ? '' : value); setCurrentPage(1);}}>
              <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="BON">BON</SelectItem>
                  <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                  <SelectItem value="CANCELED">CANCELED</SelectItem>
              </SelectContent>
            </Select>
          {permissions?.bonpds_edit && (
            <Button onClick={() => setIsAddModalOpen(true)}>
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
                <TableHead>Site</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    </TableRow>
                 ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    Tidak ada data Bon PDS.
                  </TableCell>
                </TableRow>
              ) : (paginatedData.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{renderActionCell(item)}</TableCell>
                  <TableCell className="font-medium">{item.part}</TableCell>
                  <TableCell>{item.deskripsi}</TableCell>
                  <TableCell>{item.qty_bonpds}</TableCell>
                  <TableCell><Badge variant={statusVariant[item.status_bonpds] || 'default'}>{item.status_bonpds}</Badge></TableCell>
                  <TableCell>{item.site_bonpds}</TableCell>
                  <TableCell>{item.tanggal_bonpds}</TableCell>
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
              Tindakan ini akan menghapus Bon PDS untuk <strong>{selectedBon?.part}</strong> ke site <strong>{selectedBon?.site_bonpds}</strong>. Data yang dihapus tidak dapat dipulihkan.
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
            <DialogTitle>Tambah Bon PDS</DialogTitle>
            <DialogDescription>Isi form untuk menambah transaksi keluar ke site/cabang.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <FormField
                control={addForm.control}
                name="part"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part</FormLabel>
                    <FormControl>
                      <Input placeholder="PN-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="deskripsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Input placeholder="Otomatis terisi" {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="qty_bonpds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={addForm.control}
                name="harga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga</FormLabel>
                    <FormControl>
                       <Input value={formatCurrency(field.value)} readOnly className="bg-muted"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value="BON" readOnly disabled className="bg-muted"/>
              </div>
              <FormField
                control={addForm.control}
                name="site_bonpds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Tujuan</FormLabel>
                    <FormControl>
                      <Input placeholder="Site A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="keterangan"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keterangan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Keterangan opsional..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="md:col-span-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Batal</Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedBon && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Status Bon PDS</DialogTitle>
                    <DialogDescription>Update status untuk part {selectedBon.part}.</DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={editForm.control}
                            name="status_bonpds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status Bon</FormLabel>
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
                        <FormField
                            control={editForm.control}
                            name="no_transaksi"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. Transaksi</FormLabel>
                                    <FormControl>
                                        <Input placeholder="TRX-PDS-..." {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="keterangan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Keterangan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Keterangan opsional..." {...field} value={field.value ?? ''} />
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
            </DialogContent>
        </Dialog>
      )}

      {selectedBon && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Detail Bon PDS: {selectedBon.part}</DialogTitle>
                    <DialogDescription>Deskripsi: {selectedBon.deskripsi}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Qty</span>
                        <span>{selectedBon.qty_bonpds}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={statusVariant[selectedBon.status_bonpds] || 'default'}>{selectedBon.status_bonpds}</Badge>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Site Tujuan</span>
                        <span>{selectedBon.site_bonpds}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Tanggal</span>
                        <span>{selectedBon.tanggal_bonpds}</span>
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">No. Transaksi</span>
                        <span>{selectedBon.no_transaksi}</span>
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Keterangan</span>
                        <span>{selectedBon.keterangan || "-"}</span>
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
