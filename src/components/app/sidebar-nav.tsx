"use client";

import { usePathname } from "next/navigation";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { doc } from "firebase/firestore";
import { useDoc, useFirestore, useUser } from "@/firebase";
import type { User } from "@/lib/definitions";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Warehouse,
  Truck,
  ArrowRightLeft,
  PackagePlus,
  Users,
} from "lucide-react";

const allMenuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Manager", "Teknisi"] },
  { href: "/report-stock", label: "Report Stock", icon: Warehouse, roles: ["Admin", "Manager"] },
  { href: "/daily-bon", label: "Daily Bon", icon: Truck, roles: ["Admin", "Manager", "Teknisi"] },
  { href: "/bon-pds", label: "Bon PDS", icon: ArrowRightLeft, roles: ["Admin", "Manager"] },
  { href: "/msk", label: "MSK", icon: PackagePlus, roles: ["Admin", "Manager"] },
  { href: "/user-roles", label: "User Role", icon: Users, roles: ["Admin"] },
];

function SidebarNavContent() {
  const pathname = usePathname();
  const { user: authUser, isLoading: isLoadingUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isLoadingRole } = useDoc<User>(userDocRef);

  const userRole = currentUser?.role;
  const isLoading = isLoadingUser || isLoadingRole;

  const menuItems = useMemo(() => {
    if (!userRole) return [];
    return allMenuItems.filter(item => item.roles.includes(userRole));
  }, [userRole]);

  return (
    <SidebarContent>
      <SidebarMenu>
        {isLoading ? (
           Array.from({ length: 5 }).map((_, index) => <SidebarMenuSkeleton key={index} showIcon />)
        ) : (
          menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarContent>
  );
}

export default function SidebarNav() {
  return (
    <Suspense fallback={<SidebarContent />}>
      <SidebarNavContent />
    </Suspense>
  )
}
