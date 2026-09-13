import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entityType: schema.auditLogs.entityType,
        entityId: schema.auditLogs.entityId,
        details: schema.auditLogs.details,
        ipAddress: schema.auditLogs.ipAddress,
        createdAt: schema.auditLogs.createdAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, schema.auditLogs.userId)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(100);

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Audit log error:", err);
    return NextResponse.json(
      { error: "Failed to load audit logs" },
      { status: 500 }
    );
  }
}
