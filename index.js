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
  return new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", hour12: false });
}

async function runAccount(cookie, accountIndex) {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-software-rasterizer"
      ]
    });

    const page = await browser.newPage();
    await page.setCookie(cookie);
    
    console.log(`? [Account ${accountIndex}] ${getCurrentTime()} - Membuka halaman...`);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 120000 });
    
    // Debugging: Print seluruh teks di halaman
    const fullPageText = await page.evaluate(() => document.body.innerText);
    console.log(`?? [Debug] ${getCurrentTime()} - Isi halaman:
`, fullPageText);

    // Menunggu elemen alamat pengguna muncul
    await page.waitForSelector("p[class*='AEdnq']", { timeout: 5000 }).catch(() => {});
    let userAddress = "Unknown";
    try {
      userAddress = await page.evaluate(() => {
        let el = document.querySelector("p[class*='AEdnq']");
        return el ? el.innerText.trim() : "Unknown";
      });
    } catch (error) {
      console.log(`? [Account ${accountIndex}] ${getCurrentTime()} - Tidak dapat menemukan alamat pengguna.`);
    }
    console.log(`? [Account ${accountIndex}] ${getCurrentTime()} - Akun: ${userAddress}`);

    // Menunggu elemen saldo poin muncul
    await page.waitForSelector("#creditBalance", { timeout: 5000 }).catch(() => {});
    let userCredits = "Unknown";
    try {
      userCredits = await page.evaluate(() => {
        let el = document.querySelector("#creditBalance");
        return el ? el.innerText.trim() : "Unknown";
      });
    } catch (error) {
      console.log(`? [Account ${accountIndex}] ${getCurrentTime()} - Tidak dapat menemukan saldo poin.`);
    }
    console.log(`? [Account ${accountIndex}] ${getCurrentTime()} - Poin saat ini: ${userCredits}`);

    await delay(5000);

    const rollNowClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Roll now"));
      if (target) { target.click(); return true; }
      return false;
    });

    if (rollNowClicked) {
      console.log(`? [Account ${accountIndex}] ${getCurrentTime()} - Mulai daily roll...`);
      await delay(7000);
    } else {
      console.log(`? [Account ${accountIndex}] ${getCurrentTime()} - Tombol 'Roll now' tidak ditemukan.`);
    }

    await browser.close();
  } catch (error) {
    console.error(`? [Account ${accountIndex}] ${getCurrentTime()} - Error terjadi:`, error);
  }
}

(async () => {
  console.clear();
  displayHeader();
  console.log(`? [Starting] ${getCurrentTime()} - Memulai MagicNewton Bot...`);

  const data = fs.readFileSync("data.txt", "utf8").split("\n").filter(Boolean);

  while (true) {
    console.log(`? [Starting] ${getCurrentTime()} - Memproses akun...`);

    for (let i = 0; i < data.length; i++) {
      const cookie = { 
        name: "__Secure-next-auth.session-token", 
        value: data[i], 
        domain: ".magicnewton.com", 
        path: "/", 
        secure: true, 
        httpOnly: true 
      };
      await runAccount(cookie, i + 1);
    }

    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`? [Finished] ${getCurrentTime()} - Bot akan berjalan lagi dalam 24 jam + tambahan delay ${extraDelay / 60000} menit...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
