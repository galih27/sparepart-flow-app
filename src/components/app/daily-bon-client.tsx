"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import type { DailyBon, User, InventoryItem, Permissions } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useAPIFetch, useCurrentUser, api } from '@/hooks/use-api';

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
import { Skeleton } from '../ui/skeleton';

const addSchema = z.object({
  part: z.string().min(1, "Part wajib diisi"),
  deskripsi: z.string(),
  qty_dailybon: z.coerce.number().min(1, "Kuantitas harus lebih dari 0"),
  harga: z.coerce.number(),
  status_bon: z.enum(["BON", "RECEIVED", "KMP", "CANCELED"]),
  teknisi: z.string().min(1, "Teknisi wajib diisi"),
  keterangan: z.string().optional(),
});

const editSchema = z.object({
  status_bon: z.enum(["BON", "RECEIVED", "KMP", "CANCELED"]),
  no_tkl: z.string().optional(),
  keterangan: z.string().optional(),
}).refine((data) => {
  if ((data.status_bon === 'RECEIVED' || data.status_bon === 'KMP') && (!data.no_tkl || data.no_tkl.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "No. TKL wajib diisi untuk status RECEIVED atau KMP.",
  path: ['no_tkl'],
});

const ITEMS_PER_PAGE = 10;

export default function DailyBonClient() {
  const { toast } = useToast();
  const { user: authUser, isLoading: isLoadingAuth } = useCurrentUser();

  const { data, isLoading: isLoadingData, refetch } = useAPIFetch<DailyBon>('/api/daily-bon');
  const { data: users, isLoading: isLoadingUsers } = useAPIFetch<User>('/api/users');
  const { data: inventory, isLoading: isLoadingInventory } = useAPIFetch<InventoryItem>('/api/inventory');

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
      status_bon: "BON",
      teknisi: "",
      keterangan: "",
    },
  });

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const watchedPart = useWatch({ control: addForm.control, name: "part" });

  useEffect(() => {
    if (inventory && watchedPart) {
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

  useEffect(() => {
    if (authUser && authUser.role === 'Teknisi') {
      addForm.setValue('teknisi', authUser.nama_teknisi);
    }
  }, [authUser, addForm, isAddModalOpen]);

  const parsePermissions = (perms: any): Permissions | null => {
    if (!perms) return null;
    if (typeof perms === 'string') {
      try {
        return JSON.parse(perms);
      } catch (e) {
        return null;
      }
    }
    return perms;
  };

  const permissions = useMemo(() => parsePermissions(authUser?.permissions), [authUser]);

  const filteredData = useMemo(() => {
    if (!data) return [];

    let bonData = data;

    if (authUser?.role === 'Teknisi') {
      bonData = bonData.filter(item => item.teknisi === authUser.nama_teknisi);
    }

    return bonData.filter(item =>
      (filterTeknisi === '' || item.teknisi === filterTeknisi) &&
      (filterStatus === '' || item.status_bon === filterStatus)
    ).sort((a, b) => {
      if (!a.tanggal_dailybon || !b.tanggal_dailybon) return 0;
      return new Date(b.tanggal_dailybon).getTime() - new Date(a.tanggal_dailybon).getTime()
    });
  }, [data, filterTeknisi, filterStatus, authUser]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  async function onAddSubmit(values: z.infer<typeof addSchema>) {
    const result = await api.post('/api/daily-bon', values);

    if (result.error) {
      toast({ variant: "destructive", title: "Gagal", description: result.error.message });
    } else {
      toast({ title: "Sukses", description: "Data bon harian berhasil ditambahkan." });
      setIsAddModalOpen(false);
      addForm.reset();
      await refetch();
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
    if (!selectedBon || !selectedBon.id) return;

    const result = await api.delete(`/api/daily-bon/${selectedBon.id}`);

    if (result.error) {
      toast({ variant: "destructive", title: "Gagal", description: result.error.message });
    } else {
      toast({ title: "Sukses", description: "Bon harian telah dihapus." });
      await refetch();
    }

    setIsDeleting(false);
    setSelectedBon(null);
  };

  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedBon || !selectedBon.id) return;

    const result = await api.put(`/api/daily-bon/${selectedBon.id}`, values);

    if (result.error) {
      toast({ variant: "destructive", title: "Gagal Update", description: result.error.message });
    } else {
      toast({ title: "Sukses", description: "Status bon diperbarui." });
      setIsEditModalOpen(false);
      setSelectedBon(null);
      await refetch();
    }
  }

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  }

  const statusVariant = {
    'BON': 'default',
    'RECEIVED': 'secondary',
    'KMP': 'outline',
    'CANCELED': 'destructive'
  } as const;

  const isLoading = isLoadingData || isLoadingUsers || isLoadingInventory || isLoadingAuth;

  const renderActionCell = (item: DailyBon) => {
    const isReceivedOrCanceled = item.status_bon === 'RECEIVED' || item.status_bon === 'CANCELED';
    const canEdit = permissions?.dailybon_edit && (authUser?.role === 'Admin' || !isReceivedOrCanceled);

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
        {permissions?.dailybon_delete && (
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
          {authUser?.role !== 'Teknisi' && (
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

          <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value === 'all' ? '' : value); setCurrentPage(1); }}>
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
        <div className="border rounded-lg bg-card shadow-sm">
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
              Tindakan ini akan menghapus bon untuk <strong>{selectedBon?.part}</strong> secara permanen. Jika stok sudah dikurangi, maka akan dikembalikan.
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Part" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inventory?.map(item => (
                          <SelectItem key={item.id} value={item.part}>{item.part}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="Otomatis terisi" {...field} readOnly className="bg-muted" />
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
                      <Input value={formatCurrency(field.value)} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="status_bon"
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
                        <SelectItem value="KMP">KMP</SelectItem>
                        <SelectItem value="CANCELED">CANCELED</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="teknisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teknisi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={authUser?.role === 'Teknisi'}
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
                <Button type="submit" disabled={addForm.formState.isSubmitting}>{addForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
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
                        <Input placeholder="TKL/JKT/25/11/23/001" {...field} value={field.value ?? ''} />
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
                        <Textarea placeholder="Alasan perubahan atau memo tambahan..." {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Batal</Button>
                  </DialogClose>
                  <Button type="submit" disabled={editForm.formState.isSubmitting}>Simpan Perubahan</Button>
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
              <DialogTitle>Detail Daily Bon: {selectedBon.part}</DialogTitle>
              <DialogDescription>{selectedBon.deskripsi}</DialogDescription>
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
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(selectedBon.qty_dailybon * selectedBon.harga)}</span>
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
