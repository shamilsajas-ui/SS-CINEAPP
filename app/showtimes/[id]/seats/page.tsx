import SeatSelectionClient from "./SeatSelectionClient";
import { getMockShowtimes } from "@/lib/mock-data";

export function generateStaticParams() {
  const showtimes = getMockShowtimes();
  return showtimes.slice(0, 15).map((st) => ({ id: st.id }));
}

export default async function SeatSelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeatSelectionClient id={id} />;
}
