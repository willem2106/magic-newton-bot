const puppeteer = require("puppeteer"); 
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000; // 24 hours
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    if (rollNowClicked) {
      console.log(`${getCurrentTime()} - ✅ Starting daily roll...`);
    }
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
        console.log(`${getCurrentTime()} - ⏳ Waiting for 60 seconds for dice animation...`);
        await delay(60000);

        for (let i = 1; i <= 5; i++) {
          const pressSelector = 'body > div.dMMuNs.kcKISj > div.fPSBzf.bYPztT.dKLBtz.iRgpoQ.container-page-loaded > div.fPSBzf.container-content > div > div:nth-child(1) > div.fPSBzf.bYPztT.pnxsH.cMGtQw > button.hoEiop.dgDkEX.iFUqYl.bZRhvx.eAZrqn.diIxfU.jTWvec.ThTOq.efvJEH.cGFOJB.fzpbIC.fzpolx.coifUy.eAZrpM.kyvghW.fznPAm.fzoAXm.eePqkU > div > p';
          
          const pressExists = await page.$(pressSelector);
          if (pressExists) {
            await page.click(pressSelector);
            console.log(`${getCurrentTime()} - 🖱️ Press clicked (${i}/5)`);
          } else {
            console.log(`${getCurrentTime()} - ⚠️ 'Press' button not found.`);
            break;
          }
          await delay(5000);
        }

        const bankSelector = 'body > div.dMMuNs.kcKISj > div.fPSBzf.bYPztT.dKLBtz.iRgpoQ.container-page-loaded > div.fPSBzf.container-content > div > div:nth-child(1) > div.fPSBzf.bYPztT.pnxsH.cMGtQw > button:nth-child(3) > div > p';
        const bankExists = await page.$(bankSelector);
        if (bankExists) {
          await page.click(bankSelector);
          console.log(`${getCurrentTime()} - 🏦 Bank clicked.`);
          await delay(3000);

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
