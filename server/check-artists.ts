import { query } from './src/config/database';

(async () => {
  try {
    const result = await query(
      'SELECT u.id, u.username, u.artist_id FROM users u WHERE u.role = $1 ORDER BY u.created_at DESC LIMIT 5',
      ['ARTIST']
    );
    console.log('Recent Artists:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
