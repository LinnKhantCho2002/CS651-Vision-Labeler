// Cross-platform demo command, with no Google account or credentials required.
process.env.DEMO_MODE = 'true';
await import('../src/server.js');
