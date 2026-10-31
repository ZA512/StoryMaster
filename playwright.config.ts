import { defineConfig } from '@playwright/test';
import {existsSync} from 'node:fs';
import {loadEnvFile} from 'node:process';
if(existsSync('.env'))loadEnvFile('.env');
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,workers:1,retries:0,timeout:45000,reporter:'list',use:{baseURL:process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',headless:true,screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})}}});
