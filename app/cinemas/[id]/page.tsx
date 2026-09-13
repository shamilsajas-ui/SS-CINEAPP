import CinemaScheduleClient from "./CinemaScheduleClient";
import { MOCK_CINEMAS } from "@/lib/mock-data";

export function generateStaticParams() {
  return MOCK_CINEMAS.map((c) => ({ id: c.id }));
}

export default async function CinemaSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CinemaScheduleClient id={id} />;
}
