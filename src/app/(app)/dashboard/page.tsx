"use client";

import PageHeader from "@/components/app/page-header";

export default function DashboardPage() {
    return (
        <>
            <PageHeader title="Dashboard" />
            <div className="p-4 md:p-6">
                <p>
                    Selamat datang di sistem Gudang Sparepart. Anda telah berhasil masuk.
                </p>
                <p>Pilih menu dari bilah sisi untuk memulai.</p>
            </div>
        </>
    );
}
