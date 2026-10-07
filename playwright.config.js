import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, retries: 0, timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:4174/ashen-company/', viewport: { width:1024, height:768 }, trace:'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {} },
  webServer: { command:'node tools/serve-site.mjs', url:'http://127.0.0.1:4174/ashen-company/', reuseExistingServer:false },
});
