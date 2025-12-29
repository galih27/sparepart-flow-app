"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        username: "",
        nik: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Pendaftaran Gagal",
                description: "Password dan Konfirmasi Password tidak cocok.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    nik: formData.nik,
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            toast({
                title: "Pendaftaran Berhasil",
                description: "Akun Anda telah berhasil dibuat!",
            });

            router.push(`/`);
            router.refresh();

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Pendaftaran Gagal",
                description: error.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
            <div className="w-full max-w-md">
                <form onSubmit={handleRegister}>
                    <Card>
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <Shield className="h-8 w-8 text-primary" />
                                <CardTitle className="text-3xl font-bold tracking-tight font-headline">
                                    Athena
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Buat akun baru untuk mengakses sistem gudang
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        placeholder="johndoe"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nik">NIK</Label>
                                    <Input
                                        id="nik"
                                        placeholder="12345678"
                                        required
                                        value={formData.nik}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nama Lengkap</Label>
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="********"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="********"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Memproses..." : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" /> Daftar Sekarang
                                    </>
                                )}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground font-headline mt-2">
                                Sudah punya akun?{" "}
                                <Link href="/login" className="text-primary hover:underline font-bold">
                                    Login di sini
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
