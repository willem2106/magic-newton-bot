require('dotenv').config();
const axios = require('axios');
const moment = require('moment-timezone');
require('colors');
const { displayHeader } = require('./helpers'); // Import fungsi displayHeader

const LOGIN_API = 'https://www.magicnewton.com/portal/api/auth/session';
const QUESTS_API = 'https://www.magicnewton.com/portal/api/quests';
const COOKIE = process.env.COOKIE;
const WAIT_TIME = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik

if (!COOKIE) {
    console.error("❌ COOKIE tidak ditemukan di .env");
    process.exit(1);
}

// Fungsi untuk mendapatkan timestamp
function getCurrentTimestamp() {
    return moment().tz('Asia/Jakarta').format('DD/MM/YYYY, HH:mm:ss');
}

async function login() {
    console.log(`🕒 [${getCurrentTimestamp()}] Memulai proses login...`);

    try {
        const response = await axios.get(LOGIN_API, {
            headers: {
                'Cookie': COOKIE,
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://www.magicnewton.com/portal',
                'Origin': 'https://www.magicnewton.com/portal'
            }
        });

        if (response.status === 200) {
            console.log(`✅ [${getCurrentTimestamp()}] Login Berhasil!`);
            await fetchAndCompleteQuests();
        } else {
            console.log(`⚠️ [${getCurrentTimestamp()}] Login mungkin gagal. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ [${getCurrentTimestamp()}] Login Gagal:`, error.response ? error.response.data : error.message);
    }
}

async function fetchAndCompleteQuests() {
    try {
        console.log(`📜 [${getCurrentTimestamp()}] Mengambil daftar quests...`);
        const response = await axios.get(QUESTS_API, {
            headers: {
                'Cookie': COOKIE,
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://www.magicnewton.com/portal',
                'Origin': 'https://www.magicnewton.com/portal'
            }
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            const quests = response.data;
            
            console.log(`📝 [${getCurrentTimestamp()}] Daftar Quest:`);
            quests.forEach(quest => {
                console.log(`   🔹 ID: ${quest.id}, Judul: ${quest.title}`);
            });

            await completeQuests(quests);
        } else {
            console.log(`⚠️ [${getCurrentTimestamp()}] Gagal mengambil daftar quests.`);
        }
    } catch (error) {
        console.error(`❌ [${getCurrentTimestamp()}] Gagal mengambil quest:`, error.response ? error.response.data : error.message);
    }
}

async function completeQuests(quests) {
    for (const quest of quests) {
        try {
            console.log(`🚀 [${getCurrentTimestamp()}] Menyelesaikan quest: ${quest.title} (ID: ${quest.id})...`);
            await axios.post(QUESTS_API, { id: quest.id }, {
                headers: {
                    'Cookie': COOKIE,
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://www.magicnewton.com/portal',
                    'Origin': 'https://www.magicnewton.com/portal'
                }
            });

            console.log(`✅ [${getCurrentTimestamp()}] Quest "${quest.title}" selesai!`);
        } catch (error) {
            console.error(`❌ [${getCurrentTimestamp()}] Gagal menyelesaikan quest "${quest.title}":`, error.response ? error.response.data : error.message);
        }
    }
}

// Fungsi utama untuk menjalankan login dan quest setiap 24 jam
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

// Jalankan pertama kali
startRoutine();
