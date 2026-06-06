import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIcsContent } from "../../event-links";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function serializeEvent(event: NonNullable<Awaited<ReturnType<typeof getEvent>>>) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date.toISOString(),
    endTime: event.endTime?.toISOString() ?? null,
    venue: event.venue,
    address: event.address,
    city: event.city,
    state: event.state,
    categories: event.categories,
    ticketUrl: event.ticketUrl,
    instagramPostUrl: event.instagramPostUrl,
    sourceAccount: event.sourceAccount,
    isUserSubmitted: event.isUserSubmitted,
  };
}

async function getEvent(id: string) {
  return prisma.event.findFirst({
    where: {
      id,
      status: "approved",
    },
  });
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const dbEvent = await getEvent(id);

  if (!dbEvent) {
    return new NextResponse("Event not found", { status: 404 });
  }

  const event = serializeEvent(dbEvent);
  const ics = getIcsContent(event, request.nextUrl.origin);
  const filename = `${event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.ics`;

  return new NextResponse(ics, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}
