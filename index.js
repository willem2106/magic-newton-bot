const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000; // 24 hours
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000; // Random delay between 5-10 minutes

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentTime() {
  return new Date().toLocaleString("id-ID", { hour12: false });
}

async function runAccount(cookie, accountNumber) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setCookie(cookie);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const userAddress = await page.$eval("p.gGRRlH.WrOCw.AEdnq.hGQgmY.jdmPpC", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] 🏠 Your account: ${userAddress}`);

    let userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] 💰 Total your points: ${userCredits}`);

    await page.waitForSelector("button", { timeout: 30000 });
    const rollNowClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Roll now"));
      if (target) { target.click(); return true; }
      return false;
    });
    if (rollNowClicked) console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ✅ Starting daily roll...`);
    await delay(5000);

    const letsRollClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Let's roll"));
      if (target) { target.click(); return true; }
      return false;
    });

    if (letsRollClicked) {
      await delay(5000);
      const throwDiceClicked = await page.$$eval("button", buttons => {
        const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Throw Dice"));
        if (target) { target.click(); return true; }
        return false;
      });

      if (throwDiceClicked) {
        console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ⏳ Waiting for 20 seconds for dice animation...`);
        await delay(20000);

        for (let i = 1; i <= 5; i++) {
          const pressClicked = await page.$$eval("p.gGRRlH.WrOCw.AEdnq.gTXAMX.gsjAMe", buttons => {
            const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Press"));
            if (target) { target.click(); return true; }
            return false;
          });

          if (pressClicked) {
            console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] 🖱️ Press button clicked (${i}/5)`);
            await delay(10000);

            console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ⏳ Waiting result point press...`);
            await delay(10000);

            try {
              await page.waitForSelector("h2.jsx-f1b6ce0373f41d79", { timeout: 10000 });
              const currentPoints = await page.$eval("h2.jsx-f1b6ce0373f41d79", el => el.innerText);
              console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] 🎯 Current Points after Press (${i}/5): ${currentPoints}`);
            } catch (error) {
              console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ⚠️ Result points not found.`);
            }
          } else {
            console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ⚠️ 'Press' button not found.`);
            break;
          }
          await delay(10000);
        }

        console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ⏳ Waiting before click Bank...`);
        await delay(10000);

        const bankClicked = await page.$$eval("button:nth-child(3) > div > p", buttons => {
          const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Bank"));
          if (target) { target.click(); return true; }
          return false;
        });

        if (bankClicked) {
          console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] 🏦 Bank button clicked.`);
          await delay(10000);

          const diceRollResult = await page.$eval("h2.gRUWXt.dnQMzm", el => el.innerText).catch(() => "Unknown");
          console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] 🎲 Dice Roll Result: ${diceRollResult} points`);

          await page.waitForSelector("#creditBalance", { timeout: 10000 }).catch(() => console.log("⚠️ Saldo tidak muncul dalam batas waktu!"));

          userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
          console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] 💳 Final Balance after dice roll: ${userCredits}`);

          console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ✅ Daily Roll Complete`);
        } else {
          console.log(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ⚠️ 'Bank' button not found.`);
        }
      }
    }
    await browser.close();
  } catch (error) {
    console.error(`${getCurrentTime()} - 🔹 [Account ${accountNumber}] ❌ An error occurred:`, error);
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
        const cookie = { name: "__Secure-next-auth.session-token", value: data[i], domain: ".magicnewton.com", path: "/", secure: true, httpOnly: true };
        await runAccount(cookie, i + 1);
      }
    } catch (error) {
      console.error(`${getCurrentTime()} - ❌ An error occurred:`, error);
    }
    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`${getCurrentTime()} - 🔄 Daily roll completed. Bot will run again in 24 hours + random delay of ${extraDelay / 60000} minutes...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
