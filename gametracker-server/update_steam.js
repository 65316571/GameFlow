import { query } from './src/db/index.js';

async function updatePcToSteam() {
  try {
    const result = await query(`
      UPDATE platforms 
      SET code = 'Steam', name = 'Steam 平台', description = 'Steam 游戏平台 (Windows/Mac/Linux)'
      WHERE code = 'PC'
    `);
    console.log('PC platform updated to Steam');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update PC to Steam:', err.message);
    process.exit(1);
  }
}

updatePcToSteam();