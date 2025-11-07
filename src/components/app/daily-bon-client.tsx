
"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import type { DailyBon, User, InventoryItem } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, runTransaction, query, where, getDocs, writeBatch } from 'firebase/firestore';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '../ui/skeleton';

const addSchema = z.object({
  part: z.string().min(1, "Part wajib diisi"),
  deskripsi: z.string(),
  qty_dailybon: z.coerce.number().min(1, "Kuantitas harus lebih dari 0"),
  harga: z.number(),
  teknisi: z.string().min(1, "Teknisi wajib diisi"),
  keterangan: z.string().optional(),
});

const editSchema = z.object({
  status_bon: z.enum(["BON", "RECEIVED", "KMP", "CANCELED"]),
  no_tkl: z.string().optional(),
  keterangan: z.string().optional(),
})

const ITEMS_PER_PAGE = 10;

export default function DailyBonClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isLoading: isLoadingAuth } = useUser();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isLoadingUser } = useDoc<User>(userDocRef);

  const bonQuery = useMemo(() => firestore ? collection(firestore, 'daily_bon') : null, [firestore]);
  const usersQuery = useMemo(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const inventoryQuery = useMemo(() => firestore ? collection(firestore, 'inventory') : null, [firestore]);
  
  const { data, isLoading: isLoadingData } = useCollection<DailyBon>(bonQuery);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  const { data: inventory, isLoading: isLoadingInventory } = useCollection<InventoryItem>(inventoryQuery);
  
  const [filterTeknisi, setFilterTeknisi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBon, setSelectedBon] = useState<DailyBon | null>(null);

  const addForm = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      part: "",
      deskripsi: "",
      qty_dailybon: 1,
      harga: 0,
      teknisi: "",
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
    
    let bonData = data;
    
    // If the user is a 'Teknisi', pre-filter the data to only show their own.
    if (currentUser?.role === 'Teknisi') {
        bonData = bonData.filter(item => item.teknisi === currentUser.nama_teknisi);
    }

    // Then, apply the filters from the UI
    return bonData.filter(item =>
      (filterTeknisi === '' || item.teknisi === filterTeknisi) &&
      (filterStatus === '' || item.status_bon === filterStatus)
    ).sort((a, b) => {
        if (!a.tanggal_dailybon || !b.tanggal_dailybon) return 0;
        return new Date(b.tanggal_dailybon).getTime() - new Date(a.tanggal_dailybon).getTime()
    });
  }, [data, filterTeknisi, filterStatus, currentUser]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);
  
  async function onAddSubmit(values: z.infer<typeof addSchema>) {
    if (!firestore) return;
    const newBon: Omit<DailyBon, 'id'> = {
        part: values.part,
        deskripsi: values.deskripsi,
        qty_dailybon: values.qty_dailybon,
        harga: values.harga,
        status_bon: 'BON',
        teknisi: values.teknisi,
        tanggal_dailybon: new Date().toISOString().split('T')[0],
        no_tkl: '', // Set to empty string on creation
        keterangan: values.keterangan || '',
    };
    
    try {
        await addDoc(collection(firestore, 'daily_bon'), newBon);
        toast({ title: "Sukses", description: "Data bon harian berhasil ditambahkan." });
        setIsAddModalOpen(false);
        addForm.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ variant: "destructive", title: "Gagal", description: "Gagal menambahkan data bon harian." });
    }
  }

  const handleEdit = (bon: DailyBon) => {
    setSelectedBon(bon);
    editForm.reset({
      status_bon: bon.status_bon,
      no_tkl: bon.no_tkl || '',
      keterangan: bon.keterangan || '',
    });
    setIsEditModalOpen(true);
  };

  const handleView = (bon: DailyBon) => {
    setSelectedBon(bon);
    setIsViewModalOpen(true);
  };

  const handleDelete = (bon: DailyBon) => {
    if (permissions?.dailybon_delete) {
      setSelectedBon(bon);
      setIsDeleting(true);
    } else {
      toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menghapus data ini.' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedBon || !selectedBon.id || !firestore) return;

    try {
      await deleteDoc(doc(firestore, 'daily_bon', selectedBon.id));
      toast({ title: "Sukses", description: "Bon harian telah dihapus." });
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus bon harian." });
    } finally {
      setIsDeleting(false);
      setSelectedBon(null);
    }
  };
  
async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!firestore || !selectedBon || !selectedBon.id) return;

    const bonRef = doc(firestore, 'daily_bon', selectedBon.id);
    const originalStatus = selectedBon.status_bon;
    const newStatus = values.status_bon;

    try {
      await runTransaction(firestore, async (transaction) => {
        // Update the Daily Bon document first
        transaction.update(bonRef, {
          status_bon: values.status_bon,
          no_tkl: values.no_tkl,
          keterangan: values.keterangan
        });

        const isStockDeducted = originalStatus === 'RECEIVED' || originalStatus === 'KMP';
        const willStockBeDeducted = newStatus === 'RECEIVED' || newStatus === 'KMP';

        if (isStockDeducted === willStockBeDeducted) {
          // No change in stock status, so no need to update inventory.
          return;
        }

        const inventoryCol = collection(firestore, 'inventory');
        const q = query(inventoryCol, where("part", "==", selectedBon.part));
        // Use transaction.get() instead of getDocs() inside a transaction
        const inventorySnapshot = await transaction.get(q);

        if (inventorySnapshot.empty) {
          throw new Error(`Part ${selectedBon.part} tidak ditemukan di Report Stock.`);
        }

        const inventoryDoc = inventorySnapshot.docs[0];
        const inventoryRef = inventoryDoc.ref;
        const currentInventory = inventoryDoc.data() as InventoryItem;

        let stockChange = 0;
        if (willStockBeDeducted && !isStockDeducted) {
            // Moving to a stock-deducted state
            stockChange = -selectedBon.qty_dailybon;
        } else if (!willStockBeDeducted && isStockDeducted) {
            // Moving away from a stock-deducted state (restocking)
            stockChange = +selectedBon.qty_dailybon;
        }
        
        const newQtyBaik = currentInventory.qty_baik + stockChange;

        if (newQtyBaik < 0) {
          throw new Error(`Stok 'baik' untuk part ${selectedBon.part} tidak mencukupi.`);
        }
        
        const newAvailableQty = currentInventory.available_qty + stockChange;
        
        transaction.update(inventoryRef, {
          qty_baik: newQtyBaik,
          available_qty: newAvailableQty
        });
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
    'KMP': 'outline',
    'CANCELED': 'destructive'
  } as const;

  const isLoading = isLoadingData || isLoadingUsers || isLoadingInventory || isLoadingAuth || isLoadingUser;
  const permissions = currentUser?.permissions;

  const renderActionCell = (item: DailyBon) => {
    const isReceivedOrCanceled = item.status_bon === 'RECEIVED' || item.status_bon === 'CANCELED';
    const canEdit = permissions?.dailybon_edit && (currentUser?.role === 'Admin' || !isReceivedOrCanceled);
    const canDelete = permissions?.dailybon_delete;

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


  return (
    <>
      <PageHeader title="Daily Bon">
        <div className="flex items-center gap-2">
            {currentUser?.role !== 'Teknisi' && (
              <Select 
                value={filterTeknisi}
                onValueChange={(value) => {
                  setFilterTeknisi(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}
              >
                  <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Filter Teknisi" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Semua Teknisi</SelectItem>
                      {users?.filter(u => u.role === 'Teknisi').map(user => (
                          <SelectItem key={user.id} value={user.nama_teknisi}>{user.nama_teknisi}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            )}

            <Select value={filterStatus} onValueChange={(value) => {setFilterStatus(value === 'all' ? '' : value); setCurrentPage(1);}}>
              <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="BON">BON</SelectItem>
                  <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                  <SelectItem value="KMP">KMP</SelectItem>
                  <SelectItem value="CANCELED">CANCELED</SelectItem>
              </SelectContent>
            </Select>

          {permissions?.dailybon_edit && (
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
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teknisi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. TKL</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    </TableRow>
                 ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">
                    Tidak ada data bon harian.
                  </TableCell>
                </TableRow>
              ) : (paginatedData.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{renderActionCell(item)}</TableCell>
                  <TableCell className="font-medium">{item.part}</TableCell>
                  <TableCell>{item.deskripsi}</TableCell>
                  <TableCell>{item.qty_dailybon}</TableCell>
                  <TableCell>{formatCurrency(item.harga)}</TableCell>
                  <TableCell><Badge variant={statusVariant[item.status_bon] || 'default'}>{item.status_bon}</Badge></TableCell>
                  <TableCell>{item.teknisi}</TableCell>
                  <TableCell>{item.tanggal_dailybon}</TableCell>
                  <TableCell>{item.no_tkl}</TableCell>
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
              Tindakan ini akan menghapus bon untuk <strong>{selectedBon?.part}</strong> secara permanen. Data yang dihapus tidak dapat dipulihkan.
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
            <DialogTitle>Tambah Daily Bon</DialogTitle>
            <DialogDescription>Isi form untuk menambah transaksi sparepart keluar.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <FormField
                control={addForm.control}
                name="part"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
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
                  <FormItem className="md:col-span-1">
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Input placeholder="Otomatis terisi" {...field} readOnly className="bg-muted"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="qty_dailybon"
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
                name="teknisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teknisi</FormLabel>
                    <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        value={currentUser?.role === 'Teknisi' ? currentUser?.nama_teknisi : field.value}
                        disabled={currentUser?.role === 'Teknisi'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Teknisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.filter(u => u.role === 'Teknisi').map(user => (
                            <SelectItem key={user.id} value={user.nama_teknisi}>{user.nama_teknisi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <DialogTitle>Update Status Bon</DialogTitle>
                    <DialogDescription>Update status untuk part {selectedBon.part}.</DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={editForm.control}
                            name="status_bon"
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
                                            <SelectItem value="KMP">KMP</SelectItem>
                                            <SelectItem value="CANCELED">CANCELED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={editForm.control}
                            name="no_tkl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. TKL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Isi No. TKL jika ada" {...field} value={field.value ?? ''}/>
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
                    <DialogTitle>Detail Bon: {selectedBon.part}</DialogTitle>
                    <DialogDescription>Deskripsi: {selectedBon.deskripsi}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Qty</span>
                        <span>{selectedBon.qty_dailybon}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Harga</span>
                        <span>{formatCurrency(selectedBon.harga)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={statusVariant[selectedBon.status_bon] || 'default'}>{selectedBon.status_bon}</Badge>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Teknisi</span>
                        <span>{selectedBon.teknisi}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Tanggal</span>
                        <span>{selectedBon.tanggal_dailybon}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">No. TKL</span>
                        <span>{selectedBon.no_tkl || "-"}</span>
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

    