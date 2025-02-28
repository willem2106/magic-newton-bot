const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000; // 24 hours
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000; // Random delay between 5-10 minutes

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCurrentTime() {
  return new Date().toLocaleString("id-ID", { hour12: false });
}

async function runAccount(cookie) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setCookie(cookie);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const userAddress = await page.$eval("p.gGRRlH.WrOCw.AEdnq.hGQgmY.jdmPpC", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 🏠 Your account: ${userAddress}`);

    let userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 💰 Total your points: ${userCredits}`);

    await page.waitForSelector("button", { timeout: 30000 });
    const rollNowClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Roll now"));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (rollNowClicked) {
      console.log(`${getCurrentTime()} - ✅ Starting daily roll...`);
      await delay(5000);

      const letsRollClicked = await page.$$eval("button", buttons => {
        const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Let's roll"));
        if (target) {
          target.click();
          return true;
        }
        return false;
      });

      if (letsRollClicked) {
        await delay(5000);
        const throwDiceClicked = await page.$$eval("button", buttons => {
          const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Throw Dice"));
          if (target) {
            target.click();
            return true;
          }
          return false;
        });

        if (throwDiceClicked) {
          console.log(`${getCurrentTime()} - ⏳ Waiting for 30 seconds for dice animation...`);
          await delay(30000);

          let rollCount = 1;
          while (rollCount <= 5) {
            let score = await getCurrentScore(page);
            let shouldContinue = await pressOrBank(page, rollCount, score);
            if (!shouldContinue) break;
            rollCount++;
            await delay(60000);
          }
        } else {
          console.log("⚠️ 'Throw Dice' button not found.");
        }
      } else {
        console.log("👇 Wait! ROLL not available yet. ");
        const timerText = await page.evaluate(() => {
          const h2Elements = Array.from(document.querySelectorAll('h2'));
          for (let h2 of h2Elements) {
            const text = h2.innerText.trim();
            if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
              return text;
            }
          }
          return null;
        });
      }
    } else {
      console.log(`${getCurrentTime()} - ⚠️ Cannot roll at the moment. Please try again later!!!`);
    }
  } catch (error) {
    console.error(`${getCurrentTime()} - ❌ An error occurred:`, error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
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
      for (const value of data) {
        const cookie = {
          name: "__Secure-next-auth.session-token",
          value,
          domain: ".magicnewton.com",
          path: "/",
          secure: true,
          httpOnly: true,
        };
        await runAccount(cookie);
      }
    } catch (error) {
      console.error(`${getCurrentTime()} - ❌ An error occurred:`, error.message);
    }
    
    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`${getCurrentTime()} - 🔄 Daily roll completed. Bot will run again in 24 hours + random delay of ${extraDelay / 60000} minutes...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();

