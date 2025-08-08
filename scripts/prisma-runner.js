const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env files
function loadEnvFile(envPath) {
    if (!fs.existsSync(envPath)) {
        console.warn(`⚠️  Environment file not found: ${envPath}`);
        return {};
    }
    
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^["']|["']$/g, ''); 
                envVars[key] = value;
            }
        }
    });
    
    return envVars;
}

function buildDatabaseUrl(service, environment) {
    // Load environment variables based on environment
    const envFile = environment === 'production' ? '.env.production' : '.env.development';
    const envPath = path.join(process.cwd(), envFile);
    const envVars = loadEnvFile(envPath);
    
    // Merge with process.env (process.env takes priority)
    const config = { ...envVars, ...process.env };
    console.log(`🔧 Loaded configuration from: ${envFile}`);
    console.log('Configuration:', envVars);
    
    if (service === 'user') {
        // Try to get USER_DATABASE_URL directly first
        if (config.USER_DATABASE_URL) {
            return config.USER_DATABASE_URL;
        }
        
        // Build from individual components
        const host = config.USER_DB_HOST ||  'localhost';
        const port = config.USER_DB_PORT ||  '5433';
        const database = config.USER_DB_NAME || 'user_subscription_db';
        const username = config.USER_DB_USER || 'postgres';
        const password = config.USER_DB_PASSWORD || 'postgres';
        
        return `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public`;
    } else if (service === 'payment') {
        // Try to get PAYMENT_DATABASE_URL directly first
        if (config.PAYMENT_DATABASE_URL) {
            return config.PAYMENT_DATABASE_URL;
        }
        
        // Build from individual components
        const host = config.PAYMENT_DB_HOST ||  'localhost';
        const port = config.PAYMENT_DB_PORT ||  '5434';
        const database = config.PAYMENT_DB_NAME || 'payment_gateway_db';
        const username = config.PAYMENT_DB_USER || 'postgres';
        const password = config.PAYMENT_DB_PASSWORD || 'postgres';
        
        return `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public`;
    }
    
    throw new Error(`Unknown service: ${service}`);
}

function runPrismaCommand(service, environment, command, args = []) {
    const databaseUrl = buildDatabaseUrl(service, environment);
    const envVar = service === 'user' ? 'USER_DATABASE_URL' : 'PAYMENT_DATABASE_URL';
    const servicePath = path.join('services', service === 'user' ? 'user-subscription-service' : 'payment-gateway-service');

    const fullCommand = `cd ${servicePath} && cross-env ${envVar}="${databaseUrl}" npx prisma ${command} ${args.join(' ')}`;

    console.log(`🚀 Running: ${command} for ${service} service in ${environment} mode`);
    console.log(`📍 Service Path: ${servicePath}`);
    console.log(`🔗 Database URL: ${databaseUrl}`);
    console.log(`⚡ Command: ${fullCommand}`);
    console.log('─'.repeat(80));

    try {
        execSync(fullCommand, { stdio: 'inherit', shell: true });
    } catch (error) {
        console.error(`❌ Error running command: ${error.message}`);
        process.exit(1);
    }
}

// Parse command line arguments
const [, , service, environment, command, ...args] = process.argv;

if (!service || !environment || !command) {
    console.log('🔧 Prisma Runner - Dynamic Database Configuration from Environment');
    console.log('');
    console.log('📁 Reads configuration from:');
    console.log('  .env.development  - For development environment');
    console.log('  .env.production   - For production environment');
    console.log('');
    console.log('Usage: node scripts/prisma-runner.js <service> <environment> <command> [args]');
    console.log('');
    console.log('Services:');
    console.log('  user     - User Subscription Service');
    console.log('  payment  - Payment Gateway Service');
    console.log('');
    console.log('Environments:');
    console.log('  development - Uses .env.development');
    console.log('  production  - Uses .env.production');
    console.log('');
    console.log('Environment Variables (priority: process.env > .env file):');
    console.log('  USER_DATABASE_URL or USER_DB_HOST, USER_DB_PORT, USER_DB_NAME, USER_DB_USER, USER_DB_PASSWORD');
    console.log('  PAYMENT_DATABASE_URL or PAYMENT_DB_HOST, PAYMENT_DB_PORT, PAYMENT_DB_NAME, PAYMENT_DB_USER, PAYMENT_DB_PASSWORD');
    console.log('');
    console.log('Commands:');
    console.log('  migrate dev --name <name>  - Create and apply migration');
    console.log('  migrate reset --force      - Reset database');
    console.log('  generate                   - Generate Prisma client');
    console.log('  studio                     - Open Prisma Studio');
    console.log('  db seed                    - Run database seeds');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/prisma-runner.js user development migrate dev --name init');
    console.log('  node scripts/prisma-runner.js payment development generate');
    console.log('  node scripts/prisma-runner.js user development studio');
    console.log('  node scripts/prisma-runner.js payment production migrate deploy');
    process.exit(1);
}

// Validate inputs
if (!['user', 'payment'].includes(service)) {
    console.error('❌ Invalid service. Use "user" or "payment"');
    process.exit(1);
}

if (!['development', 'production'].includes(environment)) {
    console.error('❌ Invalid environment. Use "development" or "production"');
    process.exit(1);
}

runPrismaCommand(service, environment, command, args);
