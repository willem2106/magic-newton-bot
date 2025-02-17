require('dotenv').config();
const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const moment = require('moment-timezone');
const readline = require('readline');
const MAGICNEWTON_URL = 'https://www.magicnewton.com/portal/rewards';
const QUESTS_API = 'https://www.magicnewton.com/portal/api/userQuests';
const COOKIE = process.env.COOKIE;
const WAIT_TIME = 24 * 60 * 60 * 1000;

async function getCurrentTimestamp() {
    return moment().tz('Asia/Jakarta').format('DD/MM/YYYY, HH:mm:ss');
}

async function fetchDailyDiceRollQuest() {
    try {
        console.log(`📜 [${await getCurrentTimestamp()}] Mengambil daftar quests...`);
        const response = await axios.get(QUESTS_API, {
            headers: { 'Cookie': COOKIE }
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            const quests = response.data;
            const dailyDiceRollQuest = quests.find(q => q.title === 'Daily Dice Roll');
            if (dailyDiceRollQuest) {
                console.log(`🎲 Quest ditemukan: ${dailyDiceRollQuest.title}`);
                return dailyDiceRollQuest;
            } else {
                console.log(`⚠️ Daily Dice Roll tidak ditemukan.`);
            }
        }
    } catch (error) {
        console.error(`❌ Gagal mengambil quest:`, error.response ? error.response.data : error.message);
    }
    return null;
}

async function completeDailyDiceRollQuest(quest) {
    try {
        console.log(`🚀 Menyelesaikan quest: ${quest.title} (ID: ${quest.id})...`);
        await axios.post(QUESTS_API, { id: quest.id }, {
            headers: { 'Cookie': COOKIE }
        });
        console.log(`✅ Quest "${quest.title}" selesai!`);
    } catch (error) {
        console.error(`❌ Gagal menyelesaikan quest:`, error.response ? error.response.data : error.message);
    }
}

async function runPuppeteer() {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setCookie({ name: '__Secure-next-auth.session-token', value: COOKIE, domain: '.magicnewton.com', path: '/', secure: true, httpOnly: true });
        await page.goto(MAGICNEWTON_URL, { waitUntil: 'networkidle2' });

        console.log(`📧 Logged in to MagicNewton`);
        const rollNowClicked = await page.$$eval('button', buttons => {
            const btn = buttons.find(b => b.innerText.includes('Roll now'));
            if (btn) btn.click();
            return !!btn;
        });

        if (rollNowClicked) {
            console.log('🎲 Starting daily roll...');
            await page.waitForTimeout(5000);
            const letsRollClicked = await page.$$eval('button', buttons => {
                const btn = buttons.find(b => b.innerText.includes("Let's roll"));
                if (btn) btn.click();
                return !!btn;
            });

            if (letsRollClicked) {
                await page.waitForTimeout(5000);
                const throwDiceClicked = await page.$$eval('button', buttons => {
                    const btn = buttons.find(b => b.innerText.includes('Throw Dice'));
                    if (btn) btn.click();
                    return !!btn;
                });

                if (throwDiceClicked) {
                    console.log('⏳ Waiting for dice animation...');
                    await page.waitForTimeout(60000);
                    const credits = await page.$eval('#creditBalance', el => el.innerText).catch(() => 'Unknown');
                    console.log(`💰 Updated Credits: ${credits}`);
                }
            }
        }
        await browser.close();
    } catch (error) {
        console.error('❌ Puppeteer error:', error);
    }
}

async function startRoutine() {
    try {
        const quest = await fetchDailyDiceRollQuest();
        if (quest) {
            await runPuppeteer();
            await completeDailyDiceRollQuest(quest);
        }
    } catch (error) {
        console.error(`🚨 Error dalam eksekusi script:`, error);
    }
    console.log(`⏳ Menunggu 24 jam sebelum menjalankan ulang...`);
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    await startRoutine();
}

startRoutine();
