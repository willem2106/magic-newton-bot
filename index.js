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

async function runAccount(cookie) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
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
      if (target) { target.click(); return true; }
      return false;
    });
    if (rollNowClicked) console.log(`${getCurrentTime()} - ✅ Starting daily roll...`);
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
        console.log(`${getCurrentTime()} - ⏳ Waiting for 20 seconds for dice animation...`);
        await delay(20000);

        for (let i = 1; i <= 5; i++) {
    // Klik tombol "Press"
    const pressClicked = await page.$$eval("p.gGRRlH.WrOCw.AEdnq.gTXAMX.gsjAMe", buttons => {
        const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Press"));
        if (target) {
            target.click();
            return true;
        }
        return false;
    });

    if (pressClicked) {
        console.log(`${getCurrentTime()} - 🖱️ Press button clicked (${i}/5)`);

        // Delay setelah klik tombol "Press" untuk memastikan perubahan nilai
        await delay(10000);

        // Tambahkan delay sebelum mengambil hasil poin
        console.log(`${getCurrentTime()} - ⏳ Waiting result point press...`);
        await delay(10000);

        // Tunggu elemen h2 yang berisi total poin muncul
        try {
            await page.waitForSelector("h2.jsx-f1b6ce0373f41d79.gRUWXt.dnQMzm.ljNVlj.kzjCbV.dqpYKm.RVUSp.fzpbtJ.bYPzoC", { timeout: 10000 });
            const currentPoints = await page.$eval("h2.jsx-f1b6ce0373f41d79.gRUWXt.dnQMzm.ljNVlj.kzjCbV.dqpYKm.RVUSp.fzpbtJ.bYPzoC", el => el.innerText);
            console.log(`${getCurrentTime()} - 🎯 Current Points after Press (${i}/5): ${currentPoints}`);
        } catch (error) {
            console.log(`${getCurrentTime()} - ⚠️ Elemen hasil poin tidak ditemukan setelah klik Press.`);
        }
    } else {
        console.log(`${getCurrentTime()} - ⚠️ 'Press' button not found.`);
        break;
    }

    // Delay sebelum klik "Press" berikutnya untuk menghindari klik terlalu cepat
    await delay(10000);
}

// Delay setelah 5x klik sebelum klik tombol "Bank"
console.log(`${getCurrentTime()} - ⏳ Waiting before click Bank...`);
await delay(10000);
        
     const bankClicked = await page.$$eval("button:nth-child(3) > div > p", buttons => {
          const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Bank"));
          if (target) {
            target.click();
            return true;
          }
          return false;
        });

        if (bankClicked) {
          console.log(`${getCurrentTime()} - 🏦 Bank button clicked.`);
          await delay(10000);

          const diceRollResult = await page.$eval("h2.gRUWXt.dnQMzm.ljNVlj.kzjCbV.dqpYKm.RVUSp.fzpbtJ.bYPzoC", el => el.innerText).catch(() => "Unknown");
          console.log(`${getCurrentTime()} - 🎲 Dice Roll Result: ${diceRollResult} points`);

          userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
          console.log(`${getCurrentTime()} - 💳 Final Balance after dice roll: ${userCredits}`);
        } else {
          console.log(`${getCurrentTime()} - ⚠️ 'Bank' button not found.`);
        }
      }
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
        const cookie = { name: "__Secure-next-auth.session-token", value: data[i], domain: ".magicnewton.com", path: "/", secure: true, httpOnly: true };
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
