"use client";

import { usePathname, useSearchParams, Suspense } from "next/navigation";
import Link from "next/link";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Warehouse,
  Truck,
  ArrowRightLeft,
  PackagePlus,
  Users,
} from "lucide-react";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/report-stock", label: "Report Stock", icon: Warehouse },
  { href: "/daily-bon", label: "Daily Bon", icon: Truck },
  { href: "/bon-pds", label: "Bon PDS", icon: ArrowRightLeft },
  { href: "/msk", label: "MSK", icon: PackagePlus },
  { href: "/user-roles", label: "User Role", icon: Users },
];

function SidebarNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = searchParams.get('user');

  const createHref = (href: string) => {
    const params = new URLSearchParams();
    if (user) {
      params.append('user', user);
    }
    return `${href}?${params.toString()}`;
  }

  return (
    <SidebarContent>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={createHref(item.href)} passHref>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
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
