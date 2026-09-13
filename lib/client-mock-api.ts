// Client-side mock API and data store for static hosting (GitHub Pages)
"use client";

import {
  MOCK_GENRES,
  MOCK_CINEMAS,
  MOCK_MOVIES,
  getMockShowtimes,
} from "./mock-data";

export { MOCK_GENRES, MOCK_CINEMAS, MOCK_MOVIES, getMockShowtimes };

// Generate realistic seat rows A-E, 8 seats each
export function generateMockSeatRows(showtimeId: string, basePriceMinorUnits: number) {
  const rowsLabels = ["A", "B", "C", "D", "E"];
  const rows = rowsLabels.map((rowLabel, rIdx) => {
    const isVip = rowLabel === "E";
    const isPremium = rowLabel === "C" || rowLabel === "D";
    const type = isVip ? "VIP" : isPremium ? "PREMIUM" : "REGULAR";
    const multiplier = isVip ? 1.5 : isPremium ? 1.2 : 1.0;
    const priceMinorUnits = Math.round(basePriceMinorUnits * multiplier);

    const seats = Array.from({ length: 8 }).map((_, sIdx) => {
      const number = sIdx + 1;
      const isBooked = (rIdx === 1 && sIdx === 3) || (rIdx === 3 && sIdx === 4);
      return {
        id: `seat_${showtimeId}_${rowLabel}${number}`,
        seatId: `s_${rowLabel}${number}`,
        row: rowLabel,
        number,
        type,
        status: isBooked ? "BOOKED" : "AVAILABLE",
        isHeldByMe: false,
        priceMinorUnits,
        heldUntil: null,
      };
    });

    return { rowLabel, seats };
  });

  return rows;
}

