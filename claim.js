require('dotenv').config();
const axios = require('axios');

const loginUrl = 'https://www.magicnewton.com/portal/api/auth/session';

// Ambil cookie dari .env
const sessionCookie = process.env.SESSION_COOKIE;

if (!sessionCookie) {
    console.error("❌ Cookie sesi tidak ditemukan. Pastikan file .env telah diisi dengan SESSION_COOKIE.");
    process.exit(1);
}

const login = async () => {
    console.log("\n⏳ Memulai proses login ke MagicNewton menggunakan cookie...");

    try {
        const response = await axios.get(loginUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cookie': `__Secure-next-auth.session-token=${sessionCookie}`
            }
        });

        if (response.status === 200) {
            console.log("✅ Login berhasil!");

            // Preview user info jika tersedia
            if (response.data.user) {
                console.log("\n👤 **User Info:**");
                console.log(`   🔹 Nama: ${response.data.user.name}`);
                console.log(`   🔹 Email: ${response.data.user.email || "Tidak tersedia"}`);
                console.log(`   🔹 ID: ${response.data.user.id}`);
            } else {
                console.log("⚠️ User info tidak ditemukan dalam response.");
            }
        } else {
            console.error(`⚠️ Login gagal, status: ${response.status}`);
        }
    } catch (error) {
        console.error("❌ Terjadi kesalahan saat login:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
};

login();
