/**
 * TEMPLATE: Generic Client Component - MySQL Version
 * 
 * Use this as reference when updating Firebase-based client components to MySQL
 * 
 * Files to update:
 * - report-stock-client.tsx
 * - msk-client.tsx
 * - daily-bon-client.tsx
 * - bon-pds-client.tsx
 */

"use client";

import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAPIFetch, useCurrentUser, api } from '@/hooks/use-api';
import type { YourDataType } from '@/lib/definitions';

export default function YourClientComponent() {
    const { toast } = useToast();

    // ===== AUTHENTICATION =====
    const { user: authUser, isLoading: isLoadingAuth } = useCurrentUser();

    // ===== FETCH DATA =====
    const { data, isLoading: isLoadingData, refetch } = useAPIFetch<YourDataType>('/api/your-endpoint');

    // ===== USER PERMISSIONS (if needed) =====
    const userEndpoint = authUser?.uid ? `/api/users/${authUser.uid}` : null;
    const { data: currentUser } = useAPIDoc<User>(userEndpoint);
    const permissions = currentUser?.permissions;

    // ===== STATE =====
    const [selectedItem, setSelectedItem] = useState<YourDataType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ===== COMPUTED VALUES =====
    const isLoading = isLoadingAuth || isLoadingData;

    // ===== HANDLERS =====

    /**
     * CREATE - Add new item
     */
    const handleCreate = async (values: any) => {
        setIsSubmitting(true);

        try {
            const result = await api.post('/api/your-endpoint', values);

            if (result.error) {
                throw result.error;
            }

            toast({
                title: "Sukses",
                description: "Data berhasil ditambahkan."
            });

            setIsModalOpen(false);
            await refetch(); // Refresh data

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error instanceof Error ? error.message : "Terjadi kesalahan"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * UPDATE - Edit existing item
     */
    const handleUpdate = async (id: string, values: any) => {
        setIsSubmitting(true);

        try {
            const result = await api.put(`/api/your-endpoint/${id}`, values);

            if (result.error) {
                throw result.error;
            }

            toast({
                title: "Sukses",
                description: "Data berhasil diperbarui."
            });

            setIsModalOpen(false);
            await refetch(); // Refresh data

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error instanceof Error ? error.message : "Terjadi kesalahan"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * DELETE - Remove item
     */
    const handleDelete = async (id: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            return;
        }

        try {
            const result = await api.delete(`/api/your-endpoint/${id}`);

            if (result.error) {
                throw result.error;
            }

            toast({
                title: "Sukses",
                description: "Data berhasil dihapus."
            });

            await refetch(); // Refresh data

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error instanceof Error ? error.message : "Terjadi kesalahan"
            });
        }
    };

    /**
     * BATCH DELETE - Remove multiple items
     */
    const handleBatchDelete = async (ids: string[]) => {
        if (!window.confirm(`Hapus ${ids.length} data?`)) {
            return;
        }

        try {
            // Option 1: Delete one by one
            await Promise.all(
                ids.map(id => api.delete(`/api/your-endpoint/${id}`))
            );

            // Option 2: Use batch endpoint (if you created one)
            // await api.post('/api/your-endpoint/batch-delete', { ids });

            toast({
                title: "Sukses",
                description: `${ids.length} data berhasil dihapus.`
            });

            await refetch();

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error instanceof Error ? error.message : "Terjadi kesalahan"
            });
        }
    };

    /**
     * BULK IMPORT - Import from Excel/CSV
     */
    const handleImport = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/your-endpoint/import', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Import failed');
            }

            const result = await response.json();

            toast({
                title: "Sukses",
                description: `${result.count} data berhasil diimport.`
            });

            await refetch();

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal Import",
                description: error instanceof Error ? error.message : "Terjadi kesalahan"
            });
        }
    };

    /**
     * EXPORT - Export to Excel/CSV
     */
    const handleExport = () => {
        if (!data || data.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Gagal Export',
                description: 'Tidak ada data untuk diexport.'
            });
            return;
        }

        // Option 1: Client-side export (using xlsx)
        const XLSX = require('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, 'export.xlsx');

        // Option 2: Server-side export
        // window.open('/api/your-endpoint/export', '_blank');

        toast({
            title: 'Sukses',
            description: 'Data berhasil diexport.'
        });
    };

    // ===== RENDER =====
    return (
        <>
            <PageHeader title="Your Page Title">
                <Button onClick={() => setIsModalOpen(true)} disabled={!permissions?.your_edit}>
                    <Plus className="mr-2 h-4 w-4" /> Add New
                </Button>
            </PageHeader>

            <div className="p-4 md:p-6">
                {isLoading ? (
                    <div>Loading...</div>
                ) : !data || data.length === 0 ? (
                    <div>No data available</div>
                ) : (
                    <div>
                        {/* Your data table/list here */}
                        {data.map(item => (
                            <div key={item.id}>
                                {/* Item display */}
                                <Button onClick={() => handleUpdate(item.id, { ...})}>
                                    Edit
                                </Button>
                                <Button onClick={() => handleDelete(item.id)}>
                                    Delete
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals, dialogs, etc. */}
        </>
    );
}

/**
 * ===== NOTES =====
 * 
 * 1. Replace all Firebase imports:
 *    ❌ import { useCollection, useFirestore } from '@/firebase';
 *    ✅ import { useAPIFetch, api } from '@/hooks/use-api';
 * 
 * 2. Replace Firebase operations:
 *    ❌ await addDoc(collection(firestore, 'inventory'), data);
 *    ✅ await api.post('/api/inventory', data);
 * 
 * 3. Use refetch() instead of manual refresh:
 *    ❌ window.location.reload();
 *    ✅ await refetch();
 * 
 * 4. Remove Firebase error handling:
 *    ❌ const permissionError = new FirestorePermissionError({...});
 *    ✅ toast({ variant: "destructive", title: "Error", description: error.message });
 * 
 * 5. API endpoints to create:
 *    - GET    /api/your-endpoint        - List all
 *    - GET    /api/your-endpoint/[id]   - Get one
 *    - POST   /api/your-endpoint        - Create
 *    - PUT    /api/your-endpoint/[id]   - Update
 *    - DELETE /api/your-endpoint/[id]   - Delete
 *    - POST   /api/your-endpoint/import - Bulk import
 *    - GET    /api/your-endpoint/export - Export
 */
