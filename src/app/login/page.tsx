"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Warehouse } from "lucide-react";
import { usersData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const user = usersData.find(
        (u) =>
          (u.users === username || u.nik === username || u.email === username) &&
          u.password === password
      );

      if (user) {
        toast({
          title: "Login Berhasil",
          description: `Selamat datang kembali, ${user.nama_teknisi}!`,
        });
        router.push(`/`);
      } else {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: "Username atau password salah. Silakan coba lagi.",
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleLogin}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center items-center gap-2">
                <Warehouse className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-bold tracking-tight font-headline">
                  Sparepart Flow
                </CardTitle>
              </div>
              <CardDescription>
                Masukkan data Anda untuk masuk ke gudang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">User/NIK/Email</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Memuat..." : "Login"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
