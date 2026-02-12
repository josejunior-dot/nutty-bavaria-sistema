import { execSync } from 'child_process'

export async function setup() {
  // Set test DATABASE_URL
  process.env.DATABASE_URL =
    'postgresql://nutty:nutty123@localhost:5432/nutty_bavaria_test?schema=public'

  // Create test database if it doesn't exist
  try {
    execSync(
      `psql -h localhost -U nutty -d postgres -c "CREATE DATABASE nutty_bavaria_test;" 2>&1`,
      { env: { ...process.env, PGPASSWORD: 'nutty123' }, stdio: 'pipe' }
    )
    console.log('Test database created')
  } catch (e: any) {
    if (e.stderr?.toString().includes('already exists')) {
      console.log('Test database already exists')
    } else {
      // Try with createdb command as fallback
      try {
        execSync(
          `createdb -h localhost -U nutty nutty_bavaria_test 2>&1`,
          { env: { ...process.env, PGPASSWORD: 'nutty123' }, stdio: 'pipe' }
        )
        console.log('Test database created (via createdb)')
      } catch (e2: any) {
        if (e2.stderr?.toString().includes('already exists')) {
          console.log('Test database already exists')
        } else {
          console.warn('Could not create database, it may already exist:', e2.message)
        }
      }
    }
  }

  // Push schema to test database
  execSync('npx prisma db push --skip-generate', {
    cwd: import.meta.dirname ? import.meta.dirname + '/..' : process.cwd(),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'inherit',
  })

  console.log('Schema pushed to test database')
}
