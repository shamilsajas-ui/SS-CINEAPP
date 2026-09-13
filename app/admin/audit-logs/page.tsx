"use client";

import { useState, useEffect } from "react";
import { FileText, Shield, Clock, User } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        if (data?.logs) setLogs(data.logs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-cine-800 pb-4 space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          Security & Transaction Audit Logs
        </h2>
        <p className="text-xs text-slate-400">
          Immutable trail of seat locks, payment verifications, cancellations, and cron operations.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">
          Loading audit trail...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-cine-900/50 rounded-2xl border border-cine-800 text-xs text-slate-400">
          No audit logs recorded yet.
        </div>
      ) : (
        <div className="bg-cine-900/90 border border-cine-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cine-800 text-slate-400 font-semibold">
                  <th className="pb-3">Timestamp (UTC)</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Entity</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cine-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="text-slate-300 hover:bg-cine-800/40">
                    <td className="py-3 text-slate-400 font-mono">
                      {new Date(log.createdAt).toISOString()}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cine-950 border border-amber-500/30 text-amber-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">
                      {log.entityType} ({log.entityId.substring(0, 8)}...)
                    </td>
                    <td className="py-3">
                      {log.userName ? (
                        <div className="text-white font-medium">
                          {log.userName}
                          <span className="text-[10px] text-slate-500 block">
                            {log.userEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">System / Anonymous</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
