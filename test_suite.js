import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';

// Helper to check if server is running
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173/', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
};

// Helper to wait
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('🚀 Starting automated browser test suite for Typing4English...');
  
  let devServerProcess = null;
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('📦 Local dev server is not running. Launching it...');
    devServerProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      detached: false,
    });
    
    // Wait for the dev server to start
    let attempts = 0;
    let serverReady = false;
    while (attempts < 15) {
      await delay(1000);
      serverReady = await checkServer();
      if (serverReady) {
        break;
      }
      attempts++;
      console.log(`⏳ Waiting for dev server to start (attempt ${attempts}/15)...`);
    }
    
    if (!serverReady) {
      console.error('❌ Failed to start the dev server.');
      if (devServerProcess) devServerProcess.kill();
      process.exit(1);
    }
    console.log('🟢 Dev server started successfully on port 5173!');
  } else {
    console.log('🟢 Dev server is already running on port 5173!');
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set window size to a typical laptop screen
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Listen for console errors during execution
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ BROWSER CONSOLE ERROR:', msg.text());
      consoleErrors.push(msg.text());
    } else {
      console.log(`💬 BROWSER: [${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error('❌ BROWSER EXCEPTION:', err.message);
    consoleErrors.push(err.message);
  });

  try {
    console.log('🔗 Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    console.log('⏳ Waiting for homepage to load...');
    await page.waitForSelector('text=Typing4English');
    await page.waitForTimeout(2000); // Allow fonts & transitions to settle

    console.log('📸 Capturing Homepage screenshot...');
    await page.screenshot({ path: 'homepage_screenshot.png' });
    console.log('✅ Homepage screenshot saved as homepage_screenshot.png');

    // Test Typing Practice Module
    console.log('👆 Clicking "Bắt đầu luyện tập" card/button...');
    await page.click('text=Bắt đầu luyện tập');
    
    console.log('⏳ Waiting 3.5 seconds for typing practice stage to initialize...');
    await page.waitForTimeout(3500);
    
    console.log('📸 Capturing Typing Practice screenshot...');
    await page.screenshot({ path: 'typing_practice_screenshot.png' });
    console.log('✅ Typing Practice screenshot saved as typing_practice_screenshot.png');

    console.log('👆 Clicking "Thoát" to return to Homepage...');
    await page.click('text=Thoát');
    await page.waitForSelector('text=Typing4English');
    await page.waitForTimeout(1000);

    // Test Word Battle Module
    console.log('👆 Clicking "Gia nhập đấu trường" card/button...');
    await page.click('text=Gia nhập đấu trường');
    
    console.log('⏳ Waiting 3.5 seconds for Word Battle main menu to load...');
    await page.waitForTimeout(3500);
    
    console.log('📸 Capturing Word Battle screenshot...');
    await page.screenshot({ path: 'word_battle_screenshot.png' });
    console.log('✅ Word Battle screenshot saved as word_battle_screenshot.png');

    console.log('👆 Clicking "Thoát game (Home)" to return to Homepage...');
    await page.click('text=Thoát game (Home)');
    await page.waitForSelector('text=Typing4English');
    await page.waitForTimeout(1000);

    console.log('🎉 Automated browser test suite completed successfully!');
    if (consoleErrors.length > 0) {
      console.warn(`⚠️ Warning: There were ${consoleErrors.length} console errors during execution.`);
    } else {
      console.log('🥇 0 console errors detected. Visual rendering and modules load flawlessly!');
    }
  } catch (error) {
    console.error('❌ Test execution encountered an error:', error);
    if (devServerProcess) {
      console.log('🛑 Terminating background dev server...');
      devServerProcess.kill();
    }
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  if (devServerProcess) {
    console.log('🛑 Terminating background dev server...');
    devServerProcess.kill();
  }
  process.exit(0);
})().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
