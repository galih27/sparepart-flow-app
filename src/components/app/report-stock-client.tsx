"use client";

import { useState, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, FileDown, FileUp, Pencil, Search } from 'lucide-react';
import type { InventoryItem } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";

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

const editSchema = z.object({
  qty_baik: z.coerce.number().min(0, "Kuantitas tidak boleh negatif"),
  qty_rusak: z.coerce.number().min(0, "Kuantitas tidak boleh negatif"),
});

const ITEMS_PER_PAGE = 10;

export default function ReportStockClient({ data: initialData }: { data: InventoryItem[] }) {
  const { toast } = useToast();
  const [data, setData] = useState<InventoryItem[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

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

  function onSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedItem) return;

    setData(prevData =>
      prevData.map(item =>
        item.id_inventory === selectedItem.id_inventory
          ? { ...item, ...values, available_qty: values.qty_baik + values.qty_rusak, qty_real: values.qty_baik + values.qty_rusak }
          : item
      )
    );
    toast({ title: "Sukses", description: "Data stok berhasil diperbarui." });
    setIsModalOpen(false);
    setIsEditing(false);
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
        <Button variant="outline"><FileUp className="mr-2" /> Import</Button>
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
              {paginatedData.map(item => (
                <TableRow key={item.id_inventory}>
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
