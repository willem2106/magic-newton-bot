require('dotenv').config();
const axios = require('axios');
const moment = require('moment-timezone');
require('colors');
const { displayHeader } = require('./helpers'); // Pastikan helpers.js ada dan memiliki fungsi displayHeader

const LOGIN_API = 'https://www.magicnewton.com/portal/api/auth/session'; // Pastikan URL benar
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

    if (!COOKIE) {
        console.error("❌ [ERROR] COOKIE tidak ditemukan. Pastikan COOKIE tersedia di .env");
        return;
    }

    try {
        const response = await axios.get(LOGIN_API, {
            headers: {
                'Cookie': COOKIE,
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://www.magicnewton.com/portal',
                'Origin': 'https://www.magicnewton.com'
            }
        });

        if (response.status === 200 && response.data) {
            console.log(`✅ [${getCurrentTimestamp()}] Login Berhasil!`);

            // Menampilkan preview user jika tersedia
            const userData = response.data?.user;
            if (userData) {
                console.log(`👤 User Info:`);
                console.log(`   🏷️ Name   : ${userData.name || 'Tidak tersedia'}`);
                console.log(`   📍 Address: ${userData.address || 'Tidak tersedia'}`);
            } else {
                console.log(`⚠️ Data user tidak ditemukan.`);
            }

        } else {
            console.log(`⚠️ [${getCurrentTimestamp()}] Login mungkin gagal. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(
            `❌ [${getCurrentTimestamp()}] Login Gagal:`,
            error.response?.data || error.message || error.code
        );
    }
}

// Fungsi utama untuk menjalankan login setiap 24 jam
async function startRoutine() {
    try {
        displayHeader();
        await login();
    } catch (error) {
        console.error(`🚨 [${getCurrentTimestamp()}] Terjadi error dalam eksekusi script:`, error);
    }

    // Menampilkan waktu eksekusi berikutnya dalam format lengkap
    const nextRun = moment().tz('Asia/Jakarta').add(24, 'hours').format('DD/MM/YYYY, HH:mm:ss');
    console.log(`\n⏳ [${getCurrentTimestamp()}] Menunggu 24 jam untuk menjalankan ulang pada: ${nextRun} WIB\n`);

    // Tunggu 24 jam sebelum menjalankan ulang
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

    // Jalankan ulang
    await startRoutine();
}

// Jalankan pertama kali
startRoutine();
