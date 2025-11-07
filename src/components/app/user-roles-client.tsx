
"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { User, Role, Permissions } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useAuth, useCollection, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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
  FormDescription,
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
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

const permissionsSchema = z.object({
  dashboard_view: z.boolean(),
  dashboard_edit: z.boolean(),
  reportstock_view: z.boolean(),
  reportstock_edit: z.boolean(),
  reportstock_delete: z.boolean(),
  bonpds_view: z.boolean(),
  bonpds_edit: z.boolean(),
  bonpds_delete: z.boolean(),
  dailybon_view: z.boolean(),
  dailybon_edit: z.boolean(),
  dailybon_delete: z.boolean(),
  userrole_view: z.boolean(),
  userrole_edit: z.boolean(),
  userrole_delete: z.boolean(),
  msk_view: z.boolean(),
  msk_edit: z.boolean(),
});

const editSchema = z.object({
  role: z.enum(["Admin", "Teknisi", "Manager", "Viewer"]),
  permissions: permissionsSchema,
});

const addSchema = z.object({
  nama_teknisi: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["Admin", "Teknisi", "Manager", "Viewer"]),
});

const rolePermissions: Record<Role, Permissions> = {
  Admin: {
    dashboard_view: true, dashboard_edit: true,
    reportstock_view: true, reportstock_edit: true, reportstock_delete: true,
    bonpds_view: true, bonpds_edit: true, bonpds_delete: true,
    dailybon_view: true, dailybon_edit: true, dailybon_delete: true,
    userrole_view: true, userrole_edit: true, userrole_delete: true,
    msk_view: true, msk_edit: true,
  },
  Manager: {
    dashboard_view: true, dashboard_edit: true,
    reportstock_view: true, reportstock_edit: true, reportstock_delete: false,
    bonpds_view: true, bonpds_edit: true, bonpds_delete: false,
    dailybon_view: true, dailybon_edit: false, dailybon_delete: false,
    userrole_view: true, userrole_edit: true, userrole_delete: false,
    msk_view: true, msk_edit: false,
  },
  Teknisi: {
    dashboard_view: true, dashboard_edit: false,
    reportstock_view: true, reportstock_edit: false, reportstock_delete: false,
    bonpds_view: false, bonpds_edit: false, bonpds_delete: false,
    dailybon_view: true, dailybon_edit: true, dailybon_delete: false,
    userrole_view: true, userrole_edit: false, userrole_delete: false,
    msk_view: false, msk_edit: false,
  },
  Viewer: {
    dashboard_view: true, dashboard_edit: false,
    reportstock_view: false, reportstock_edit: false, reportstock_delete: false,
    bonpds_view: false, bonpds_edit: false, bonpds_delete: false,
    dailybon_view: false, dailybon_edit: false, dailybon_delete: false,
    userrole_view: true, userrole_edit: false, userrole_delete: false,
    msk_view: false, msk_edit: false,
  },
};

