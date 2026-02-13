import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FoodsManager } from "@/components/FoodsManager";

export default async function FoodsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const list = await db
    .select()
    .from(foods)
    .where(eq(foods.userId, session.user.id))
    .orderBy(foods.name);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Mis alimentos</h1>
      <FoodsManager initialFoods={list} userId={session.user.id} />
    </div>
  );
}
