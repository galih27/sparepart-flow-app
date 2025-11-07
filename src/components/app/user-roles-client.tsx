"use client";

import { useState, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FileUp, Pencil, Plus } from 'lucide-react';
import type { User } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useAuth, useCollection, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
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
import { Input } from '../ui/input';

const editSchema = z.object({
  role: z.enum(["Admin", "Teknisi", "Manager"]),
});

const addSchema = z.object({
  nama_teknisi: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["Admin", "Teknisi", "Manager"]),
});

export default function UserRolesClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data, isLoading } = useCollection<User>(usersQuery);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const addForm = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      nama_teknisi: "",
      nik: "",
      email: "",
      password: "",
      role: "Teknisi",
    }
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    editForm.setValue("role", user.role);
    setIsEditModalOpen(true);
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
        const { password, ...userData } = user;
        // Let firestore create a unique ID
        const docRef = doc(collection(firestore, "users")); 
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

  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedUser || !selectedUser.id || !firestore) return;

    const userRef = doc(firestore, 'users', selectedUser.id);

    try {
      await updateDoc(userRef, { role: values.role });
      toast({ title: "Sukses", description: `Role untuk ${selectedUser.nama_teknisi} berhasil diperbarui.` });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui data role." });
    }
  }

  async function onAddSubmit(values: z.infer<typeof addSchema>) {
    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Gagal", description: "Layanan otentikasi atau database tidak tersedia." });
      return;
    }
    
    setIsAddingUser(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const authUser = userCredential.user;

      // 2. Save user data to Firestore, using the auth UID as the document ID
      const newUser: Omit<User, 'id' | 'password'> = {
        users: values.email.split('@')[0],
        nik: values.nik,
        nama_teknisi: values.nama_teknisi,
        email: values.email,
        role: values.role,
      };

      await setDoc(doc(firestore, "users", authUser.uid), newUser);
      
      toast({ title: "Sukses", description: "Pengguna baru berhasil ditambahkan." });
      setIsAddModalOpen(false);
      addForm.reset();

    } catch (error: any) {
      console.error("Error adding user:", error);
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? "Email ini sudah terdaftar."
        : "Gagal menambahkan pengguna baru. Periksa konsol untuk detailnya.";
      toast({ variant: "destructive", title: "Gagal", description: errorMessage });
    } finally {
        setIsAddingUser(false);
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
        <div className='flex items-center gap-2'>
            <Button variant="outline" onClick={handleImport} disabled={isImporting || (data && data.length > 0)}>
              <FileUp className="mr-2" /> {isImporting ? 'Mengimpor...' : 'Import Users'}
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah User
            </Button>
        </div>
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

      {/* Edit User Modal */}
      {selectedUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Role: {selectedUser.nama_teknisi}</DialogTitle>
              <DialogDescription>Pilih role baru untuk user ini.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
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

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Isi detail untuk membuat akun pengguna baru.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
               <FormField control={addForm.control} name="nama_teknisi" render={({ field }) => (
                  <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Contoh: Budi Santoso" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={addForm.control} name="nik" render={({ field }) => (
                  <FormItem><FormLabel>NIK</FormLabel><FormControl><Input placeholder="Contoh: 12345678" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={addForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contoh@email.com" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
                <FormField control={addForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Minimal 6 karakter" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              <FormField
                  control={addForm.control}
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
                  <Button type="button" variant="secondary" onClick={() => addForm.reset()}>Batal</Button>
                </DialogClose>
                <Button type="submit" disabled={isAddingUser}>
                  {isAddingUser ? "Menyimpan..." : "Simpan Pengguna"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
