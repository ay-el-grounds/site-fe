/**
 * GET /api/events
 *
 * Returns all approved events, sorted by date ascending.
 *
 * Query parameters (all optional):
 *   ?month=2026-06         Filter by year-month (YYYY-MM)
 *   ?category=JDM          Filter by a single category string
 *   ?state=NY              Filter by 2-letter state code
 *
 * Response: { events: Event[], total: number }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");     // e.g. "2026-06"
    const category = searchParams.get("category"); // e.g. "JDM"
    const state = searchParams.get("state");     // e.g. "NY"

    // Build the Prisma where clause dynamically
    const where: NonNullable<Parameters<typeof prisma.event.findMany>[0]>["where"] = {
      status: "approved",
    };

    // Filter by month: match events whose date falls within the given month
    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);

      if (!isNaN(year) && !isNaN(monthNum)) {
        const startOfMonth = new Date(year, monthNum - 1, 1);
        const endOfMonth = new Date(year, monthNum, 1); // exclusive upper bound

        where.date = {
          gte: startOfMonth,
          lt: endOfMonth,
        };
      }
    }

    // Filter by category (Postgres array contains)
    if (category) {
      where.categories = {
        has: category.toUpperCase(),
      };
    }

    // Filter by state (case-insensitive match)
    if (state) {
      where.state = state.toUpperCase();
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ events, total: events.length });
  } catch (err) {
    console.error("[GET /api/events] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events." },
      { status: 500 }
    );
  }
}
