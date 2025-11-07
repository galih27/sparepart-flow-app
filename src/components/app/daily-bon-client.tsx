"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Plus } from 'lucide-react';
import type { DailyBon, User, InventoryItem } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const addSchema = z.object({
  part: z.string().min(1, "Part wajib diisi"),
  deskripsi: z.string(),
  qty_dailybon: z.coerce.number().min(1, "Kuantitas harus lebih dari 0"),
  harga: z.number(),
  teknisi: z.string().min(1, "Teknisi wajib diisi"),
  keterangan: z.string().optional(),
});

const ITEMS_PER_PAGE = 10;

export default function DailyBonClient({ data: initialData, users, inventory }: { data: DailyBon[], users: User[], inventory: InventoryItem[] }) {
  const { toast } = useToast();
  const [data, setData] = useState<DailyBon[]>(initialData);
  const [filterTeknisi, setFilterTeknisi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<z.infer<typeof addSchema>>({
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

  const watchedPart = useWatch({ control: form.control, name: "part" });

  useEffect(() => {
    const inventoryItem = inventory.find(item => item.part.toLowerCase() === watchedPart.toLowerCase());
    if (inventoryItem) {
      form.setValue("deskripsi", inventoryItem.deskripsi);
      form.setValue("harga", inventoryItem.total_harga);
    } else {
      form.setValue("deskripsi", "");
      form.setValue("harga", 0);
    }
  }, [watchedPart, inventory, form]);


  const filteredData = useMemo(() => {
    return data.filter(item =>
      (filterTeknisi === '' || item.teknisi === filterTeknisi) &&
      (filterStatus === '' || item.status_bon === filterStatus)
    ).sort((a, b) => new Date(b.tanggal_dailybon).getTime() - new Date(a.tanggal_dailybon).getTime());
  }, [data, filterTeknisi, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);
  
  function onSubmit(values: z.infer<typeof addSchema>) {
    const newBon: DailyBon = {
        id_dailybon: `db-${data.length + 1}`,
        part: values.part,
        deskripsi: values.deskripsi,
        qty_dailybon: values.qty_dailybon,
        harga: values.harga,
        status_bon: 'BON',
        teknisi: values.teknisi,
        tanggal_dailybon: new Date().toISOString().split('T')[0],
        no_tkl: `TKL-2024-${String(data.length + 1).padStart(4, '0')}`,
        keterangan: values.keterangan || '',
    };
    
    setData(prevData => [newBon, ...prevData]);
    toast({ title: "Sukses", description: "Data bon harian berhasil ditambahkan." });
    setIsModalOpen(false);
    form.reset();
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

  return (
    <>
      <PageHeader title="Daily Bon">
        <div className="flex items-center gap-2">
           <Select value={filterTeknisi} onValueChange={(value) => {setFilterTeknisi(value === 'all' ? '' : value); setCurrentPage(1);}}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filter Teknisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Teknisi</SelectItem>
                {users.filter(u => u.role === 'Teknisi').map(user => (
                    <SelectItem key={user.id_user} value={user.nama_teknisi}>{user.nama_teknisi}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah
          </Button>
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
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teknisi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. TKL</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(item => (
                <TableRow key={item.id_dailybon}>
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
            <DialogTitle>Tambah Daily Bon</DialogTitle>
            <DialogDescription>Isi form untuk menambah transaksi sparepart keluar.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name="teknisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teknisi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Teknisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.filter(u => u.role === 'Teknisi').map(user => (
                            <SelectItem key={user.id_user} value={user.nama_teknisi}>{user.nama_teknisi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
    </>
  );
}