// Install fetch patch for static environments
export function installMockApiInterceptor() {
  if (typeof window === "undefined") return;
  if ((window as any).__MOCK_API_INSTALLED__) return;
  (window as any).__MOCK_API_INSTALLED__ = true;

  const originalFetch = window.fetch;
  const mockShowtimes = getMockShowtimes();

  // LocalStorage mock state
  const STORAGE_KEY_BOOKINGS = "cinebook_mock_bookings";
  const STORAGE_KEY_USER = "cinebook_mock_user";

  function getStoredBookings(): any[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || "[]");
    } catch {
      return [];
    }
  }

  function saveStoredBookings(bookings: any[]) {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  }

  function getStoredUser(): any {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY_USER) ||
          JSON.stringify({
            id: "usr_jane_doe",
            name: "Jane Doe",
            email: "jane@example.com",
            role: "USER",
          })
      );
    } catch {
      return null;
    }
  }

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Check if this is an API call
    const apiMatch = urlStr.match(/\/(?:SS-CINEAPP\/)?api\/(.+)$/);
    if (!apiMatch) {
      return originalFetch(input, init);
    }

    const endpoint = apiMatch[1].split("?")[0];
    const searchParams = new URL(urlStr, window.location.origin).searchParams;
    const method = init?.method?.toUpperCase() || "GET";

    try {
      // 1. GET /api/cinemas
      if (endpoint === "cinemas" && method === "GET") {
        return new Response(JSON.stringify({ cinemas: MOCK_CINEMAS }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. GET /api/cinemas/:id
      const cinemaMatch = endpoint.match(/^cinemas\/([^/]+)$/);
      if (cinemaMatch && method === "GET") {
        const id = cinemaMatch[1];
        const cinema = MOCK_CINEMAS.find((c) => c.id === id || c.slug === id) || MOCK_CINEMAS[0];
        const cinemaShowtimes = mockShowtimes.filter((st) => st.cinemaId === cinema.id);
        return new Response(
          JSON.stringify({
            cinema: {
              ...cinema,
              auditoriums: [
                { id: `aud_${cinema.id}_1`, name: "Screen 1 - IMAX Laser", screenType: "IMAX", totalSeats: 40 },
                { id: `aud_${cinema.id}_2`, name: "Screen 2 - Dolby Atmos", screenType: "STANDARD", totalSeats: 32 },
              ],
            },
            showtimes: cinemaShowtimes,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 3. GET /api/movies
      if (endpoint === "movies" && method === "GET") {
        let list = [...MOCK_MOVIES];
        const search = searchParams.get("search");
        const genre = searchParams.get("genre");
        const language = searchParams.get("language");

        if (search) {
          list = list.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
        }
        if (genre && genre !== "all") {
          list = list.filter((m) => m.genres.some((g) => g.slug.toLowerCase() === genre.toLowerCase()));
        }
        if (language && language !== "ALL") {
          list = list.filter((m) => m.language.toLowerCase() === language.toLowerCase());
        }

        return new Response(JSON.stringify({ movies: list }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 4. GET /api/movies/:id
      const movieMatch = endpoint.match(/^movies\/([^/]+)$/);
      if (movieMatch && method === "GET") {
        const id = movieMatch[1];
        const movie = MOCK_MOVIES.find((m) => m.id === id || m.slug === id) || MOCK_MOVIES[0];
        const relatedShowtimes = mockShowtimes.filter((st) => st.movieId === movie.id);

        const cinemaGroups = MOCK_CINEMAS.map((cinema) => ({
          ...cinema,
          showtimes: relatedShowtimes.filter((st) => st.cinemaId === cinema.id),
        }));

        return new Response(JSON.stringify({ movie, cinemas: cinemaGroups }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 5. GET /api/showtimes/:id
      const showtimeMatch = endpoint.match(/^showtimes\/([^/]+)$/);
      if (showtimeMatch && method === "GET") {
        const id = showtimeMatch[1];
        const showtime = mockShowtimes.find((st) => st.id === id) || mockShowtimes[0];
        const movie = MOCK_MOVIES.find((m) => m.id === showtime.movieId) || MOCK_MOVIES[0];
        const cinema = MOCK_CINEMAS.find((c) => c.id === showtime.cinemaId) || MOCK_CINEMAS[0];

        const rows = generateMockSeatRows(showtime.id, showtime.basePriceMinorUnits);

        return new Response(
          JSON.stringify({
            showtime: {
              ...showtime,
              movieTitle: movie.title,
              cinemaName: cinema.name,
              auditoriumName: showtime.auditorium.name,
              totalSeats: 40,
            },
            rows,
            totalSeats: 40,
            availableCount: 36,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 6. POST /api/bookings/hold
      if (endpoint === "bookings/hold" && method === "POST") {
        const body = init?.body ? JSON.parse(init.body.toString()) : {};
        const { showtimeId, showtimeSeatIds } = body;
        const showtime = mockShowtimes.find((st) => st.id === showtimeId) || mockShowtimes[0];
        const movie = MOCK_MOVIES.find((m) => m.id === showtime.movieId) || MOCK_MOVIES[0];
        const cinema = MOCK_CINEMAS.find((c) => c.id === showtime.cinemaId) || MOCK_CINEMAS[0];

        const bookingId = `bk_${Date.now()}`;
        const bookingReference = `CB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const subtotalMinorUnits = (showtimeSeatIds?.length || 1) * showtime.basePriceMinorUnits;
        const feeMinorUnits = 150 * (showtimeSeatIds?.length || 1);
        const taxMinorUnits = Math.round(subtotalMinorUnits * 0.08);
        const totalMinorUnits = subtotalMinorUnits + feeMinorUnits + taxMinorUnits;

        const newBooking = {
          id: bookingId,
          bookingReference,
          status: "PENDING",
          showtimeId: showtime.id,
          movieTitle: movie.title,
          moviePoster: movie.posterUrl,
          cinemaName: cinema.name,
          cinemaAddress: cinema.address,
          auditoriumName: showtime.auditorium.name,
          format: showtime.format,
          startTime: showtime.startTime,
          subtotalMinorUnits,
          feeMinorUnits,
          taxMinorUnits,
          totalMinorUnits,
          currency: "USD",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          seats: (showtimeSeatIds || ["A1"]).map((id: string, idx: number) => ({
            row: String.fromCharCode(65 + Math.floor(idx / 8)),
            number: (idx % 8) + 1,
            type: "REGULAR",
            priceMinorUnits: showtime.basePriceMinorUnits,
          })),
        };

        const existing = getStoredBookings();
        saveStoredBookings([newBooking, ...existing]);

        return new Response(JSON.stringify(newBooking), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 7. GET /api/bookings/:id
      const bookingMatch = endpoint.match(/^bookings\/([^/]+)$/);
      if (bookingMatch && method === "GET") {
        const id = bookingMatch[1];
        const bookings = getStoredBookings();
        const found = bookings.find((b) => b.id === id || b.bookingReference === id);
        if (found) {
          return new Response(JSON.stringify({ booking: found }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        // Fallback dummy booking if opened directly
        const dummy = {
          id,
          bookingReference: `CB-DEMO01`,
          status: "PENDING",
          showtimeId: mockShowtimes[0].id,
          movieTitle: MOCK_MOVIES[0].title,
          moviePoster: MOCK_MOVIES[0].posterUrl,
          cinemaName: MOCK_CINEMAS[0].name,
          cinemaAddress: MOCK_CINEMAS[0].address,
          auditoriumName: "Screen 1 - IMAX Laser",
          format: "IMAX Laser 3D",
          startTime: new Date(Date.now() + 3600 * 1000).toISOString(),
          subtotalMinorUnits: 4300,
          feeMinorUnits: 300,
          taxMinorUnits: 344,
          totalMinorUnits: 4944,
          currency: "USD",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          seats: [
            { row: "C", number: 4, type: "PREMIUM", priceMinorUnits: 2150 },
            { row: "C", number: 5, type: "PREMIUM", priceMinorUnits: 2150 },
          ],
        };
        return new Response(JSON.stringify({ booking: dummy }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 8. POST /api/bookings/:id/pay
      const payMatch = endpoint.match(/^bookings\/([^/]+)\/pay$/);
      if (payMatch && method === "POST") {
        const id = payMatch[1];
        const bookings = getStoredBookings();
        const b = bookings.find((bk) => bk.id === id || bk.bookingReference === id) || bookings[0];
        if (b) {
          b.status = "CONFIRMED";
          saveStoredBookings(bookings);
        }
        return new Response(
          JSON.stringify({
            success: true,
            bookingReference: b?.bookingReference || "CB-DEMO01",
            booking: b,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 9. Auth routes
      if (endpoint === "auth/me") {
        const user = getStoredUser();
        return new Response(JSON.stringify({ user }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (endpoint === "auth/login" || endpoint === "auth/register") {
        const user = {
          id: "usr_demo",
          name: "Jane Doe",
          email: "jane@example.com",
          role: "USER",
        };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        return new Response(JSON.stringify({ success: true, user }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (endpoint === "auth/logout") {
        localStorage.removeItem(STORAGE_KEY_USER);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 10. GET /api/bookings (user bookings list)
      if (endpoint === "bookings" && method === "GET") {
        return new Response(JSON.stringify({ bookings: getStoredBookings() }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 11. Admin routes
      if (endpoint.startsWith("admin/")) {
        return new Response(
          JSON.stringify({
            metrics: {
              totalRevenueMinorUnits: 2845000,
              totalBookings: 142,
              activeShowtimes: 24,
              occupancyRatePercent: 78,
            },
            auditLogs: [
              {
                id: "log_1",
                action: "CONFIRM_PAYMENT",
                entityType: "BOOKING",
                entityId: "CB-8K2N9X",
                createdAt: new Date().toISOString(),
                userName: "Jane Doe",
              },
            ],
            movies: MOCK_MOVIES,
            showtimes: mockShowtimes,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Default fallback
      return new Response(JSON.stringify({ message: "Mock response" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Mock fetch error:", e);
      return originalFetch(input, init);
    }
  };
}
