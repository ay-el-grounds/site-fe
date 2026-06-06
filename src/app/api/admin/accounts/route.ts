/**
 * Admin API: /api/admin/accounts
 *
 * Manage the list of Instagram accounts Turnout monitors.
 * Protected with x-admin-key header.
 *
 * GET    — List all watched accounts (active + inactive)
 * POST   — Add a new account to monitor { handle: string }
 * DELETE — Remove (deactivate) an account { handle: string }
 *
 * Note: DELETE sets isActive=false rather than deleting the record,
 * so the monitor stops checking it but historical ScrapeLog entries are preserved.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Validate the admin key header */
function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  return !!key && key === process.env.ADMIN_SECRET_KEY;
}

/** Strip leading @ from a handle if the user includes it */
function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// GET — List all watched accounts
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    );
  }

  try {
    const accounts = await prisma.watchedAccount.findMany({
      orderBy: { handle: "asc" },
    });

    return NextResponse.json({ accounts, total: accounts.length });
  } catch (err) {
    console.error("[GET /api/admin/accounts] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch accounts." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Add a new account
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const rawHandle = body?.handle;

    if (!rawHandle || typeof rawHandle !== "string") {
      return NextResponse.json(
        { error: "handle is required (string)." },
        { status: 400 }
      );
    }

    const handle = normalizeHandle(rawHandle);

    if (handle.length === 0) {
      return NextResponse.json(
        { error: "handle cannot be empty." },
        { status: 400 }
      );
    }

    // upsert — if the account was previously deactivated, re-activate it
    const account = await prisma.watchedAccount.upsert({
      where: { handle },
      update: {
        isActive: true,
        displayName: body.displayName ?? undefined,
      },
      create: {
        handle,
        displayName: body.displayName ?? null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/accounts] Error:", err);
    return NextResponse.json(
      { error: "Failed to add account." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — Deactivate an account (soft delete)
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const rawHandle = body?.handle;

    if (!rawHandle || typeof rawHandle !== "string") {
      return NextResponse.json(
        { error: "handle is required (string)." },
        { status: 400 }
      );
    }

    const handle = normalizeHandle(rawHandle);

    const account = await prisma.watchedAccount.findUnique({
      where: { handle },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: `Account @${handle} not found.` },
        { status: 404 }
      );
    }

    // Soft delete — sets isActive to false so the monitor skips it
    await prisma.watchedAccount.update({
      where: { handle },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: `@${handle} has been deactivated and will no longer be monitored.`,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/accounts] Error:", err);
    return NextResponse.json(
      { error: "Failed to remove account." },
      { status: 500 }
    );
  }
}
