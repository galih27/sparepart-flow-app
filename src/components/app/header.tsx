
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  LogOut,
  Search,
  UserCircle,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User } from "@/lib/definitions";
import { Skeleton } from "../ui/skeleton";
import { getAuth, signOut } from "firebase/auth";

function HeaderContent() {
  const router = useRouter();
  const { user: authUser, isLoading: isLoadingUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isLoadingRole } = useDoc<User>(userDocRef);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    // Hapus cookie saat logout
    document.cookie = 'firebaseIdToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push("/login");
  };

  const isLoading = isLoadingUser || isLoadingRole;
  
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg md:text-xl font-headline">
          <Shield className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Athena</span>
        </Link>
      </div>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari menu aplikasi..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={currentUser?.photo} alt={currentUser?.nama_teknisi} />
              <AvatarFallback>
                {isLoading ? (
                  <Skeleton className="h-9 w-9 rounded-full" />
                ) : currentUser?.nama_teknisi ? (
                  getInitials(currentUser.nama_teknisi)
                ) : (
                  <UserCircle />
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
             {isLoading ? (
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              ) : (
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.nama_teknisi || 'Pengguna'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email || 'Tidak ada email'}
                  </p>
                </div>
              )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push('/profile')}>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profil ({currentUser?.role || '...'})</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-14 sm:h-16 border-b" />}>
      <HeaderContent />
    </Suspense>
  )
}
