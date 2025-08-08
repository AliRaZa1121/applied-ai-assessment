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

    // First pass: load all variables
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').replace(/^["']|["']$/g, '');
                envVars[key] = value;
            }
        }
    });

    // Second pass: resolve variable interpolation
    Object.keys(envVars).forEach(key => {
        let value = envVars[key];
        // Replace $VARIABLE_NAME with actual values
        value = value.replace(/\$(\w+)/g, (match, varName) => {
            return envVars[varName] || process.env[varName] || match;
        });
        envVars[key] = value;
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

    const serviceMapping = {
        'user-subscription-service': 'USER',
        'payment-gateway-service': 'PAYMENT',
    };

    const prefix = serviceMapping[service];
    if (!prefix) {
        throw new Error(`Unknown service: ${service}. Supported services: ${Object.keys(serviceMapping).join(', ')}`);
    }

    const directUrlKey = `${prefix}_DATABASE_URL`;
    if (config[directUrlKey]) {
        console.log(`📋 Using direct URL: ${directUrlKey}`);
        return config[directUrlKey];
    }

    // Build URL from components
    const host = config[`${prefix}_DB_HOST`] || 'localhost';
    const port = config[`${prefix}_DB_PORT`] || '5432';
    const db = config[`${prefix}_DB_NAME`] || `${service.replace(/-/g, '_')}_db`;
    const user = config[`${prefix}_DB_USER`] || 'postgres';
    const pass = config[`${prefix}_DB_PASSWORD`] || 'postgres';

    const url = `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
    console.log(`🔨 Built URL from components: ${url}`);
    return url;
}

function runPrismaCommand(service, environment, command, args = []) {
    const dbUrl = buildDatabaseUrl(service, environment);

    // Map service names to environment variable names
    const serviceMapping = {
        'user-subscription-service': 'USER_DATABASE_URL',
        'payment-gateway-service': 'PAYMENT_DATABASE_URL',
    };

    const envVar = serviceMapping[service];
    if (!envVar) {
        throw new Error(`Unknown service: ${service}`);
    }

    const containerName = service.replace(/-/g, '_');

    const servicePathInContainer = '/app';

    if (command === 'reset' && environment === 'development') {
        console.log(`🔄 Resetting database for ${service} in ${environment} environment...`);
        console.log(`⚠️  This will delete all data in the database!`);
        try {
            console.log(`🧹 Cleaning up any existing Prisma processes...`);
            execSync(`docker exec ${containerName} pkill -f prisma || true`, { stdio: 'pipe' });
        } catch (err) {
            console.warn(`⚠️  No existing Prisma processes found.`);
        }

        const dbName = dbUrl.split('/').pop().split('?')[0]; // Extract DB name from URL
        const postgresContainer = `postgres_${service.includes('user') ? 'user' : 'payment'}`;

        try {
            console.log(`🔓 Releasing database locks and terminating connections...`);

            const killConnectionsCmd = `docker exec ${postgresContainer} psql -U postgres -d ${dbName} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`;
            execSync(killConnectionsCmd, { stdio: 'pipe' });

            const resetLockCommand = `docker exec ${postgresContainer} psql -U postgres -d ${dbName} -c "SELECT pg_advisory_unlock_all();"`;
            execSync(resetLockCommand, { stdio: 'pipe' });

            execSync('sleep 2', { stdio: 'pipe' });
        } catch (err) {
            console.warn(`⚠️  Could not clean database connections: ${err.message}`);
        }

        try {
            console.log(`🧽 Cleaning migrations directory...`);
            execSync(`docker exec ${containerName} rm -rf ${servicePathInContainer}/prisma/migrations`, { stdio: 'pipe' });
            execSync(`docker exec ${containerName} mkdir -p ${servicePathInContainer}/prisma/migrations`, { stdio: 'pipe' });
        } catch (err) {
            console.warn(`⚠️  Could not clean migrations directory: ${err.message}`);
        }

        const resetCommand =
            `docker exec -e ${envVar}="${dbUrl}" ` +
            `${containerName} ` +
            `sh -lc "cd ${servicePathInContainer} && npx prisma migrate reset --force --skip-generate"`;

        const pushResetCommand =
            `docker exec -e ${envVar}="${dbUrl}" ` +
            `${containerName} ` +
            `sh -lc "cd ${servicePathInContainer} && npx prisma db push --force-reset --skip-generate"`;

        console.log(`⚡ Running reset command...`);
        console.log('─'.repeat(80));

        try {
            execSync(resetCommand, { stdio: 'inherit', shell: true });
            console.log(`✅ Database reset completed successfully!`);
        } catch (err) {
            console.warn(`⚠️  Migrate reset failed, trying db push --force-reset...`);
            try {
                execSync(pushResetCommand, { stdio: 'inherit', shell: true });
                console.log(`✅ Database reset completed with db push!`);
            } catch (pushErr) {
                console.error(`❌ Both reset methods failed:`);
                console.error(`   Migrate reset: ${err.message}`);
                console.error(`   DB push reset: ${pushErr.message}`);
                process.exit(1);
            }
        }
        return;
    }

    const fullCommand =
        `docker exec -e ${envVar}="${dbUrl}" ` +
        `${containerName} ` +
        `sh -lc "cd ${servicePathInContainer} && npx prisma ${command} ${args.join(' ')}"`;

    console.log(`🚀 Running Prisma for service "${service}" in ${environment} (docker)`);
    console.log(`📦 Container: ${containerName}`);
    console.log(`🔗 ${envVar}: ${dbUrl}`);
    console.log(`⚡ Command: ${fullCommand}`);
    console.log('─'.repeat(80));

    // Clean up any stale locks before running the command
    if (['migrate', 'db'].includes(command)) {
        const dbName = dbUrl.split('/').pop().split('?')[0];
        const postgresContainer = `postgres_${service.includes('user') ? 'user' : 'payment'}`;

        try {
            console.log(`🧹 Pre-flight cleanup...`);
            execSync(`docker exec ${postgresContainer} psql -U postgres -d ${dbName} -c "SELECT pg_advisory_unlock_all();" || true`, { stdio: 'pipe' });
        } catch (err) {
            // Ignore cleanup errors
        }
    }

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
    console.log('🔧 Prisma Runner - Dynamic Database Configuration');
    console.log('');
    console.log('Usage: node scripts/prisma-runner.js <service> <environment> <command> [args]');
    console.log('');
    console.log('Services:');
    console.log('  user-subscription-service  - User Subscription Service');
    console.log('  payment-gateway-service    - Payment Gateway Service');
    console.log('  notification-service       - Notification Service');
    console.log('');
    console.log('Environments:');
    console.log('  development - Docker development environment');
    console.log('  production  - Production environment');
    console.log('');
    console.log('Commands:');
    console.log('  migrate dev --name <name>  - Create and apply migration');
    console.log('  migrate reset --force      - Reset database (development only)');
    console.log('  reset                      - Reset database with cleanup (development only)');
    console.log('  generate                   - Generate Prisma client');
    console.log('  studio                     - Open Prisma Studio');
    console.log('  db seed                    - Run database seeds');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/prisma-runner.js user-subscription-service development migrate dev --name init');
    console.log('  node scripts/prisma-runner.js payment-gateway-service development generate');
    console.log('  node scripts/prisma-runner.js user-subscription-service development reset');
    console.log('  node scripts/prisma-runner.js user-subscription-service development studio');
    process.exit(1);
}

if (!['development', 'production'].includes(environment)) {
    console.error('❌ Environment must be "development" or "production"');
    process.exit(1);
}

// Safety check: prevent reset in production
if (command === 'reset' && environment === 'production') {
    console.error('❌ Database reset is not allowed in production environment!');
    console.error('💡 Use "migrate reset --force" manually if you really need to reset production.');
    process.exit(1);
}

runPrismaCommand(service, environment, command, args);
