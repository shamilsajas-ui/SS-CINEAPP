import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cinemasList = await db
      .select()
      .from(schema.cinemas)
      .where(eq(schema.cinemas.isActive, true));

    // For each cinema, fetch auditoriums
    const result = await Promise.all(
      cinemasList.map(async (cinema: any) => {
        const auditoriums = await db
          .select()
          .from(schema.auditoriums)
          .where(
            eq(schema.auditoriums.cinemaId, cinema.id)
          );
        return {
          ...cinema,
          auditoriums,
        };
      })
    );

    return NextResponse.json({ cinemas: result });
  } catch (err: any) {
    console.error("Error fetching cinemas:", err);
    return NextResponse.json(
      { error: "Failed to load cinemas" },
      { status: 500 }
    );
  }
}
