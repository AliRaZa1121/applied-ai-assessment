#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

(async () => {
    // ESM-friendly import for inquirer v9+
    const inquirerMod = await import('inquirer');
    const prompt = inquirerMod.default?.prompt ?? inquirerMod.prompt;

    const { service } = await prompt([
        {
            type: 'list',
            name: 'service',
            message: 'Select service:',
            choices: [
                { name: 'User Service', value: 'user' },
                { name: 'Payment Service', value: 'payment' },
            ],
        },
    ]);

    const { env } = await prompt([
        {
            type: 'list',
            name: 'env',
            message: 'Select environment:',
            choices: [
                { name: 'Development', value: 'development' },
                { name: 'Production', value: 'production' },
            ],
        },
    ]);

    const { action } = await prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select Prisma action:',
            choices: [
                { name: 'Migrate', value: 'migrate' },
                { name: 'Generate', value: 'generate' },
                { name: 'Studio', value: 'studio' },
                { name: 'Seed', value: 'db seed' },
            ],
        },
    ]);

    let args = [];
    if (action === 'migrate') {
        args = [env === 'production' ? 'deploy' : 'dev'];
    }

    const runnerPath = path.join('scripts', 'prisma-runner.js');
    const fullCommand = `node ${runnerPath} ${service} ${env} ${action} ${args.join(' ')}`;

    console.log(`\n🚀 Running: ${fullCommand}\n`);
    execSync(fullCommand, { stdio: 'inherit', shell: true });
})();
