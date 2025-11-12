import { query } from "./src/config/database";
import { getBlobUrl } from "./src/config/blobStorage";

async function checkSongSizes() {
  try {
    console.log("Checking song file sizes...\n");
    
    const songs = await query(`
      SELECT 
        id,
        title,
        audio_url,
        duration,
        streams
      FROM songs 
      WHERE audio_url LIKE 'audio/%'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`Checking ${songs.length} recent blob storage songs:\n`);
    
    for (const song of songs) {
      try {
        const blobUrl = getBlobUrl(song.audio_url);
        
        // Use fetch to get just the headers
        const response = await fetch(blobUrl, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        const status = response.status;
        
        console.log(`"${song.title}"`);
        console.log(`  Duration: ${song.duration} seconds`);
        console.log(`  Streams: ${song.streams}`);
        console.log(`  File size: ${contentLength} bytes`);
        console.log(`  HTTP Status: ${status}`);
        console.log(`  Status: ${status === 200 && contentLength && parseInt(contentLength) > 1000 ? '✅ Good' : '❌ Issue'}`);
        console.log('  ---');
        
      } catch (error) {
        console.log(`"${song.title}"`);
        console.log(`  ❌ Error checking file: ${error instanceof Error ? error.message : String(error)}`);
        console.log('  ---');
      }
    }
    
  } catch (error) {
    console.error("Error checking song sizes:", error);
  }
}

checkSongSizes().then(() => {
  console.log("\nDone checking song sizes.");
  process.exit(0);
}).catch(error => {
  console.error("Script error:", error);
  process.exit(1);
});