const permissionLabels: { id: keyof Permissions, label: string }[] = [
    { id: 'dashboard_view', label: 'View Dashboard' },
    { id: 'dashboard_edit', label: 'Edit Dashboard' },
    { id: 'reportstock_view', label: 'View Report Stock' },
    { id: 'reportstock_edit', label: 'Edit Report Stock' },
    { id: 'reportstock_delete', label: 'Delete Report Stock' },
    { id: 'dailybon_view', label: 'View Daily Bon' },
    { id: 'dailybon_edit', label: 'Edit Daily Bon' },
    { id: 'dailybon_delete', label: 'Delete Daily Bon' },
    { id: 'bonpds_view', label: 'View Bon PDS' },
    { id: 'bonpds_edit', label: 'Edit Bon PDS' },
    { id: 'bonpds_delete', label: 'Delete Bon PDS' },
    { id: 'msk_view', label: 'View MSK' },
    { id: 'msk_edit', label: 'Edit MSK' },
    { id: 'userrole_view', label: 'View User Role' },
    { id: 'userrole_edit', label: 'Edit User Role' },
    { id: 'userrole_delete', label: 'Delete User Role' },
];


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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const selectedRole = editForm.watch('role');

  useEffect(() => {
    if (selectedRole) {
      editForm.setValue('permissions', rolePermissions[selectedRole as Role]);
    }
  }, [selectedRole, editForm]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      role: user.role,
      permissions: user.permissions,
    });
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser || !selectedUser.id || !firestore) return;

    try {
      // NOTE: Deleting a user from Firebase Auth is a privileged operation
      // and should ideally be done from a backend server with Admin SDK.
      // The following `deleteUser` from client-side will likely fail
      // unless the user has recently signed in.
      // For this app, we will just delete the Firestore record.
      await deleteDoc(doc(firestore, 'users', selectedUser.id));
      
      toast({ title: "Sukses", description: `Pengguna ${selectedUser.nama_teknisi} telah dihapus.` });
    } catch (error: any) {
      console.error("Error deleting user: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus pengguna." });
    } finally {
      setIsDeleting(false);
      setSelectedUser(null);
    }
  };

  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedUser || !selectedUser.id || !firestore) return;

    const userRef = doc(firestore, 'users', selectedUser.id);

    try {
      await updateDoc(userRef, { 
        role: values.role,
        permissions: values.permissions,
      });
      toast({ title: "Sukses", description: `Role & hak akses untuk ${selectedUser.nama_teknisi} berhasil diperbarui.` });
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
    
    setIsSubmitting(true);

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
        permissions: rolePermissions[values.role],
      };

      await setDoc(doc(firestore, "users", authUser.uid), newUser);
      
      toast({ title: "Sukses", description: "Pengguna baru berhasil ditambahkan." });
      setIsAddModalOpen(false);
      addForm.reset();

    } catch (error: any)
{
      console.error("Error adding user:", error);
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? "Email ini sudah terdaftar."
        : "Gagal menambahkan pengguna baru. Periksa konsol untuk detailnya.";
      toast({ variant: "destructive", title: "Gagal", description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const roleVariant = {
    'Admin': 'destructive',
    'Manager': 'default',
    'Teknisi': 'secondary',
    'Viewer': 'outline'
  } as const;

  return (
    <>
      <PageHeader title="User Role Management">
        <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah User
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
                <TableHead className="text-right">Action</TableHead>
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
                    <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Tidak ada data pengguna. Klik 'Tambah User' untuk memulai.
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus pengguna atas nama <strong>{selectedUser?.nama_teknisi}</strong>. Data yang dihapus tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Modal */}
      {selectedUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Role: {selectedUser.nama_teknisi}</DialogTitle>
              <DialogDescription>Atur role dan hak akses spesifik untuk pengguna ini.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Preset</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Teknisi">Teknisi</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Memilih preset akan mengatur ulang hak akses di bawah.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />
                
                <div>
                    <h3 className="mb-4 text-lg font-medium">Hak Akses Granular</h3>
                    <div className="space-y-4">
                        {Object.entries(
                            permissionLabels.reduce((acc, p) => {
                                const group = p.id.split('_')[0];
                                if (!acc[group]) acc[group] = [];
                                acc[group].push(p);
                                return acc;
                            }, {} as Record<string, typeof permissionLabels>)
                        ).map(([group, perms]) => (
                            <div key={group}>
                                <h4 className="capitalize font-medium mb-2">{group.replace('userrole', 'user role').replace('reportstock', 'report stock')}</h4>
                                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                                {perms.sort((a, b) => a.label.localeCompare(b.label)).map((permission) => (
                                <FormField
                                    key={permission.id}
                                    control={editForm.control}
                                    name={`permissions.${permission.id}`}
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm">
                                            {permission.label}
                                        </FormLabel>
                                    </FormItem>
                                    )}
                                />
                                ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="sticky bottom-0 bg-background pt-4">
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
                          <SelectItem value="Viewer">Viewer</SelectItem>
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
