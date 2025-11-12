import { query } from "./src/config/database";

async function checkSongs() {
  try {
    console.log("Checking all songs in the database...\n");
    
    const songs = await query(`
      SELECT 
        id,
        title,
        audio_url,
        image_url,
        genre,
        duration,
        release_date,
        created_at,
        streams
      FROM songs 
      ORDER BY created_at DESC
    `);

    if (songs.length === 0) {
      console.log("No songs found in the database.");
      return;
    }

    console.log(`Found ${songs.length} songs:\n`);
    
    songs.forEach((song, index) => {
      console.log(`${index + 1}. ${song.title}`);
      console.log(`   ID: ${song.id}`);
      console.log(`   Audio URL: ${song.audio_url}`);
      console.log(`   Image URL: ${song.image_url || 'None'}`);
      console.log(`   Genre: ${song.genre}`);
      console.log(`   Duration: ${song.duration} seconds`);
      console.log(`   Streams: ${song.streams || 0}`);
      console.log(`   Created: ${song.created_at}`);
      console.log(`   Release Date: ${song.release_date}`);
      console.log('   ---');
    });

    // Check for any songs with null or invalid audio URLs
    const problematicSongs = songs.filter(song => !song.audio_url);
    if (problematicSongs.length > 0) {
      console.log(`\n⚠️  Found ${problematicSongs.length} songs with missing audio URLs:`);
      problematicSongs.forEach(song => {
        console.log(`   - "${song.title}" (ID: ${song.id})`);
      });
    }

    // Check for songs with different URL patterns
    console.log("\nAudio URL patterns:");
    const urlPatterns = new Set();
    songs.forEach(song => {
      if (song.audio_url) {
        const pattern = song.audio_url.split('/')[0];
        urlPatterns.add(pattern);
      }
    });
    urlPatterns.forEach(pattern => {
      const count = songs.filter(song => song.audio_url && song.audio_url.startsWith(pattern)).length;
      console.log(`   ${pattern}/...: ${count} songs`);
    });

  } catch (error) {
    console.error("Error checking songs:", error);
  }
}

checkSongs().then(() => {
  console.log("\nDone checking songs.");
  process.exit(0);
}).catch(error => {
  console.error("Script error:", error);
  process.exit(1);
});