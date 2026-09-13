import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const screenTypeEnum = pgEnum("screen_type", [
  "STANDARD",
  "IMAX",
  "3D",
  "VIP",
  "4DX",
]);
export const seatTypeEnum = pgEnum("seat_type", [
  "REGULAR",
  "PREMIUM",
  "VIP",
  "ACCESSIBLE",
]);
export const seatStatusEnum = pgEnum("seat_status", [
  "AVAILABLE",
  "HELD",
  "BOOKED",
  "BLOCKED",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "VALID",
  "USED",
  "CANCELLED",
]);

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("USER"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// 2. Genres
export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// 3. Movies
export const movies = pgTable("movies", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  synopsis: text("synopsis").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  contentRating: text("content_rating").notNull(), // e.g., 'PG-13', 'R'
  language: text("language").notNull(),
  releaseDate: text("release_date").notNull(),
  posterUrl: text("poster_url").notNull(),
  backdropUrl: text("backdrop_url").notNull(),
  trailerUrl: text("trailer_url"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// 4. Movie Genres (Junction)
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
  ]
);

// 5. Cinemas
export const cinemas = pgTable("cinemas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  phone: text("phone"),
  amenities: text("amenities").array().notNull().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// 6. Auditoriums
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    screenType: screenTypeEnum("screen_type").notNull().default("STANDARD"),
    totalSeats: integer("total_seats").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("cinema_auditorium_name_idx").on(table.cinemaId, table.name),
  ]
);

// 7. Seats
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    rowLabel: text("row_label").notNull(),
    seatNumber: integer("seat_number").notNull(),
    seatType: seatTypeEnum("seat_type").notNull().default("REGULAR"),
    // Minor multiplier in basis points (10000 = 1.00x, 12500 = 1.25x, 15000 = 1.50x)
    basePriceMultiplier: integer("base_price_multiplier")
      .notNull()
      .default(10000),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    uniqueIndex("auditorium_seat_position_idx").on(
      table.auditoriumId,
      table.rowLabel,
      table.seatNumber
    ),
  ]
);

// 8. Showtimes
export const showtimes = pgTable("showtimes", {
  id: uuid("id").primaryKey().defaultRandom(),
  movieId: uuid("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  auditoriumId: uuid("auditorium_id")
    .notNull()
    .references(() => auditoriums.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time", { withTimezone: true, mode: "date" })
    .notNull(),
  endTime: timestamp("end_time", { withTimezone: true, mode: "date" })
    .notNull(),
  // Minor units: e.g. 1500 = $15.00
  basePriceMinorUnits: integer("base_price_minor_units").notNull(),
  format: text("format").notNull().default("Standard 2D"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// 9. Showtime Seats
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: seatStatusEnum("status").notNull().default("AVAILABLE"),
    heldUntil: timestamp("held_until", { withTimezone: true, mode: "date" }),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("showtime_seat_unique_idx").on(
      table.showtimeId,
      table.seatId
    ),
  ]
);

// 10. Bookings
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingReference: text("booking_reference").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  showtimeId: uuid("showtime_id")
    .notNull()
    .references(() => showtimes.id, { onDelete: "cascade" }),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  // Money amounts in minor units (cents)
  subtotalMinorUnits: integer("subtotal_minor_units").notNull(),
  feeMinorUnits: integer("fee_minor_units").notNull(),
  taxMinorUnits: integer("tax_minor_units").notNull(),
  totalMinorUnits: integer("total_minor_units").notNull(),
  currency: text("currency").notNull().default("usd"),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// 11. Booking Items
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "cascade" }),
    priceMinorUnits: integer("price_minor_units").notNull(),
    seatSnapshot: jsonb("seat_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("booking_showtime_seat_idx").on(
      table.bookingId,
      table.showtimeSeatId
    ),
  ]
);

// 12. Payments
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  amountMinorUnits: integer("amount_minor_units").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  provider: text("provider").notNull().default("MOCK_TEST"),
  providerPaymentId: text("provider_payment_id"),
  idempotencyKey: text("idempotency_key").unique(),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// 13. Tickets
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  ticketCode: text("ticket_code").notNull().unique(),
  qrCodeData: text("qr_code_data").notNull(),
  showtimeSeatId: uuid("showtime_seat_id")
    .notNull()
    .references(() => showtimeSeats.id, { onDelete: "cascade" }),
  status: ticketStatusEnum("status").notNull().default("VALID"),
  issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  validatedAt: timestamp("validated_at", {
    withTimezone: true,
    mode: "date",
  }),
});

// 14. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
  heldByUser: one(users, {
    fields: [showtimeSeats.heldByUserId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [tickets.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
}));
