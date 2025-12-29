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
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RootPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            toast({
                title: "Login Berhasil",
                description: `Selamat datang kembali!`,
            });

            router.push(`/dashboard`);
            router.refresh();

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login Gagal",
                description: error.message || "Email atau password salah. Silakan coba lagi.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleLogin}>
                    <Card>
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <Shield className="h-8 w-8 text-primary" />
                                <CardTitle className="text-3xl font-bold tracking-tight font-headline">
                                    Athena
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Masukkan data Anda untuk masuk ke gudang
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Memuat..." : "Login"}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground font-headline mt-2">
                                Belum punya akun?{" "}
                                <Link href="/register" className="text-primary hover:underline font-bold">
                                    Daftar di sini
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
