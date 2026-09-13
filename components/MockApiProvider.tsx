"use client";

import { useEffect } from "react";
import { installMockApiInterceptor } from "@/lib/client-mock-api";

export default function MockApiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installMockApiInterceptor();
  }, []);

  return <>{children}</>;
}
