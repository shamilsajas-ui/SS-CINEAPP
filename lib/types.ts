export type UserRole = "USER" | "ADMIN";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ScreenType = "STANDARD" | "IMAX" | "3D" | "VIP" | "4DX";
export type SeatType = "REGULAR" | "PREMIUM" | "VIP" | "ACCESSIBLE";
export type SeatStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type TicketStatus = "VALID" | "USED" | "CANCELLED";

export interface MovieWithGenres {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  contentRating: string;
  language: string;
  releaseDate: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  isFeatured: boolean;
  genres: { id: string; name: string; slug: string }[];
}

export interface ShowtimeSeatDetail {
  id: string; // showtime_seat id
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
  basePriceMultiplier: number;
  status: SeatStatus;
  heldUntil: string | null;
  priceMinorUnits: number;
}

export interface BookingSummary {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  auditoriumName: string;
  screenType: ScreenType;
  format: string;
  startTime: string;
  endTime: string;
  seats: {
    row: string;
    number: number;
    type: SeatType;
    priceMinorUnits: number;
  }[];
  subtotalMinorUnits: number;
  feeMinorUnits: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
  currency: string;
  expiresAt: string;
  createdAt: string;
}
