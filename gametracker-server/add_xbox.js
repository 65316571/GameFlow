import { query } from './src/db/index.js';

async function addXbox() {
  try {
    const result = await query(`
      INSERT INTO platforms (code, name, description, sort_order) 
      VALUES ('Xbox', 'Xbox Series X/S', '微软出品的游戏主机', 3)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('Xbox platform added/exists');
    process.exit(0);
  } catch (err) {
    console.error('Failed to add Xbox:', err.message);
    process.exit(1);
  }
}

addXbox();