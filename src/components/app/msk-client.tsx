
"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Plus, Search } from 'lucide-react';
import type { Msk, InventoryItem, User } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

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

const addSchema = z.object({
  part: z.string().min(1, "Part wajib diisi"),
  deskripsi: z.string(),
  qty_msk: z.coerce.number().min(1, "Kuantitas harus lebih dari 0"),
  harga: z.number(),
  site_msk: z.string().min(1, "Site/asal wajib diisi"),
  no_transaksi: z.string().min(1, "No Transaksi wajib diisi"),
  keterangan: z.string().optional(),
});

const ITEMS_PER_PAGE = 10;

export default function MskClient({ data: initialData }: { data: Msk[] }) {
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
  const { data: inventory } = useCollection<InventoryItem>(inventoryQuery);

  const [data, setData] = useState<Msk[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      part: "",
      deskripsi: "",
      qty_msk: 1,
      harga: 0,
      site_msk: "",
      no_transaksi: "",
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
    return data.filter(item =>
      item.no_transaksi.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.tanggal_msk).getTime() - new Date(a.tanggal_msk).getTime());
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);
  
  function onSubmit(values: z.infer<typeof addSchema>) {
    const newMsk: Msk = {
        id_msk: `msk-${data.length + 1}`,
        part: values.part,
        deskripsi: values.deskripsi,
        qty_msk: values.qty_msk,
        status_msk: 'BON',
        site_msk: values.site_msk,
        tanggal_msk: new Date().toISOString().split('T')[0],
        no_transaksi: values.no_transaksi,
        keterangan: values.keterangan || '',
    };
    
    setData(prevData => [newMsk, ...prevData]);
    toast({ title: "Sukses", description: "Data MSK berhasil ditambahkan." });
    setIsModalOpen(false);
    form.reset();
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  }

  const statusVariant = {
    'BON': 'default',
    'RECEIVED': 'secondary',
    'CANCELED': 'destructive'
  } as const;

  const canEdit = currentUser?.permissions.msk_edit;


  return (
    <>
      <PageHeader title="Material Service Kiriman (MSK)">
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Filter no transaksi..."
                className="w-full rounded-lg bg-background pl-8 sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          {canEdit && (
            <Button onClick={() => setIsModalOpen(true)}>
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
              {paginatedData.map(item => (
                <TableRow key={item.id_msk}>
                  <TableCell className="font-medium">{item.part}</TableCell>
                  <TableCell>{item.deskripsi}</TableCell>
                  <TableCell>{item.qty_msk}</TableCell>
                  <TableCell><Badge variant={statusVariant[item.status_msk] || 'default'}>{item.status_msk}</Badge></TableCell>
                  <TableCell>{item.site_msk}</TableCell>
                  <TableCell>{item.tanggal_msk}</TableCell>
                  <TableCell>{item.no_transaksi}</TableCell>
                  <TableCell>{item.keterangan}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            canPreviousPage={currentPage > 1}
            canNextPage={currentPage < totalPages}
          />
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah MSK</DialogTitle>
            <DialogDescription>Isi form untuk menambah transaksi masuk.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <FormField control={form.control} name="part" render={({ field }) => (
                  <FormItem><FormLabel>Part</FormLabel><FormControl><Input placeholder="PN-001" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="deskripsi" render={({ field }) => (
                  <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Input placeholder="Otomatis terisi" {...field} readOnly className="bg-muted" /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="qty_msk" render={({ field }) => (
                  <FormItem><FormLabel>Qty</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="harga" render={({ field }) => (
                  <FormItem><FormLabel>Harga</FormLabel><FormControl><Input value={formatCurrency(field.value)} readOnly className="bg-muted"/></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="space-y-2"><Label>Status</Label><Input value="BON" readOnly disabled className="bg-muted"/></div>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
