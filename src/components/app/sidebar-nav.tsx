
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useCurrentUser, useAPIDoc } from "@/hooks/use-api";
import type { User } from "@/lib/definitions";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  ReceiptText,
  ClipboardCheck,
  PackageCheck,
  ClipboardList,
} from "lucide-react";

const allMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: 'dashboard_view' },
  { href: "/report-stock", label: "Report Stock", icon: Warehouse, permission: 'reportstock_view' },
  { href: "/daily-bon", label: "Daily Bon", icon: Truck, permission: 'dailybon_view' },
  { href: "/bon-pds", label: "Bon PDS", icon: ArrowRightLeft, permission: 'bonpds_view' },
  { href: "/msk", label: "MSK", icon: PackagePlus, permission: 'msk_view' },
  { href: "/nr", label: "NR", icon: ReceiptText, permission: 'nr_view' },
  { href: "/tsn", label: "TSN", icon: ClipboardCheck, permission: 'tsn_view' },
  { href: "/tsp", label: "TSP", icon: PackageCheck, permission: 'tsp_view' },
  { href: "/sob", label: "SOB", icon: ClipboardList, permission: 'sob_view' },
  { href: "/user-roles", label: "User Role", icon: Users, permission: 'userrole_view' },
] as const;

function SidebarNavContent() {
  const pathname = usePathname();
  const { user: authUser, isLoading } = useCurrentUser();
  const permissions = authUser?.permissions;

  const menuItems = useMemo(() => {
    if (isLoading || !permissions) return [];

    // Ensure permissions is an object
    const perms = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;

    if (!perms) return [];

    // Re-order SOB to be after MSK
    const order = ['/dashboard', '/report-stock', '/daily-bon', '/bon-pds', '/msk', '/sob', '/nr', '/tsn', '/tsp', '/user-roles'];
    const sortedItems = [...allMenuItems].sort((a, b) => {
      return order.indexOf(a.href) - order.indexOf(b.href);
    });

    return sortedItems.filter(item => {
      // Dashboard is usually visible to all authenticated users
      if (item.href === '/dashboard') return true;
      return perms[item.permission] === true || perms[item.permission] === 1;
    });
  }, [permissions, isLoading]);

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => <SidebarMenuSkeleton key={index} showIcon />)
            ) : menuItems.length > 0 ? (
              menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref legacyBehavior={false}>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                      tooltip={item.label}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                Menu tidak tersedia
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
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
