"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, Suspense } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  LogOut,
  Search,
  UserCircle,
  Warehouse,
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

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "User";
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

  const handleLogout = () => {
    router.push("/login");
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg md:text-xl font-headline">
          <Warehouse className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Sparepart Flow</span>
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
              {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={userName} data-ai-hint={userAvatar.imageHint} />}
              <AvatarFallback>
                <UserCircle />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userName.toLowerCase().replace(' ','_')}@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profil</span>
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
