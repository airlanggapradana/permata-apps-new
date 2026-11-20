import { redirect } from "next/navigation";
import MoodFoodAnalyzer from "@/components/pages/MoodFoodAnalyzer";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MoodFoodPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login?next=/mood-food");
  }

  return <MoodFoodAnalyzer />;
}
