const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000; // 24 hours
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000; 

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentTime() {
  return new Date().toLocaleString("id-ID", { hour12: false });
}

async function runAccount(cookie) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setCookie(...[cookie]);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    await delay(3000);
    
    // Ambil alamat akun secara lebih aman
    const userAddress = await page.evaluate(() => {
      const el = document.querySelector("p"); // Gunakan selector yang lebih aman
      return el ? el.innerText : "Unknown";
    });
    console.log(`${getCurrentTime()} - 🏠 Your account: ${userAddress}`);

    let userCredits = await page.evaluate(() => {
      const el = document.querySelector("#creditBalance");
      return el ? el.innerText : "Unknown";
    });
    console.log(`${getCurrentTime()} - 💰 Total your points: ${userCredits}`);

    await page.waitForSelector("button", { timeout: 30000 });
    
    const rollNowClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText.includes("Roll now"));
      if (target) target.click();
      return !!target;
    });

    if (rollNowClicked) {
      console.log(`${getCurrentTime()} - ✅ Starting daily roll...`);
    }
    await delay(5000);

    // Klik "Let's Roll"
    await page.waitForSelector("button", { timeout: 10000 });
    const letsRollClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText.includes("Let's roll"));
      if (target) target.click();
      return !!target;
    });

    if (letsRollClicked) {
      await delay(5000);
      console.log(`${getCurrentTime()} - 🎲 Rolling the dice...`);

      // Klik "Throw Dice"
      await page.waitForSelector("button", { timeout: 10000 });
      const throwDiceClicked = await page.$$eval("button", buttons => {
        const target = buttons.find(btn => btn.innerText.includes("Throw Dice"));
        if (target) target.click();
        return !!target;
      });

      if (throwDiceClicked) {
        console.log(`${getCurrentTime()} - ⏳ Waiting for 30 seconds for dice animation...`);
        await delay(30000);

        for (let i = 1; i <= 5; i++) {
          const pressClicked = await page.$$eval("button > div > p", buttons => {
            const target = buttons.find(btn => btn.innerText.includes("Press"));
            if (target) target.click();
            return !!target;
          });

          if (pressClicked) {
            console.log(`${getCurrentTime()} - 🖱️ Press button clicked (${i}/5)`);
            await delay(3000);

            await page.waitForFunction(() => {
              const el = document.querySelector("h2");
              return el && el.innerText !== "Unknown";
            }, { timeout: 5000 });

            const currentPoints = await page.evaluate(() => {
              const el = document.querySelector("h2");
              return el ? el.innerText : "Unknown";
            });

            console.log(`${getCurrentTime()} - 🎯 Current Points after Press (${i}/5): ${currentPoints}`);
          } else {
            console.log(`${getCurrentTime()} - ⚠️ 'Press' button not found.`);
            break;
          }
          await delay(10000);
        }
      } else {
        console.log(`${getCurrentTime()} - ⚠️ 'Throw Dice' button not found.`);
      }
    } else {
      console.log(`${getCurrentTime()} - ⚠️ 'Let's Roll' button not found.`);
    }

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
