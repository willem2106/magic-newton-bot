require('dotenv').config();
const axios = require('axios');

const loginUrl = 'https://www.magicnewton.com/portal/api/auth/session';

const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
    console.error("❌ Private Key tidak ditemukan. Pastikan file .env telah diisi.");
    process.exit(1);
}

const login = async () => {
    console.log("\n⏳ Memulai proses login ke MagicNewton...");

    try {
        const response = await axios.post(
            loginUrl,
            { private_key: privateKey },
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("🔍 Debug Response:", JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data.session_token) {
            console.log(`✅ Login berhasil! Token sesi: ${response.data.session_token}`);
        } else {
            console.error(`⚠️ Login gagal, status: ${response.status}`);
        }
    } catch (error) {
        console.error("❌ Terjadi kesalahan saat login.");

        if (error.response) {
            console.log("🔍 Response Data:", JSON.stringify(error.response.data, null, 2));
            console.log("🔍 Response Status:", error.response.status);
            console.log("🔍 Response Headers:", JSON.stringify(error.response.headers, null, 2));
        } else if (error.request) {
            console.log("⚠️ Tidak ada respons dari server.");
            console.log("🔍 Request Data:", error.request);
        } else {
            console.log("⚠️ Error lain:", error.message);
        }
    }
};

login();
