import TicketConfirmationClient from "./TicketConfirmationClient";

export function generateStaticParams() {
  return [{ bookingId: "CB-DEMO01" }, { bookingId: "demo-booking" }];
}

export default async function TicketConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <TicketConfirmationClient bookingId={bookingId} />;
}
