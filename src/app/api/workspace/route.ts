import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function GET() {
  try {
    const [studentsRes, pricesRes, statsRes] = await Promise.allSettled([
      api.listStudents({ limit: 100 }),
      api.listPrices(),
      api.stats(),
    ]);

    return NextResponse.json({
      students: studentsRes.status === "fulfilled" ? studentsRes.value.students : [],
      prices: pricesRes.status === "fulfilled" ? pricesRes.value.prices : [],
      stats: statsRes.status === "fulfilled" ? statsRes.value : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
