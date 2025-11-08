
"use client";

import { useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useUser, useAuth, useDoc, useFirestore, useFirebaseApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/definitions";

import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export default function ProfileClient() {
  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: authUser, isLoading: isAuthLoading, refetch: refetchUser } = useUser();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, "users", authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isUserDocLoading, refetch: refetchDoc } = useDoc<User>(userDocRef);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };
  
  const handleUpload = async (file: File) => {
    if (!authUser || !firebaseApp || !userDocRef) return;

    setIsUploading(true);

    try {
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `avatars/${authUser.uid}/profile.jpg`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update both Auth and Firestore in parallel
      await Promise.all([
          auth.currentUser ? updateProfile(auth.currentUser, { photoURL: downloadURL }) : Promise.resolve(),
          updateDoc(userDocRef, { photoURL: downloadURL })
      ]);
      
      // Refetch user data to show updated photo
      await Promise.all([refetchUser(), refetchDoc()]);
      
      toast({ title: "Sukses!", description: "Foto profil berhasil diperbarui." });

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: "Terjadi kesalahan saat mengunggah foto profil.",
      });
    } finally {
      // This is crucial: always set isUploading to false
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    if (!auth || !authUser || !authUser.email) return;

    const credential = EmailAuthProvider.credential(
      authUser.email,
      values.currentPassword
    );

    try {
      await reauthenticateWithCredential(authUser, credential);
      await updatePassword(authUser, values.newPassword);

      toast({
        title: "Sukses",
        description: "Kata sandi Anda telah berhasil diubah.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      let description = "Terjadi kesalahan. Silakan coba lagi.";
      if (error.code === 'auth/wrong-password') {
        description = "Kata sandi saat ini yang Anda masukkan salah.";
      }
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Kata Sandi",
        description,
      });
    }
  }
  
  const isLoading = isAuthLoading || isUserDocLoading;

  return (
    <>
      <PageHeader title="Profil Pengguna" />
      <div className="p-4 md:p-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Foto Profil</CardTitle>
            <CardDescription>
              Klik pada gambar untuk memilih foto baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
             {isLoading && !isUploading ? (
                <Skeleton className="h-32 w-32 rounded-full" />
             ) : (
                <div className="relative">
                    <Avatar className="h-32 w-32 cursor-pointer" onClick={handleAvatarClick}>
                        <AvatarImage src={authUser?.photoURL || ''} alt={currentUser?.nama_teknisi} />
                        <AvatarFallback>
                            <UserCircle className="h-16 w-16" />
                        </AvatarFallback>
                    </Avatar>
                    {isUploading ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white text-sm">Uploading...</div>
                    ) : (
                       <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer" onClick={handleAvatarClick}>
                          <Camera className="h-4 w-4" />
                       </div>
                    )}
                </div>
             )}
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="image/png, image/jpeg, image/gif"
                disabled={isUploading}
            />
            {isLoading ? (
                <div className="text-center space-y-2">
                    <Skeleton className="h-6 w-40 mx-auto" />
                    <Skeleton className="h-4 w-48 mx-auto" />
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-xl font-semibold">{currentUser?.nama_teknisi}</p>
                    <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubah Kata Sandi</CardTitle>
            <CardDescription>
              Pastikan Anda menggunakan kata sandi yang kuat dan unik.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kata Sandi Saat Ini</FormLabel>
                      <FormControl>
                        <Input type="password" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kata Sandi Baru</FormLabel>
                      <FormControl>
                        <Input type="password" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                      <FormControl>
                        <Input type="password" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Menyimpan..." : "Ubah Kata Sandi"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
