
"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useUser, useAuth, useDoc, useFirestore, useFirebaseApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/definitions";
import type { Area } from 'react-easy-crop';

import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../ui/dialog";
import ImageCropper from "./image-cropper";
import { getCroppedImg } from "@/lib/canvas-utils";

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

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, "users", authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isUserDocLoading } = useDoc<User>(userDocRef);

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedImageResult = await getCroppedImg(imageSrc, croppedAreaPixels);
        setCroppedImage(croppedImageResult);
        setIsCropping(false);
        setImageSrc(null);
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Gagal Memotong Gambar",
          description: "Terjadi kesalahan saat memotong gambar.",
        });
      }
    }
  }, [imageSrc, croppedAreaPixels, toast]);


  const handleSaveCroppedImage = async () => {
    if (!croppedImage || !authUser || !userDocRef || !firebaseApp) return;

    setIsUploading(true);

    try {
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `image/${authUser.uid}/profile.jpg`);

      // 1. Unggah string Data URI (sebagai teks) ke Firebase Storage.
      const snapshot = await uploadString(storageRef, croppedImage, 'data_url');
      
      // 2. Dapatkan URL publik dari file yang baru diunggah.
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Tampilkan URL di konsol untuk verifikasi
      console.log('Gambar disimpan di URL publik:', downloadURL);

      // 3. Perbarui hanya dokumen Firestore dengan URL baru.
      await updateDoc(userDocRef, { photoURL: downloadURL });
      
      toast({
          title: "Sukses!",
          description: "Foto profil berhasil diperbarui.",
      });

      // 4. Bersihkan pratinjau gambar yang dipotong
      setCroppedImage(null);

    } catch (error) {
        console.error("Error saving profile image:", error);
        toast({
            variant: "destructive",
            title: "Gagal Menyimpan",
            description: "Terjadi kesalahan saat menyimpan foto profil. Coba lagi.",
        });
    } finally {
        setIsUploading(false);
    }
  };

  async function onSubmitPassword(values: z.infer<typeof passwordSchema>) {
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
  const displayImage = croppedImage || currentUser?.photoURL;

  return (
    <>
      <PageHeader title="Profil Pengguna" />
      <div className="p-4 md:p-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Foto Profil</CardTitle>
            <CardDescription>
              Klik pada gambar untuk memilih dan memotong foto baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
             {isLoading && !displayImage ? (
                <Skeleton className="h-32 w-32 rounded-full" />
             ) : (
                <div className="relative">
                    <Avatar className="h-32 w-32 cursor-pointer" onClick={handleAvatarClick}>
                        <AvatarImage src={displayImage || ''} alt={currentUser?.nama_teknisi} />
                        <AvatarFallback>
                            <UserCircle className="h-16 w-16" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer" onClick={handleAvatarClick}>
                       <Camera className="h-4 w-4" />
                    </div>
                </div>
             )}
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="image/png, image/jpeg"
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
          {croppedImage && (
            <CardFooter className="flex-col gap-2">
                <p className="text-sm text-muted-foreground">Pratinjau telah diperbarui. Klik simpan untuk menerapkan.</p>
                <Button onClick={handleSaveCroppedImage} disabled={isUploading} className="w-full">
                    {isUploading ? "Menyimpan..." : "Simpan Foto"}
                </Button>
            </CardFooter>
          )}
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
              <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-4">
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

      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Potong Gambar</DialogTitle>
                <DialogDescription>
                    Sesuaikan gambar Anda. Geser untuk memindahkan dan scroll untuk zoom.
                </DialogDescription>
            </DialogHeader>
            <div className="relative w-full h-80">
                {imageSrc && <ImageCropper imageSrc={imageSrc} onCropComplete={onCropComplete} />}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" onClick={() => {setIsCropping(false); setImageSrc(null);}}>Batal</Button>
                </DialogClose>
                <Button onClick={handleApplyCrop}>Potong & Terapkan Pratinjau</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    