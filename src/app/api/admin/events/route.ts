/**
 * Admin API: /api/admin/events
 *
 * Protected with x-admin-key header. Requires ADMIN_SECRET_KEY env var.
 *
 * GET  — Returns all pending events awaiting review
 * PATCH — Approve or reject an event
 *
 * Headers required:
 *   x-admin-key: <ADMIN_SECRET_KEY>
 *
 * PATCH body:
 *   { id: string, action: "approve" | "reject" }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Validate the admin key header. Returns true if authorized. */
function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  return !!key && key === process.env.ADMIN_SECRET_KEY;
}

// ---------------------------------------------------------------------------
// GET — List pending events for review
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    );
  }

  try {
    const events = await prisma.event.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" }, // Review oldest submissions first
    });

    return NextResponse.json({ events, total: events.length });
  } catch (err) {
    console.error("[GET /api/admin/events] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pending events." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — Approve or reject an event
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "id is required." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    // Map action to the status string stored in the database
    const newStatus = action === "approve" ? "approved" : "rejected";

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      status: updated.status,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/events] Error:", err);
    return NextResponse.json(
      { error: "Failed to update event." },
      { status: 500 }
    );
  }
}
