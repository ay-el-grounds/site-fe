/**
 * POST /api/events/submit
 *
 * Accepts user-submitted event proposals.
 * Events are saved with status "pending" for admin review before going live.
 *
 * Request body (JSON):
 * {
 *   title: string           (required)
 *   date: string            (required) ISO date string, e.g. "2026-07-04"
 *   startTime?: string      (optional) e.g. "10:00" — merged with date to build full DateTime
 *   endTime?: string        (optional) e.g. "14:00" — merged with date to build endTime DateTime
 *   venue: string           (required)
 *   address?: string
 *   city: string            (required)
 *   state: string           (required) 2-letter state code
 *   categories: string[]    (required) at least one category
 *   description?: string
 *   verificationLink?: string  Link to social post, website, or flyer verifying the event
 *   submittedByName?: string
 *   submittedByEmail?: string
 * }
 *
 * Response (201): { success: true, message: string }
 * Response (400): { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Valid 2-letter state codes for the Turnout coverage area
const VALID_STATES = new Set(["NY", "NJ", "CT", "MA", "RI", "PA", "VT", "NH", "ME"]);

// Valid event category strings
const VALID_CATEGORIES = new Set([
  "EXOTIC",
  "CLASSIC",
  "AMERICAN",
  "JDM",
  "EUROPEAN",
  "SUPERCAR",
  "MOTORSPORT",
  "GENERAL",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- Validate required fields ---
    const {
      title,
      date,
      startTime,
      endTime,
      venue,
      address,
      city,
      state,
      categories,
      description,
      verificationLink,
      submittedByName,
      submittedByEmail,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "date is required (ISO date string, e.g. 2026-07-04)." },
        { status: 400 }
      );
    }

    if (!venue || typeof venue !== "string" || venue.trim().length === 0) {
      return NextResponse.json({ error: "venue is required." }, { status: 400 });
    }

    if (!city || typeof city !== "string" || city.trim().length === 0) {
      return NextResponse.json({ error: "city is required." }, { status: 400 });
    }

    if (!state || !VALID_STATES.has(state.toUpperCase())) {
      return NextResponse.json(
        {
          error: `state must be one of: ${[...VALID_STATES].join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "categories must be a non-empty array." },
        { status: 400 }
      );
    }

    const normalizedCategories = categories.map((c: string) =>
      c.toUpperCase()
    );
    const invalidCats = normalizedCategories.filter(
      (c: string) => !VALID_CATEGORIES.has(c)
    );
    if (invalidCats.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid categories: ${invalidCats.join(", ")}. Valid options: ${[...VALID_CATEGORIES].join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // --- Build the event DateTime ---
    // Combine date (YYYY-MM-DD) + optional startTime (HH:MM) into a full DateTime
    let eventDate: Date;
    try {
      const dateStr = startTime
        ? `${date}T${startTime}:00`
        : `${date}T10:00:00`; // Default 10am if no time given
      eventDate = new Date(dateStr);
      if (isNaN(eventDate.getTime())) throw new Error("Invalid date");
    } catch {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    let eventEndTime: Date | null = null;
    if (endTime) {
      try {
        eventEndTime = new Date(`${date}T${endTime}:00`);
        if (isNaN(eventEndTime.getTime())) eventEndTime = null;
      } catch {
        eventEndTime = null;
      }
    }

    // --- Save to database ---
    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? null,
        date: eventDate,
        endTime: eventEndTime,
        venue: venue.trim(),
        address: address?.trim() ?? null,
        city: city.trim(),
        state: state.toUpperCase(),
        categories: normalizedCategories,
        verificationLink: verificationLink?.trim() ?? null,
        submittedByName: submittedByName?.trim() ?? null,
        submittedByEmail: submittedByEmail?.trim() ?? null,
        isUserSubmitted: true,
        status: "pending", // Admin must approve before the event goes live
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your event has been submitted for review. It will appear on the calendar once approved.",
        id: newEvent.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/events/submit] Error:", err);
    return NextResponse.json(
      { error: "Failed to submit event. Please try again." },
      { status: 500 }
    );
  }
}
