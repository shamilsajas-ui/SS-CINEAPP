import MovieDetailsClient from "./MovieDetailsClient";
import { MOCK_MOVIES } from "@/lib/mock-data";

export function generateStaticParams() {
  return MOCK_MOVIES.map((m) => ({ id: m.id }));
}

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovieDetailsClient id={id} />;
}
