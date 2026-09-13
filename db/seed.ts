import bcrypt from "bcryptjs";
import { db, ensureDatabaseReady } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Starting CineBook database seeding...");
  await ensureDatabaseReady();

  // 1. Seed Users (Admin & Customer)
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("adminpassword123", salt);
  const customerPasswordHash = await bcrypt.hash("customerpassword123", salt);

  const [existingAdmin] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "admin@cinebook.com"));

  let adminUser = existingAdmin;
  if (!adminUser) {
    const [created] = await db
      .insert(schema.users)
      .values({
        name: "Admin User",
        email: "admin@cinebook.com",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        phone: "+1 (555) 019-2834",
      })
      .returning();
    adminUser = created;
    console.log("👤 Created Admin User: admin@cinebook.com / adminpassword123");
  }

  const [existingCustomer] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "jane@example.com"));

  let customerUser = existingCustomer;
  if (!customerUser) {
    const [created] = await db
      .insert(schema.users)
      .values({
        name: "Jane Doe",
        email: "jane@example.com",
        passwordHash: customerPasswordHash,
        role: "USER",
        phone: "+1 (555) 012-3456",
      })
      .returning();
    customerUser = created;
    console.log("👤 Created Customer User: jane@example.com / customerpassword123");
  }

  // 2. Seed Genres
  const genreList = [
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Action", slug: "action" },
    { name: "Adventure", slug: "adventure" },
    { name: "Drama", slug: "drama" },
    { name: "Animation", slug: "animation" },
    { name: "Thriller", slug: "thriller" },
    { name: "Comedy", slug: "comedy" },
    { name: "Fantasy", slug: "fantasy" },
  ];

  const genreMap = new Map<string, string>();
  for (const g of genreList) {
    const [existing] = await db
      .select()
      .from(schema.genres)
      .where(eq(schema.genres.slug, g.slug));
    if (existing) {
      genreMap.set(g.slug, existing.id);
    } else {
      const [created] = await db
        .insert(schema.genres)
        .values({ name: g.name, slug: g.slug })
        .returning();
      genreMap.set(g.slug, created.id);
    }
  }
  console.log(`🎬 Seeded ${genreMap.size} genres.`);

  // 3. Seed Cinemas
  const cinemaData = [
    {
      name: "CineBook Grand Luxe (Downtown)",
      slug: "grand-luxe-downtown",
      address: "742 Market Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      phone: "(415) 555-0142",
      amenities: ["IMAX Laser", "Dolby Atmos", "Luxury Recliners", "Cocktail Bar", "Dine-In"],
    },
    {
      name: "CineBook Apex Cinemas (Metropolis)",
      slug: "apex-cinemas-metropolis",
      address: "1500 Broadway",
      city: "New York",
      state: "NY",
      postalCode: "10036",
      phone: "(212) 555-0189",
      amenities: ["IMAX 70mm", "4DX Motion", "VIP Lounge", "Heated Seats"],
    },
    {
      name: "CineBook Starline (Sunset Blvd)",
      slug: "starline-sunset-blvd",
      address: "6801 Hollywood Blvd",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90028",
      phone: "(323) 555-0199",
      amenities: ["Dolby Cinema", "Laser Projection", "Full Bar & Bistro"],
    },
  ];

  const cinemaMap = new Map<string, string>();
  for (const c of cinemaData) {
    const [existing] = await db
      .select()
      .from(schema.cinemas)
      .where(eq(schema.cinemas.slug, c.slug));
    if (existing) {
      cinemaMap.set(c.slug, existing.id);
    } else {
      const [created] = await db
        .insert(schema.cinemas)
        .values(c)
        .returning();
      cinemaMap.set(c.slug, created.id);
    }
  }
  console.log(`🏛️ Seeded ${cinemaMap.size} cinemas.`);

  // 4. Seed Auditoriums and Seats for each cinema
  const auditoriumMap = new Map<string, { id: string; screenType: any }>();
  const seatIdListByAuditorium = new Map<string, string[]>();

  for (const [cinemaSlug, cinemaId] of cinemaMap.entries()) {
    const screens = [
      { name: "Screen 1 - IMAX Laser", screenType: "IMAX" as const, rows: ["A", "B", "C", "D", "E"], seatsPerRow: 8 },
      { name: "Screen 2 - Dolby Atmos", screenType: "STANDARD" as const, rows: ["A", "B", "C", "D"], seatsPerRow: 6 },
      { name: "Screen 3 - VIP Royale", screenType: "VIP" as const, rows: ["A", "B", "C"], seatsPerRow: 6 },
    ];

    for (const scr of screens) {
      const audKey = `${cinemaSlug}-${scr.name}`;
      const [existing] = await db
        .select()
        .from(schema.auditoriums)
        .where(eq(schema.auditoriums.name, scr.name));

      let audId: string;
      if (existing && existing.cinemaId === cinemaId) {
        audId = existing.id;
      } else {
        const totalSeats = scr.rows.length * scr.seatsPerRow;
        const [created] = await db
          .insert(schema.auditoriums)
          .values({
            cinemaId,
            name: scr.name,
            screenType: scr.screenType,
            totalSeats,
          })
          .returning();
        audId = created.id;

        // Generate seats
        const seatIds: string[] = [];
        for (let rIdx = 0; rIdx < scr.rows.length; rIdx++) {
          const row = scr.rows[rIdx];
          for (let sNum = 1; sNum <= scr.seatsPerRow; sNum++) {
            let seatType: "REGULAR" | "PREMIUM" | "VIP" | "ACCESSIBLE" = "REGULAR";
            let multiplier = 10000;

            if (scr.screenType === "VIP" || row === "D" || row === "E") {
              seatType = "VIP";
              multiplier = 15000;
            } else if (row === "B" || row === "C") {
              seatType = "PREMIUM";
              multiplier = 12500;
            } else if (row === "A" && (sNum === 1 || sNum === scr.seatsPerRow)) {
              seatType = "ACCESSIBLE";
              multiplier = 10000;
            }

            const [seat] = await db
              .insert(schema.seats)
              .values({
                auditoriumId: audId,
                rowLabel: row,
                seatNumber: sNum,
                seatType,
                basePriceMultiplier: multiplier,
              })
              .returning();
            seatIds.push(seat.id);
          }
        }
        seatIdListByAuditorium.set(audId, seatIds);
      }
      auditoriumMap.set(audKey, { id: audId, screenType: scr.screenType });
    }
  }
  console.log(`💺 Seeded auditoriums and seats.`);

  // 5. Seed Movies
  const movieData = [
    {
      title: "Dune: Part Two",
      slug: "dune-part-two",
      synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
      durationMinutes: 166,
      contentRating: "PG-13",
      language: "English",
      releaseDate: "2024-03-01",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      isFeatured: true,
      genres: ["sci-fi", "adventure", "action"],
    },
    {
      title: "Oppenheimer",
      slug: "oppenheimer",
      synopsis: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, exploring the profound moral, scientific, and geopolitical consequences.",
      durationMinutes: 180,
      contentRating: "R",
      language: "English",
      releaseDate: "2023-07-21",
      posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
      isFeatured: true,
      genres: ["drama", "thriller"],
    },
    {
      title: "Spider-Man: Across the Spider-Verse",
      slug: "spider-man-across-the-spider-verse",
      synopsis: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.",
      durationMinutes: 140,
      contentRating: "PG",
      language: "English",
      releaseDate: "2023-06-02",
      posterUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
      isFeatured: true,
      genres: ["animation", "action", "adventure"],
    },
    {
      title: "Interstellar: IMAX Special Presentation",
      slug: "interstellar-special",
      synopsis: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
      durationMinutes: 169,
      contentRating: "PG-13",
      language: "English",
      releaseDate: "2014-11-07",
      posterUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      isFeatured: false,
      genres: ["sci-fi", "drama", "adventure"],
    },
    {
      title: "Parasite",
      slug: "parasite",
      synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan in this Palme d'Or and Academy Award winning masterpiece.",
      durationMinutes: 132,
      contentRating: "R",
      language: "Korean",
      releaseDate: "2019-10-11",
      posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600&auto=format&fit=crop&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=5xH0RzeSojI",
      isFeatured: false,
      genres: ["thriller", "drama"],
    },
    {
      title: "Spirited Away",
      slug: "spirited-away",
      synopsis: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
      durationMinutes: 125,
      contentRating: "PG",
      language: "Japanese",
      releaseDate: "2001-07-20",
      posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=ByXuk9QqQkk",
      isFeatured: false,
      genres: ["animation", "fantasy", "adventure"],
    },
  ];

  const movieMap = new Map<string, string>();
  for (const m of movieData) {
    const [existing] = await db
      .select()
      .from(schema.movies)
      .where(eq(schema.movies.slug, m.slug));

    let movieId: string;
    if (existing) {
      movieId = existing.id;
    } else {
      const [created] = await db
        .insert(schema.movies)
        .values({
          title: m.title,
          slug: m.slug,
          synopsis: m.synopsis,
          durationMinutes: m.durationMinutes,
          contentRating: m.contentRating,
          language: m.language,
          releaseDate: m.releaseDate,
          posterUrl: m.posterUrl,
          backdropUrl: m.backdropUrl,
          trailerUrl: m.trailerUrl,
          isFeatured: m.isFeatured,
        })
        .returning();
      movieId = created.id;

      // Link genres
      for (const gSlug of m.genres) {
        const gId = genreMap.get(gSlug);
        if (gId) {
          await db
            .insert(schema.movieGenres)
            .values({ movieId, genreId: gId })
            .onConflictDoNothing();
        }
      }
    }
    movieMap.set(m.slug, movieId);
  }
  console.log(`🎥 Seeded ${movieMap.size} movies with genres.`);

  // 6. Seed Showtimes and Showtime Seats for the next 7 days
  const now = new Date();
  const times = [
    { hour: 13, min: 0, format: "Standard 2D", basePrice: 1500 },
    { hour: 16, min: 30, format: "IMAX Laser", basePrice: 2200 },
    { hour: 19, min: 45, format: "IMAX 3D", basePrice: 2400 },
    { hour: 21, min: 30, format: "VIP Royale", basePrice: 2800 },
  ];

  let showtimeCount = 0;
  const duneId = movieMap.get("dune-part-two");
  const oppId = movieMap.get("oppenheimer");
  const spiderId = movieMap.get("spider-man-across-the-spider-verse");

  const movieIdsToSchedule = [duneId, oppId, spiderId].filter(Boolean) as string[];

  // For each cinema and auditorium, create showtimes for Day 0, Day 1, Day 2
  for (const [audKey, audInfo] of auditoriumMap.entries()) {
    // Get seats for this auditorium
    const audSeats = await db
      .select()
      .from(schema.seats)
      .where(eq(schema.seats.auditoriumId, audInfo.id));

    if (audSeats.length === 0) continue;

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      for (let tIdx = 0; tIdx < times.length; tIdx++) {
        const t = times[tIdx];
        const movieId = movieIdsToSchedule[(dayOffset + tIdx) % movieIdsToSchedule.length];

        const startTime = new Date(now);
        startTime.setDate(now.getDate() + dayOffset);
        startTime.setHours(t.hour, t.min, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 2, startTime.getMinutes() + 45, 0, 0);

        // Check if showtime already exists
        const [showtime] = await db
          .insert(schema.showtimes)
          .values({
            movieId,
            auditoriumId: audInfo.id,
            startTime,
            endTime,
            basePriceMinorUnits: t.basePrice,
            format: audInfo.screenType === "IMAX" ? "IMAX Laser 3D" : audInfo.screenType === "VIP" ? "VIP Luxury 2D" : t.format,
          })
          .returning();

        showtimeCount++;

        // Populate showtime_seats
        const showtimeSeatInserts = (audSeats as any[]).map((s: any, idx: number) => {
          // Preset a couple seats as BOOKED or HELD to show real layout state
          let status: "AVAILABLE" | "HELD" | "BOOKED" = "AVAILABLE";
          if (dayOffset === 0 && (idx === 2 || idx === 3)) {
            status = "BOOKED";
          }
          return {
            showtimeId: showtime.id,
            seatId: s.id,
            status,
          };
        });

        await db.insert(schema.showtimeSeats).values(showtimeSeatInserts);
      }
    }
  }

  console.log(`🎟️ Seeded ${showtimeCount} showtimes with populated seat grids.`);
  console.log("✅ CineBook database seeding complete!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed error:", err);
      process.exit(1);
    });
}
