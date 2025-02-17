const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000; // 24 jam
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000; // 5-10 menit delay acak

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadData(file) {
  try {
    const datas = fs.readFileSync(file, "utf8").replace(/\r/g, "").split("\n").filter(Boolean);
    if (datas?.length <= 0) {
      console.log(colors.red(`Tidak ditemukan data di file ${file}`));
      return [];
    }
    return datas;
  } catch (error) {
    console.log(`File ${file} tidak ditemukan`.red);
    return [];
  }
}

async function runAccount(cookie) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setCookie(cookie);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const userAddress = await page.$eval("p.gGRRlH.WrOCw.AEdnq.hGQgmY.jdmPpC", (el) => el.innerText).catch(() => "Tidak diketahui");
console.log(`🏠 Alamat terdeteksi: ${userAddress}`);

    let userCredits = await page.$eval("#creditBalance", (el) => el.innerText).catch(() => "Tidak diketahui");
    console.log(`💰 Saldo saat ini: ${userCredits}`);

    await page.waitForSelector("button", { timeout: 30000 });
    const rollNowClicked = await page.$$eval("button", (buttons) => {
      const target = buttons.find((btn) => btn.innerText && btn.innerText.includes("Roll now"));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (rollNowClicked) {
      console.log("✅ Memulai roll harian...");
    }
    await delay(5000);

    const letsRollClicked = await page.$$eval("button", (buttons) => {
      const target = buttons.find((btn) => btn.innerText && btn.innerText.includes("Let's roll"));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (letsRollClicked) {
      await delay(5000);
      const throwDiceClicked = await page.$$eval("button", (buttons) => {
        const target = buttons.find((btn) => btn.innerText && btn.innerText.includes("Throw Dice"));
        if (target) {
          target.click();
          return true;
        }
        return false;
      });

      if (throwDiceClicked) {
        console.log("⏳ Menunggu 60 detik untuk animasi dadu...");
        await delay(60000);
        userCredits = await page.$eval("#creditBalance", (el) => el.innerText).catch(() => "Tidak diketahui");
        console.log(`💰 Saldo terbaru: ${userCredits}`);
      } else {
        console.log("⚠️ Tombol 'Throw Dice' tidak ditemukan.");
      }
    } else {
      console.log("⚠️ Tidak bisa roll saat ini. Coba lagi nanti.");
    }
    await browser.close();
  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error);
  }
}

(async () => {
  console.clear();
  console.log("🚀 Memulai Bot Puppeteer...");
  const data = loadData("data.txt");

  while (true) {
    try {
      console.log("🔄 Memulai siklus baru...");
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
      console.error("❌ Terjadi kesalahan:", error);
    }
    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`🔄 Siklus selesai. Tidur selama 24 jam + delay acak ${extraDelay / 60000} menit...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
