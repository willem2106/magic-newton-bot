const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000;
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentTime() {
  return new Date().toLocaleString("id-ID", { hour12: false });
}

async function runAccount(cookie, accountIndex) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setCookie(cookie);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const userAddress = await page.$eval("p.gGRRlH.WrOCw.AEdnq.hGQgmY.jdmPpC", el => el.innerText).catch(() => "Unknown");
    console.log(`🔹 [Account ${accountIndex}] ${getCurrentTime()} - 🏠 Your account: ${userAddress}`);

    let userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
    console.log(`🔹 [Account ${accountIndex}] ${getCurrentTime()} - 💰 Total your points: ${userCredits}`);

    await page.waitForSelector("button", { timeout: 30000 });
    const rollNowClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Roll now"));
      if (target) { target.click(); return true; }
      return false;
    });
    if (rollNowClicked) console.log(`🔹 [Account ${accountIndex}] ${getCurrentTime()} - ✅ Starting daily roll...`);
    await delay(5000);

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
        console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] 🖱️ Press button clicked (${i}/5)`);
        await delay(10000);
        console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⏳ Waiting result point press...`);
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
        console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⚠️ 'Press' button not found.`);
        break;
    }

    // Delay sebelum klik "Press" berikutnya
    await delay(10000);
}

// Delay sebelum klik tombol "Bank"
console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⏳ Waiting before clicking Bank...`);
await delay(10000);

// Klik tombol "Bank"
const bankClicked = await page.$$eval("button:nth-child(3) > div > p", buttons => {
    const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Bank"));
    if (target) {
        target.click();
        return true;
    }
    return false;
});

if (bankClicked) {
    console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] 🏦 Bank button clicked.`);
    await delay(10000);
    
    // Ambil hasil dice roll
    const diceRollResult = await page.$eval("h2.gRUWXt.dnQMzm.ljNVlj.kzjCbV.dqpYKm.RVUSp.fzpbtJ.bYPzoC", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 🎲 Dice Roll Result: ${diceRollResult} points`);
    
    // Tunggu saldo muncul sebelum mengambil nilai
    await page.waitForSelector("#creditBalance", { timeout: 10000 }).catch(() => console.log("⚠️ Saldo tidak muncul dalam batas waktu!"));
    
    // Ambil saldo setelah dice roll
    const userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 💳 Final Balance after dice roll: ${userCredits}`);
    
    console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ✅ Daily Roll Complete`);
} else {
    console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⚠️ 'Bank' button not found.`);
}
    await browser.close();
  } catch (error) {
    console.error(`🔹 [Account ${accountIndex}] ${getCurrentTime()} - ❌ An error occurred:`, error);
  }
}

(async () => {
  console.clear();
  displayHeader();
  console.log(`${getCurrentTime()} - 🚀 Starting MagicNewton Bot...`);
  const data = fs.readFileSync("data.txt", "utf8").split("\n").filter(Boolean);
  while (true) {
    try {
      console.log(`${getCurrentTime()} - 🔄 Starting your accounts...`);
      for (let i = 0; i < data.length; i++) {
        const cookie = { name: "__Secure-next-auth.session-token", value: data[i], domain: ".magicnewton.com", path: "/", secure: true, httpOnly: true };
        await runAccount(cookie, i + 1);
      }
    } catch (error) {
      console.error(`${getCurrentTime()} - ❌ An error occurred:`, error);
    }
    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`${getCurrentTime()} - 🔄 Daily roll completed. Bot will run again in 24 hours + random delay.`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
