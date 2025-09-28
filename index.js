const puppeteer = require('puppeteer');
const fs = require('fs');

async function getGoogleTrends() {
  // 設定隨機 User-Agent
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  ];
  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // 設定 User-Agent
  await page.setUserAgent(randomUserAgent);

  // 設定視窗大小
  await page.setViewport({ width: 1920, height: 1080 });

  // 加入隨機延遲 (2-5秒)
  const randomDelay = Math.floor(Math.random() * 3000) + 2000;
  console.log(`等待 ${randomDelay}ms...`);
  await new Promise((resolve) => setTimeout(resolve, randomDelay));

  await page.goto('https://trends.google.com.tw/trending?geo=TW&hours=4', {
    waitUntil: 'networkidle0',
    timeout: 30000, // 設定較長的超時時間
  });

  try {
    await page.waitForSelector('td', { timeout: 10000 });
  } catch (error) {
    console.log('等待元素載入超時');
    await browser.close();
    return;
  }

  const trends = await page.evaluate(() => {
    const allRows = Array.from(document.querySelectorAll('tbody tr'));
    return allRows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length > 1) {
          const trendCell = cells[1];
          if (trendCell) {
            const firstDiv = trendCell.querySelector('div');
            const text = firstDiv?.textContent?.trim() || '';
            if (text) {
              return { content: text };
            }
          }
        }
        return null;
      })
      .filter((item) => item !== null);
  });

  console.log('擷取到的趨勢：', trends);

  await browser.close();

  const output = {
    updated: new Date().toISOString(),
    trends: trends,
  };

  fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
  console.log('Google Trends 資料已儲存至 google-trends.json');
}

getGoogleTrends();
