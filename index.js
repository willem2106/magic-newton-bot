const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000;
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCurrentTime() {
  return new Date().toLocaleString("id-ID", { hour12: false });
}

async function runAccount(cookie) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setCookie(cookie);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    await delay(3000);

    const userAddress = await page.$eval("p.gGRRlH.WrOCw.AEdnq.hGQgmY.jdmPpC", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 🏠 Your account: ${userAddress}`);

    let userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 💰 Total your points: ${userCredits}`);

    await page.waitForSelector("p.gGRRlH.WrOCw.AEdnq.gTXAMX.gsjAMe", { timeout: 10000 });
    const rollNowButton = await page.$x("//p[contains(text(), 'Roll now')]");
    if (rollNowButton.length > 0) {
      await rollNowButton[0].click();
      console.log(`${getCurrentTime()} - ✅ Starting daily roll...`);
    } else {
      console.log(`${getCurrentTime()} - ⚠️ 'Roll now' button not found.`);
      return;
    }

    await delay(5000);
    
    const letsRollButton = await page.$x("//p[contains(text(), 'Let's roll')]");
    if (letsRollButton.length > 0) {
      await letsRollButton[0].click();
      await delay(5000);
    }

    const throwDiceButton = await page.$x("//p[contains(text(), 'Throw Dice')]");
    if (throwDiceButton.length > 0) {
      await throwDiceButton[0].click();
      console.log(`${getCurrentTime()} - ⏳ Waiting for 60 seconds for dice animation...`);
      await delay(60000);
    }

    for (let i = 1; i <= 5; i++) {
      const pressButton = await page.$x("//p[contains(text(), 'Press')]");
      if (pressButton.length > 0) {
        await pressButton[0].click();
        console.log(`${getCurrentTime()} - 🖱️ Press clicked (${i}/5)`);
        await delay(5000);
      } else {
        console.log(`${getCurrentTime()} - ⚠️ 'Press' button not found.`);
        break;
      }
    }

    const bankButton = await page.$x("//p[contains(text(), 'Bank')]");
    if (bankButton.length > 0) {
      await bankButton[0].click();
      console.log(`${getCurrentTime()} - 🏦 Bank clicked.`);
      await delay(3000);
    }

    userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 💳 Final Balance after dice roll: ${userCredits}`);
    
    await browser.close();
  } catch (error) {
    console.error(`${getCurrentTime()} - ❌ An error occurred:`, error);
  }
}

(async () => {
  console.clear();
  displayHeader();
  console.log(`${getCurrentTime()} - 🚀 Starting MagicNewton Bot...`);
  const data = fs.readFileSync("data.txt", "utf8").split("\n").filter(Boolean);

  while (true) {
    try {
      console.log(`${getCurrentTime()} - 🔄 Starting your account...`);
      for (let i = 0; i < data.length; i++) {
        const cookie = {
          name: "__Secure-next-auth.session-token",
          value: data[i],
          domain: ".magicnewton.com",
          path: "/",
          secure: true,
          httpOnly: true,
        };
        await runAccount(cookie);
      }
    } catch (error) {
      console.error(`${getCurrentTime()} - ❌ An error occurred:`, error);
    }
    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`${getCurrentTime()} - 🔄 Daily roll completed. Bot will run again in 24 hours + random delay of ${extraDelay / 60000} minutes...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
