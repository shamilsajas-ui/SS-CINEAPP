import CheckoutClient from "./CheckoutClient";

export function generateStaticParams() {
  return [{ bookingId: "CB-DEMO01" }, { bookingId: "demo-booking" }];
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <CheckoutClient bookingId={bookingId} />;
}
