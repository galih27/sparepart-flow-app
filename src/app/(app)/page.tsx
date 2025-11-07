"use client";

import { Suspense } from 'react';
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/app/page-header";

function DashboardContent() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Pengguna";

  return (
    <>
      <PageHeader title={`Selamat Datang, ${userName}!`} />
      <div className="p-4 md:p-6">
        <p>Anda telah berhasil masuk ke sistem Gudang Sparepart.</p>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
