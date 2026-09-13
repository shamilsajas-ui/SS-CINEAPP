// Static seed data for CineBook (Server and Client compatible)

export const MOCK_GENRES = [
  { id: "gen_scifi", name: "Sci-Fi", slug: "sci-fi" },
  { id: "gen_action", name: "Action", slug: "action" },
  { id: "gen_drama", name: "Drama", slug: "drama" },
  { id: "gen_thriller", name: "Thriller", slug: "thriller" },
  { id: "gen_adventure", name: "Adventure", slug: "adventure" },
  { id: "gen_animation", name: "Animation", slug: "animation" },
];

export const MOCK_CINEMAS = [
  {
    id: "cin_grand_luxe",
    name: "CineBook Grand Luxe (Downtown)",
    slug: "grand-luxe-downtown",
    address: "742 Market Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94103",
    phone: "(415) 555-0142",
    amenities: ["IMAX Laser", "Dolby Atmos", "Luxury Recliners", "Cocktail Bar", "Dine-In"],
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80",
    description: "Our flagship downtown destination featuring laser-aligned audio and 4K ultra-bright projection.",
  },
  {
    id: "cin_apex",
    name: "CineBook Apex Cinemas (Metropolis)",
    slug: "apex-cinemas-metropolis",
    address: "1500 Broadway",
    city: "New York",
    state: "NY",
    postalCode: "10036",
    phone: "(212) 555-0189",
    amenities: ["IMAX 70mm", "4DX Motion", "VIP Lounge", "Heated Seats"],
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
    description: "Experience films in authentic 70mm film stock and sensory 4DX motion technology.",
  },
  {
    id: "cin_starline",
    name: "CineBook Starline (Sunset Blvd)",
    slug: "starline-sunset-blvd",
    address: "6801 Hollywood Blvd",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90028",
    phone: "(323) 555-0199",
    amenities: ["Dolby Cinema", "Laser Projection", "Full Bar & Bistro"],
    imageUrl: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1200&auto=format&fit=crop&q=80",
    description: "Historic Hollywood location restored with cutting-edge Dolby Cinema imaging and full artisan bistro.",
  },
];

export const MOCK_MOVIES = [
  {
    id: "mov_dune2",
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
    genres: [
      { id: "gen_scifi", name: "Sci-Fi", slug: "sci-fi" },
      { id: "gen_adventure", name: "Adventure", slug: "adventure" },
      { id: "gen_action", name: "Action", slug: "action" },
    ],
  },
  {
    id: "mov_oppenheimer",
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
    genres: [
      { id: "gen_drama", name: "Drama", slug: "drama" },
      { id: "gen_thriller", name: "Thriller", slug: "thriller" },
    ],
  },
  {
    id: "mov_spiderman",
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
    genres: [
      { id: "gen_animation", name: "Animation", slug: "animation" },
      { id: "gen_action", name: "Action", slug: "action" },
      { id: "gen_adventure", name: "Adventure", slug: "adventure" },
    ],
  },
  {
    id: "mov_interstellar",
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
    genres: [
      { id: "gen_scifi", name: "Sci-Fi", slug: "sci-fi" },
      { id: "gen_drama", name: "Drama", slug: "drama" },
      { id: "gen_adventure", name: "Adventure", slug: "adventure" },
    ],
  },
  {
    id: "mov_parasite",
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
    genres: [
      { id: "gen_thriller", name: "Thriller", slug: "thriller" },
      { id: "gen_drama", name: "Drama", slug: "drama" },
    ],
  },
];

export function getMockShowtimes() {
  const showtimes: any[] = [];
  const times = [
    { hour: 13, min: 0, format: "Standard 2D", basePrice: 1500 },
    { hour: 16, min: 30, format: "IMAX Laser 3D", basePrice: 2150 },
    { hour: 20, min: 0, format: "Dolby Atmos", basePrice: 1950 },
    { hour: 22, min: 45, format: "VIP Luxury Recliner", basePrice: 2600 },
  ];

  for (let day = 0; day < 5; day++) {
    const d = new Date();
    d.setDate(d.getDate() + day);

    for (const movie of MOCK_MOVIES) {
      for (let cIdx = 0; cIdx < MOCK_CINEMAS.length; cIdx++) {
        const cinema = MOCK_CINEMAS[cIdx];
        const t = times[(day + cIdx) % times.length];
        const start = new Date(d);
        start.setHours(t.hour, t.min, 0, 0);

        const end = new Date(start);
        end.setMinutes(start.getMinutes() + movie.durationMinutes + 20);

        const id = `st_${movie.id}_${cinema.id}_d${day}_h${t.hour}`;
        showtimes.push({
          id,
          movieId: movie.id,
          cinemaId: cinema.id,
          auditoriumId: `aud_${cinema.id}_1`,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          basePriceMinorUnits: t.basePrice,
          format: t.format,
          isActive: true,
          auditorium: {
            id: `aud_${cinema.id}_1`,
            name: "Screen 1 - IMAX Laser",
            screenType: "IMAX",
            totalSeats: 40,
          },
        });
      }
    }
  }
  return showtimes;
}
