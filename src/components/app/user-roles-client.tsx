"use client";

import { useState, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FileUp, Pencil } from 'lucide-react';
import type { User } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { usersMockData } from '@/lib/users-mock';

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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';

const editSchema = z.object({
  role: z.enum(["Admin", "Teknisi", "Manager"]),
});

export default function UserRolesClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data, isLoading } = useCollection<User>(usersQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    form.setValue("role", user.role);
    setIsModalOpen(true);
  };
  
  const handleImport = async () => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Gagal", description: "Koneksi Firestore tidak tersedia." });
      return;
    }
    if (data && data.length > 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Data pengguna sudah ada. Hapus data lama untuk mengimpor." });
      return;
    }
    setIsImporting(true);
    toast({ title: "Mengimpor Data", description: "Mohon tunggu, data pengguna sedang diimpor..." });

    try {
      const batch = writeBatch(firestore);
      usersMockData.forEach((user) => {
        const docRef = doc(collection(firestore, "users"));
        // We don't store password in firestore document
        const { password, ...userData } = user;
        batch.set(docRef, userData);
      });
      await batch.commit();
      toast({ title: "Sukses", description: `${usersMockData.length} data pengguna berhasil diimpor.` });
    } catch (error) {
      console.error("Error importing data: ", error);
      toast({ variant: "destructive", title: "Gagal Impor", description: "Terjadi kesalahan saat mengimpor data." });
    } finally {
      setIsImporting(false);
    }
  };

  async function onSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedUser || !selectedUser.id || !firestore) return;

    const userRef = doc(firestore, 'users', selectedUser.id);

    try {
      await updateDoc(userRef, { role: values.role });
      toast({ title: "Sukses", description: `Role untuk ${selectedUser.nama_teknisi} berhasil diperbarui.` });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui data role." });
    }
  }
  
  const roleVariant = {
    'Admin': 'destructive',
    'Manager': 'default',
    'Teknisi': 'secondary'
  } as const;

  return (
    <>
      <PageHeader title="User Role Management">
        <Button variant="outline" onClick={handleImport} disabled={isImporting || (data && data.length > 0)}>
          <FileUp className="mr-2" /> {isImporting ? 'Mengimpor...' : 'Import Users'}
        </Button>
      </PageHeader>
      <div className="p-4 md:p-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Teknisi</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Tidak ada data pengguna. Klik 'Import Users' untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                data.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nama_teknisi}</TableCell>
                    <TableCell>{user.nik}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[user.role] || 'outline'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedUser && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Role: {selectedUser.nama_teknisi}</DialogTitle>
              <DialogDescription>Pilih role baru untuk user ini.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Teknisi">Teknisi</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
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
    </>
  );
}
