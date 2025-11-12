import { query } from "./src/config/database";

async function checkSongsWithoutArtists() {
  try {
    console.log("Checking songs without artists...\n");
    
    const songs = await query(`
      SELECT 
        s.id,
        s.title,
        s.audio_url,
        s.duration,
        COUNT(sa.artist_id) as artist_count
      FROM songs s 
      LEFT JOIN song_artists sa ON s.id = sa.song_id 
      GROUP BY s.id, s.title, s.audio_url, s.duration
      HAVING COUNT(sa.artist_id) = 0
      ORDER BY s.created_at DESC
    `);

    console.log(`Found ${songs.length} songs WITHOUT artists:\n`);
    
    songs.forEach((song: any, index: number) => {
      console.log(`${index + 1}. "${song.title}"`);
      console.log(`   Duration: ${song.duration} seconds`);
      console.log(`   Audio URL: ${song.audio_url}`);
      console.log(`   ID: ${song.id}`);
      console.log('   ---');
    });

    // Summary
    const zeroCount = songs.filter((s: any) => s.duration === 0).length;
    const validCount = songs.filter((s: any) => s.duration > 0).length;
    
    console.log(`\nSummary:`);
    console.log(`  Songs with 0 duration: ${zeroCount}`);
    console.log(`  Songs with valid duration: ${validCount}`);
    
  } catch (error) {
    console.error("Error checking songs:", error);
  }
}

checkSongsWithoutArtists().then(() => {
  console.log("\nDone.");
  process.exit(0);
}).catch(error => {
  console.error("Script error:", error);
  process.exit(1);
});
