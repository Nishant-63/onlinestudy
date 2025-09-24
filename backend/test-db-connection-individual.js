const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Testing database connection...');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_PORT:', process.env.DB_PORT || '5432');
console.log('DB_NAME:', process.env.DB_NAME || 'onlinestudy');
console.log('DB_USER:', process.env.DB_USER || 'postgres');

// Use individual variables instead of DATABASE_URL
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'onlinestudy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

console.log('📡 Connection config:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  password: poolConfig.password ? '***' : 'not set'
});

const pool = new Pool(poolConfig);

async function testConnection() {
  try {
    console.log('📡 Attempting to connect to database...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📊 Database query result:', result.rows[0]);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    client.release();
    await pool.end();
    console.log('🎉 Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

testConnection();
