require('dotenv').config({ quiet: true })

// Returns an ssl config object for production connections.
// Set DB_SSL=false to opt out (e.g. Render's internal connection string, which stays on a private network).
// Set DB_SSL_REJECT_UNAUTHORIZED=false to allow self-signed certs (not recommended in prod).
// Set DB_SSL_CA_BASE64 to a base64-encoded PEM CA certificate to enable full chain verification.
const getSslConfig = () => {
  if (process.env.DB_SSL === 'false') return false

  const ca = process.env.DB_SSL_CA_BASE64
    ? Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf-8')
    : undefined

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(ca && { ca }),
  }
}

// Converts a DB_URL connection string into a plain object so we can attach an ssl config alongside
// it. The pg driver only applies ssl options reliably when using the object form.
const parseDbUrl = (url) => {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
  }
}

// Shared pool configuration for all environments
const poolConfig = {
  min: 0,
  max: 10,
  acquireTimeoutMillis: 10000,
  createTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
}

const migrations = { directory: './migrations', tableName: 'knex_migrations' }

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DB_URL
      ? parseDbUrl(process.env.DB_URL)
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER || 'interview',
          password: process.env.DB_PASSWORD || 'interview',
          database: process.env.DB_NAME || 'interview',
        },
    pool: poolConfig,
    migrations,
  },

  test: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5433,
      user: 'interview-test',
      password: 'interview-test',
      database: 'interview_test',
    },
    pool: poolConfig,
    migrations,
  },

  production: {
    client: 'pg',
    connection: process.env.DB_URL ? { ...parseDbUrl(process.env.DB_URL), ssl: getSslConfig() } : undefined,
    pool: poolConfig,
    migrations,
  },
}
