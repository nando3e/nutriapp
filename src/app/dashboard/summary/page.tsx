import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SummaryView } from "@/components/SummaryView";

export default async function SummaryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Resumen por periodo</h1>
      <SummaryView />
    </div>
  );
}
