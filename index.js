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
  const now = new Date();
  return `[${now.toLocaleString()}]`;
}

function loadData(file) {
  try {
    const datas = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
    if (!datas.length) {
      console.log(`${getCurrentTime()} - No data found in file ${file}`.red);
      return [];
    }
    return datas;
  } catch (error) {
    console.log(`${getCurrentTime()} - File ${file} not found`.red);
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
    }
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
        console.log(`${getCurrentTime()} - 🎲 Throwing dice...`);
        await delay(60000); // Menunggu animasi dadu selesai

        // **Menekan tombol "Press" sebanyak 5 kali dengan delay 5 detik**
        for (let i = 0; i < 5; i++) {
          await page.waitForSelector('button.hoEiop.dgDkEX.iFUqYl.bZRhvx.eAZrqn.diIxfU.jTWvec.ThTOq.efvJEH.cGFOJB.fzpbIC.fzpolx.coifUy.eAZrpM.kyvghW.fznPAm.fzoAXm.eePqkU > div > p', { timeout: 10000 });

          const pressClicked = await page.$$eval("button", buttons => {
            const target = buttons.find(btn => btn.querySelector("p")?.innerText.includes("Press"));
            if (target) {
              target.click();
              return true;
            }
            return false;
          });

          if (pressClicked) {
            console.log(`${getCurrentTime()} - 🔘 Press button clicked (${i + 1}/5)`);
            await delay(5000); // Delay 5 detik setelah setiap klik
          } else {
            console.log(`${getCurrentTime()} - ❌ Press button not found!`);
            break; // Jika tombol "Press" tidak ditemukan, hentikan loop
          }
        }

        // **Klik tombol "Bank" setelah selesai menekan "Press"**
        await page.waitForSelector('button:nth-child(3) > div > p', { timeout: 30000 });

        const bankClicked = await page.$$eval("button", buttons => {
          const target = buttons.find(btn => btn.querySelector("p")?.innerText.includes("Bank"));
          if (target) {
            target.click();
            return true;
          }
          return false;
        });

        if (bankClicked) {
          console.log(`${getCurrentTime()} - 🏦 Navigating to Bank section...`);
        } else {
          console.log(`${getCurrentTime()} - ❌ Bank button not found!`);
        }

        userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
        console.log(`${getCurrentTime()} - 💰 Latest balance: ${userCredits}`);
      } else {
        console.log(`${getCurrentTime()} - ⚠️ 'Throw Dice' button not found.`);
      }
    } else {
      console.log(`${getCurrentTime()} - ⚠️ Cannot roll at the moment.`);
    }
    await browser.close();
  } catch (error) {
    console.error(`${getCurrentTime()} - ❌ An error occurred:`, error);
  }
}

(async () => {
  console.clear();
  displayHeader(); // Menampilkan header
  console.log(`${getCurrentTime()} - 🚀 Starting MagicNewton Bot...`);
  const data = loadData("data.txt");

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
    console.log(`${getCurrentTime()} - ⏳ Daily roll completed. Bot will run again in 24 hours + random delay of ${extraDelay / 60000} minutes...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
