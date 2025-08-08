#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const inquirer = require('inquirer');


function listService() {
    return [
        { service: 'user-subscription-service', container: 'user_subscription_service' },
        { service: 'payment-gateway-service', container: 'payment_gateway_service' },
    ];
}


(async () => {
    // 1) Pick service (from running containers)
    const services = listService();

    if (services.length === 0) {
        console.error('❌ No running Docker containers found. Start your stack first (e.g., npm run docker:dev).');
        process.exit(1);
    }

    const { service } = await inquirer.prompt([
        {
            type: 'list',
            name: 'service',
            message: 'Select service (Docker container):',
            choices: services.map(s => ({
                name: `${s.service}  (${s.container})`,
                value: s.service,
            })),
        },
    ]);

    // 2) Pick environment
    const { env } = await inquirer.prompt([
        {
            type: 'list',
            name: 'env',
            message: 'Select environment:',
            choices: [
                { name: 'Development', value: 'development' },
                { name: 'Production', value: 'production' },
            ],
            default: 'development',
        },
    ]);

    // 3) Pick action
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select Prisma action:',
            choices: [
                { name: 'Migrate', value: 'migrate' },
                { name: 'Generate', value: 'generate' },
                { name: 'Studio', value: 'studio' },
                { name: 'Seed', value: 'db seed' },
                { name: 'Reset', value: 'reset' },
            ],
        },
    ]);

    // Optional extra input for migrate dev --name <x>
    let args = [];
    if (action === 'migrate') {
        const sub = env === 'production' ? 'deploy' : 'dev';
        args.push(sub);

        if (sub === 'dev') {
            const { withName, migrationName } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'withName',
                    message: 'Provide a migration name?',
                    default: false,
                },
                {
                    type: 'input',
                    name: 'migrationName',
                    message: 'Migration name:',
                    when: (ans) => ans.withName,
                    validate: (v) => (v && v.trim().length > 0) || 'Please enter a name or cancel.',
                },
            ]);
            if (withName && migrationName) {
                args.push('--name', JSON.stringify(migrationName.trim()));
            }
        }
    }

    const runnerPath = path.join('scripts', 'prisma-runner.js');
    const fullCommand = `node ${runnerPath} ${service} ${env} ${action} ${args.join(' ')}`;

    console.log(`\n🚀 Running: ${fullCommand}\n`);
    execSync(fullCommand, { stdio: 'inherit', shell: true });
})();
