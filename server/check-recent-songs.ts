import { query } from './src/config/database';

(async () => {
  try {
    // Check songs uploaded by artist548
    const result = await query(
      "SELECT s.id, s.title, s.created_at, sa.artist_id, a.display_name FROM songs s LEFT JOIN song_artists sa ON s.id = sa.song_id LEFT JOIN artists a ON sa.artist_id = a.id WHERE s.created_at > NOW() - INTERVAL '1 day' ORDER BY s.created_at DESC LIMIT 10",
      []
    );
    console.log('Recent songs (last 24 hours):');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
