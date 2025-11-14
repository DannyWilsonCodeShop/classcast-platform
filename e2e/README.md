Running E2E tests

1. Install browsers: npx playwright install --with-deps
2. Start the dev server in another terminal: npm run dev
3. Run tests: npm run test:e2e

Configuration:
- Base URL is taken from E2E_BASE_URL env var, defaults to http://localhost:3000
- Tests live under e2e/*.spec.ts


