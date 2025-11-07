
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
  { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: 'dashboard_view' },
  { href: "/report-stock", label: "Report Stock", icon: Warehouse, permission: 'reportstock_view' },
  { href: "/daily-bon", label: "Daily Bon", icon: Truck, permission: 'dailybon_view' },
  { href: "/bon-pds", label: "Bon PDS", icon: ArrowRightLeft, permission: 'bonpds_view' },
  { href: "/msk", label: "MSK", icon: PackagePlus, permission: 'msk_view' },
  { href: "/user-roles", label: "User Role", icon: Users, permission: 'userrole_view' },
] as const;

function SidebarNavContent() {
  const pathname = usePathname();
  const { user: authUser, isLoading: isLoadingUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: currentUser, isLoading: isLoadingRole } = useDoc<User>(userDocRef);

  const isLoading = isLoadingUser || isLoadingRole;
  const permissions = currentUser?.permissions;

  const menuItems = useMemo(() => {
    if (isLoading || !permissions) return [];
    return allMenuItems.filter(item => permissions[item.permission]);
  }, [permissions, isLoading]);

  return (
    <SidebarContent>
      <SidebarMenu>
        {isLoading ? (
           Array.from({ length: 6 }).map((_, index) => <SidebarMenuSkeleton key={index} showIcon />)
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
