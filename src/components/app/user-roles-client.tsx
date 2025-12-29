"use client";

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Pencil, Plus, Trash2, UserCircle } from 'lucide-react';
import type { User, Role, Permissions } from '@/lib/definitions';
import { ROLE_PERMISSIONS } from '@/lib/definitions';
import { useToast } from "@/hooks/use-toast";
import { useAPIFetch, api } from '@/hooks/use-api';

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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
  msk_delete: z.boolean(),
  nr_view: z.boolean(),
  nr_edit: z.boolean(),
  nr_delete: z.boolean(),
  tsn_view: z.boolean(),
  tsn_edit: z.boolean(),
  tsn_delete: z.boolean(),
  tsp_view: z.boolean(),
  tsp_edit: z.boolean(),
  tsp_delete: z.boolean(),
  sob_view: z.boolean(),
  sob_edit: z.boolean(),
  sob_delete: z.boolean(),
});

const editSchema = z.object({
  nama_teknisi: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
  email: z.string().email("Email tidak valid"),
  photo: z.string().optional(),
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
  { id: 'msk_delete', label: 'Delete MSK' },
  { id: 'nr_view', label: 'View NR' },
  { id: 'nr_edit', label: 'Edit NR' },
  { id: 'nr_delete', label: 'Delete NR' },
  { id: 'tsn_view', label: 'View TSN' },
  { id: 'tsn_edit', label: 'Edit TSN' },
  { id: 'tsn_delete', label: 'Delete TSN' },
  { id: 'tsp_view', label: 'View TSP' },
  { id: 'tsp_edit', label: 'Edit TSP' },
  { id: 'tsp_delete', label: 'Delete TSP' },
  { id: 'sob_view', label: 'View SOB' },
  { id: 'sob_edit', label: 'Edit SOB' },
  { id: 'sob_delete', label: 'Delete SOB' },
  { id: 'userrole_view', label: 'View User Role' },
  { id: 'userrole_edit', label: 'Edit User Role' },
  { id: 'userrole_delete', label: 'Delete User Role' },
];

export default function UserRolesClient() {
  const { toast } = useToast();

  const { data, isLoading, refetch } = useAPIFetch<User>('/api/users');

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
    if (selectedRole && isEditModalOpen) {
      editForm.setValue('permissions', ROLE_PERMISSIONS[selectedRole as Role]);
    }
  }, [selectedRole, editForm, isEditModalOpen]);

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

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    const perms = parsePermissions(user.permissions);
    editForm.reset({
      nama_teknisi: user.nama_teknisi,
      nik: user.nik,
      email: user.email,
      photo: user.photo || "",
      role: user.role,
      permissions: perms || ROLE_PERMISSIONS[user.role],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser || !selectedUser.id) return;

    const result = await api.delete(`/api/users/${selectedUser.id}`);

    if (result.error) {
      toast({ variant: "destructive", title: "Gagal", description: result.error.message });
    } else {
      toast({ title: "Sukses", description: `Pengguna ${selectedUser.nama_teknisi} telah dihapus.` });
      await refetch();
    }

    setIsDeleting(false);
    setSelectedUser(null);
  };

  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedUser || !selectedUser.id) return;

    const result = await api.put(`/api/users/${selectedUser.id}`, values);

    if (result.error) {
      toast({ variant: "destructive", title: "Gagal", description: result.error.message });
    } else {
      toast({ title: "Sukses", description: `Role & hak akses untuk ${selectedUser.nama_teknisi} berhasil diperbarui.` });
      setIsEditModalOpen(false);
      await refetch();
    }
  }

  async function onAddSubmit(values: z.infer<typeof addSchema>) {
    setIsSubmitting(true);

    const result = await api.post('/api/users', {
      ...values,
      permissions: ROLE_PERMISSIONS[values.role],
      photo: `https://picsum.photos/seed/${values.nik}/200/200`,
    });

    if (result.error) {
      toast({ variant: "destructive", title: "Gagal", description: result.error.message });
    } else {
      toast({ title: "Sukses", description: "Pengguna baru berhasil ditambahkan." });
      setIsAddModalOpen(false);
      addForm.reset();
      await refetch();
    }

    setIsSubmitting(false);
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
        <div className="border rounded-lg bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Nama Teknisi</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Photo URL</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Tidak ada data pengguna. Klik 'Tambah User' untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                data.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={user.photo} alt={user.nama_teknisi} />
                        <AvatarFallback>
                          <UserCircle className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.nama_teknisi}</TableCell>
                    <TableCell>{user.nik}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[user.role] || 'outline'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="block max-w-[150px] truncate">
                              {user.photo || '-'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs break-all">{user.photo || 'Tidak ada URL'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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

      {selectedUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-2xl px-0 pb-0">
            <DialogHeader className="px-6">
              <DialogTitle>Edit Role: {selectedUser.nama_teknisi}</DialogTitle>
              <DialogDescription>Atur role dan hak akses spesifik untuk pengguna ini.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="nama_teknisi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl><Input placeholder="Nama Lengkap" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="nik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIK</FormLabel>
                          <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role Preset</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl>
                        <FormDescription>URL foto profil pengguna.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormDescription>Memilih preset role akan mengatur ulang hak akses di bawah sesuai standar role tersebut.</FormDescription>

                  <Separator />

                  <div>
                    <h3 className="mb-4 text-lg font-medium">Hak Akses Granular</h3>
                    <div className="space-y-6">
                      {Object.entries(
                        permissionLabels.reduce((acc, p) => {
                          const group = p.id.split('_')[0];
                          if (!acc[group]) acc[group] = [];
                          acc[group].push(p);
                          return acc;
                        }, {} as Record<string, typeof permissionLabels>)
                      ).map(([group, perms]) => (
                        <div key={group} className="space-y-3">
                          <h4 className="capitalize font-medium text-sm text-muted-foreground">
                            {group.replace('userrole', 'user role').replace('reportstock', 'report stock')}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-4">
                            {perms.sort((a, b) => a.label.localeCompare(b.label)).map((permission) => (
                              <FormField
                                key={permission.id}
                                control={editForm.control}
                                name={`permissions.${permission.id}`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-1">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-xs cursor-pointer">
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
                </div>

                <DialogFooter className="bg-muted/50 px-6 py-4 rounded-b-lg border-t gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">Batal</Button>
                  </DialogClose>
                  <Button type="submit">Simpan Perubahan</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

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
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={addForm.control} name="nik" render={({ field }) => (
                  <FormItem><FormLabel>NIK</FormLabel><FormControl><Input placeholder="12345678" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={addForm.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
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
                )} />
              </div>
              <FormField control={addForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contoh@email.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={addForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Minimal 6 karakter" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <DialogFooter className="pt-4">
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
