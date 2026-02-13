import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AdminUsers } from "@/components/AdminUsers";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if ((session.user as { role?: string }).role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Administración — Usuarios</h1>
      <AdminUsers />
    </div>
  );
}
