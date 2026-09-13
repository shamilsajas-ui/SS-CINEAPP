import { NextResponse, NextRequest } from "next/server";
import { releaseExpiredHolds } from "@/lib/booking-engine";

export async function GET(req: NextRequest) {
  return handleRelease(req);
}

export async function POST(req: NextRequest) {
  return handleRelease(req);
}

async function handleRelease(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Protect route with CRON_SECRET if configured
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const providedSecret =
      authHeader?.replace(/^Bearer\s+/i, "") ||
      req.headers.get("x-cron-secret") ||
      req.nextUrl.searchParams.get("key");

    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid CRON_SECRET." },
        { status: 401 }
      );
    }
  }

  try {
    const result = await releaseExpiredHolds();
    return NextResponse.json({
      success: true,
      message: "Expired seat holds and bookings released successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Cron release holds error:", error);
    return NextResponse.json(
      { error: "Failed to release expired holds", details: error.message },
      { status: 500 }
    );
  }
}
