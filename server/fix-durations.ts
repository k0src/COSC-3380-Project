import { query } from "./src/config/database";
import { getBlobUrl } from "./src/config/blobStorage";
import { parseBuffer } from "music-metadata";
import fetch from "node-fetch";

async function fixSongDurations() {
  try {
    console.log("Finding songs with 0 duration...\n");
    
    const songs = await query(`
      SELECT 
        id,
        title,
        audio_url,
        duration
      FROM songs 
      WHERE duration = 0 AND audio_url LIKE '%mp3'
      ORDER BY created_at DESC
    `);

    console.log(`Found ${songs.length} songs with 0 duration:\n`);
    
    for (const song of songs) {
      try {
        console.log(`Processing: "${song.title}"`);
        
        // Get the blob URL
        const blobUrl = song.audio_url.startsWith('audio/') 
          ? getBlobUrl(song.audio_url)
          : getBlobUrl(song.audio_url); // For direct filenames too
        
        // Download the file
        const response = await fetch(blobUrl);
        const buffer = await response.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);
        
        console.log(`  File size: ${fileBuffer.length} bytes`);
        
        if (fileBuffer.length < 1000) {
          console.log(`  ❌ File too small, skipping`);
          continue;
        }
        
        // Parse metadata
        const metadata = await parseBuffer(fileBuffer, 'audio/mpeg');
        
        if (metadata.format.duration) {
          const duration = Math.round(metadata.format.duration);
          console.log(`  ✅ Found duration: ${duration} seconds`);
          
          // Update database
          await query(
            'UPDATE songs SET duration = $1 WHERE id = $2',
            [duration, song.id]
          );
          
          console.log(`  ✅ Updated database`);
        } else {
          console.log(`  ❌ No duration found in metadata`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error processing: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      console.log('  ---');
    }
    
  } catch (error) {
    console.error("Error fixing song durations:", error);
  }
}

fixSongDurations().then(() => {
  console.log("\nDone fixing song durations.");
  process.exit(0);
}).catch(error => {
  console.error("Script error:", error);
  process.exit(1);
});