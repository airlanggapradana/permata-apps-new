import { NextResponse } from "next/server";
import { getSessionUser, getUserTreeStats } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
        treeStats: null,
      });
    }

    const treeStats = await getUserTreeStats(user.userId, user.childId);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
      treeStats,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        user: null,
        treeStats: null,
        error: "Gagal memeriksa sesi akun.",
      },
      { status: 500 }
    );
  }
}
