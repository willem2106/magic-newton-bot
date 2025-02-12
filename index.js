require('dotenv').config();
const axios = require('axios');
const moment = require('moment-timezone');
require('colors');

const LOGIN_API = 'https://www.magicnewton/portal/api/auth/session';
const COOKIE = process.env.COOKIE;

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
                'Referer': 'https://www.magicnewton/portal/rewards',
                'Origin': 'https://www.magicnewton/portal'
            }
        });

        if (response.status === 200) {
            console.log(`✅ [${getCurrentTimestamp()}] Login Berhasil!`);
        } else {
            console.log(`⚠️ [${getCurrentTimestamp()}] Login mungkin gagal. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ [${getCurrentTimestamp()}] Login Gagal:`, error.response ? error.response.data : error.message);
    }
}

// Jalankan login
login();
