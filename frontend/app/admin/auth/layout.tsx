import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminNavbar />
      <main className="flex-1 bg-slate-50">{children}</main>
    </AdminAuthProvider>
  );
}
