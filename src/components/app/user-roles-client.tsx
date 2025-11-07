"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Pencil } from 'lucide-react';
import type { User } from '@/lib/definitions';
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

const editSchema = z.object({
  role: z.enum(["Admin", "Teknisi", "Manager"]),
});

export default function UserRolesClient({ data: initialData }: { data: User[] }) {
  const { toast } = useToast();
  const [data, setData] = useState<User[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    form.setValue("role", user.role);
    setIsModalOpen(true);
  };

  function onSubmit(values: z.infer<typeof editSchema>) {
    if (!selectedUser) return;

    setData(prevData =>
      prevData.map(user =>
        user.id_user === selectedUser.id_user
          ? { ...user, role: values.role }
          : user
      )
    );
    toast({ title: "Sukses", description: `Role untuk ${selectedUser.nama_teknisi} berhasil diperbarui.` });
    setIsModalOpen(false);
  }
  
  const roleVariant = {
    'Admin': 'destructive',
    'Manager': 'default',
    'Teknisi': 'secondary'
  } as const;

  return (
    <>
      <PageHeader title="User Role Management" />
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
              {data.map(user => (
                <TableRow key={user.id_user}>
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
              ))}
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
