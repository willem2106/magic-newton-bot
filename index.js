require('dotenv').config();
const axios = require('axios');
const moment = require('moment-timezone');
require('colors');
const { displayHeader } = require('./helpers');

const LOGIN_API = 'https://www.magicnewton.com/portal/api/auth/session';
const QUESTS_API = 'https://www.magicnewton.com/portal/api/quests';
const COOKIE = process.env.COOKIE;
const WAIT_TIME = 24 * 60 * 60 * 1000;

if (!COOKIE) {
    console.error("❌ COOKIE tidak ditemukan di .env");
    process.exit(1);
}

function getCurrentTimestamp() {
    return moment().tz('Asia/Jakarta').format('DD/MM/YYYY, HH:mm:ss');
}

async function login() {
    console.log(`🕒 [${getCurrentTimestamp()}] Memulai proses login...`);
    try {
        const response = await axios.get(LOGIN_API, {
            headers: { 'Cookie': COOKIE, 'User-Agent': 'Mozilla/5.0' }
        });
        if (response.status === 200) {
            console.log(`✅ [${getCurrentTimestamp()}] Login Berhasil!`);
            await fetchAndCompleteDailyDiceRoll();
        } else {
            console.log(`⚠️ [${getCurrentTimestamp()}] Login mungkin gagal. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ [${getCurrentTimestamp()}] Login Gagal:`, error.response ? error.response.data : error.message);
    }
}

async function fetchAndCompleteDailyDiceRoll() {
    try {
        console.log(`📜 [${getCurrentTimestamp()}] Mengambil daftar quests...`);
        const response = await axios.get(QUESTS_API, {
            headers: { 'Cookie': COOKIE, 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (response.status === 200 && response.data && Array.isArray(response.data)) {
            const quests = response.data;
            const diceRollQuest = quests.find(q => q.title === "Daily Dice Roll" && q.enabled);
            
            if (diceRollQuest) {
                await completeQuest(diceRollQuest.id, diceRollQuest.title);
            } else {
                console.log(`⚠️ [${getCurrentTimestamp()}] Daily Dice Roll tidak tersedia atau sudah diklaim.`);
            }
        } else {
            console.log(`⚠️ [${getCurrentTimestamp()}] Gagal mengambil daftar quests.`);
        }
    } catch (error) {
        console.error(`❌ [${getCurrentTimestamp()}] Gagal mengambil quest:`, error.response ? error.response.data : error.message);
    }
}

async function completeQuest(questId, title) {
    try {
        console.log(`🎲 [${getCurrentTimestamp()}] Menjalankan Daily Dice Roll (ID: ${questId})...`);
        await axios.post(QUESTS_API, { id: questId }, {
            headers: { 'Cookie': COOKIE, 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(`✅ [${getCurrentTimestamp()}] Quest "${title}" selesai!`);
    } catch (error) {
        console.error(`❌ [${getCurrentTimestamp()}] Gagal menyelesaikan quest "${title}":`, error.response ? error.response.data : error.message);
    }
}

async function startRoutine() {
    try {
        displayHeader();
        await login();
    } catch (error) {
        console.error(`🚨 [${getCurrentTimestamp()}] Terjadi error dalam eksekusi script:`, error);
    }
    
    const nextRun = moment().tz('Asia/Jakarta').add(24, 'hours').format('DD/MM/YYYY, HH:mm:ss');
    console.log(`\n⏳ [${getCurrentTimestamp()}] Menunggu 24 jam untuk menjalankan ulang pada: ${nextRun} WIB\n`);
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    await startRoutine();
}

startRoutine();
