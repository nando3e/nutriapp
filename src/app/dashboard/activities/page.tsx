import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActivitiesManager } from "@/components/ActivitiesManager";

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const list = await db
    .select()
    .from(activities)
    .where(eq(activities.userId, session.user.id))
    .orderBy(activities.name);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Mis actividades</h1>
      <ActivitiesManager initialActivities={list} userId={session.user.id} />
    </div>
  );
}
