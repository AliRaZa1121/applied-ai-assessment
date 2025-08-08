const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load env from file
function loadEnvFile(envPath) {
    if (!fs.existsSync(envPath)) {
        console.warn(`⚠️  Environment file not found: ${envPath}`);
        return {};
    }
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                envVars[key] = value;
            }
        }
    });
    return envVars;
}

// Build DB URL based on env + service
function buildDatabaseUrl(service, environment) {
    const envFile = environment === 'production' ? '.env.production' : '.env.development';
    const envPath = path.join(process.cwd(), envFile);
    const envVars = loadEnvFile(envPath);
    const config = { ...envVars, ...process.env };

    console.log(`🔧 Loaded configuration from: ${envFile}`);
    console.log('Configuration (from file):', envVars);

    const upper = service.toUpperCase().replace(/-/g, '_');
    const directUrlKey = `${upper}_DATABASE_URL`;
    if (config[directUrlKey]) {
        return config[directUrlKey];
    }

    const host = config[`${upper}_DB_HOST`] || 'localhost';
    const port = config[`${upper}_DB_PORT`] || '5432';
    const db = config[`${upper}_DB_NAME`] || `${service}_db`;
    const user = config[`${upper}_DB_USER`] || 'postgres';
    const pass = config[`${upper}_DB_PASSWORD`] || 'postgres';

    return `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
}

// Run Prisma command inside Docker container
function runPrismaCommand(service, environment, command, args = []) {
    const dbUrl = buildDatabaseUrl(service, environment);

    // DB URL env var naming pattern: SERVICE_NAME_DATABASE_URL
    const envVar = `${service.toUpperCase().replace(/-/g, '_')}_DATABASE_URL`;

    // Container name = service name with underscores (match docker-compose)
    const containerName = service.replace(/-/g, '_');

    // In your containers, Prisma schema is at /app
    const servicePathInContainer = '/app';

    const fullCommand =
        `docker exec -e ${envVar}="${dbUrl}" ` +
        `${containerName} ` +
        `sh -lc "cd ${servicePathInContainer} && npx prisma ${command} ${args.join(' ')}"`;

    console.log(`🚀 Running Prisma for service "${service}" in ${environment} (docker)`);
    console.log(`📦 Container: ${containerName}`);
    console.log(`🔗 ${envVar}: ${dbUrl}`);
    console.log(`⚡ Command: ${fullCommand}`);
    console.log('─'.repeat(80));

    try {
        execSync(fullCommand, { stdio: 'inherit', shell: true });
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
}

// CLI args
const [, , service, environment, command, ...args] = process.argv;

if (!service || !environment || !command) {
    console.log('Usage: node scripts/prisma-runner.js <service-name> <environment> <command> [args]');
    console.log('Example: node scripts/prisma-runner.js user-subscription-service development migrate dev --name init');
    process.exit(1);
}

if (!['development', 'production'].includes(environment)) {
    console.error('❌ Environment must be "development" or "production"');
    process.exit(1);
}

runPrismaCommand(service, environment, command, args);
