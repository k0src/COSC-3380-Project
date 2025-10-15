import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPOOLSIZE,
  RANDOM_USER_API_KEY,
} = process.env;
const pool = new Pool({
  host: PGHOST,
  port: PGPORT ? parseInt(PGPORT, 10) : 5432,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  max: PGPOOLSIZE ? parseInt(PGPOOLSIZE, 10) : undefined,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

async function closePool() {
  await pool.end();
}

const NUM_USERS = 10;
const NUM_ARTISTS = 10;
const NUM_SONGS = 20;
const GENRES = [
  "Pop",
  "Rock",
  "Hip Hop",
  "Jazz",
  "Electronic",
  "Country",
  "R&B",
  "Classical",
];

async function fetchRandomUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const response = await fetch(
      "https://api.apiverve.com/v1/randomusergenerator",
      {
        headers: { "x-api-key": RANDOM_USER_API_KEY },
      }
    );
    const json = await response.json();
    users.push(json.data[0]);
  }
  return users;
}

async function fetchRandomWords(count) {
  const response = await fetch(
    `https://random-word-api.herokuapp.com/word?number=${count}`
  );
  return await response.json();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedDatabase() {
  try {
    const randomUsers = await fetchRandomUsers(NUM_USERS);

    const userIds = [];
    for (const user of randomUsers) {
      const result = await query(
        "INSERT INTO users (username, email, password_hash, authenticated_with) VALUES ($1, $2, $3, $4) RETURNING id",
        [user.username, user.email, user.password, "CoogMusic"]
      );
      userIds.push(result[0].id);
      console.log(`Inserted user: ${user.username}`);
    }

    const artistIds = [];
    for (let i = 0; i < NUM_ARTISTS; i++) {
      const words = await fetchRandomWords(randomInt(1, 3));
      const bio = words.join(" ").substring(0, 255);

      const result = await query(
        "INSERT INTO artists (display_name, bio, user_id) VALUES ($1, $2, $3) RETURNING id",
        [randomUsers[i].name, bio, userIds[i]]
      );
      artistIds.push(result[0].id);
      console.log(`Inserted artist: ${randomUsers[i].name}`);

      await query("UPDATE users SET artist_id = $1 WHERE id = $2", [
        result[0].id,
        userIds[i],
      ]);
    }

    const songIds = [];
    for (let i = 0; i < NUM_SONGS; i++) {
      const words = await fetchRandomWords(randomInt(1, 3));
      const title = words.join(" ");
      const slug = title.toLowerCase().replace(/\s+/g, "-");

      const result = await query(
        "INSERT INTO songs (title, image_url, audio_url, genre, duration, release_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          title,
          `${slug}.jpg`,
          `${slug}.mp3`,
          randomItem(GENRES),
          randomInt(30, 300),
          "2025-10-14",
        ]
      );
      songIds.push(result[0].id);
      console.log(`Inserted song: ${title}`);
    }

    for (const songId of songIds) {
      const numArtists = randomInt(1, 4);
      const selectedArtists = [];

      while (selectedArtists.length < numArtists) {
        const artistId = randomItem(artistIds);
        if (!selectedArtists.includes(artistId)) {
          selectedArtists.push(artistId);
        }
      }

      const roles = ["Feature", "Producer", "Songwriter"];
      for (let i = 0; i < selectedArtists.length; i++) {
        const role = i === 0 ? "Main" : randomItem(roles);
        await query(
          "INSERT INTO song_artists (song_id, artist_id, role) VALUES ($1, $2, $3)",
          [songId, selectedArtists[i], role]
        );
        console.log(`Linked artist to song with role: ${role}`);
      }
    }

    console.log("Dummy data added to database");
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await closePool();
  }
}

seedDatabase();
