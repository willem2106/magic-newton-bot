require('dotenv').config();
const axios = require('axios');

const loginUrl = 'https://www.magicnewton.com/portal/api/auth/session';
const userUrl = 'https://www.magicnewton.com/portal/api/user';

// Ambil cookie dari .env
const sessionCookie = process.env.SESSION_COOKIE;

if (!sessionCookie) {
    console.error("❌ Cookie sesi tidak ditemukan. Pastikan file .env telah diisi dengan SESSION_COOKIE.");
    process.exit(1);
}

const getUserInfo = async () => {
    console.log("\n⏳ Mengambil informasi user dari MagicNewton...");

    try {
        const response = await axios.get(userUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cookie': `__Secure-next-auth.session-token=${sessionCookie}`
            }
        });

        console.log("✅ Data user berhasil diperoleh!");

        // Cetak seluruh response untuk debugging
        console.log("\n🔍 **Full User Response Data:**");
        console.log(JSON.stringify(response.data, null, 2));

        // Pastikan data user tersedia
        if (response.data) {
            console.log("\n👤 **User Info:**");
            console.log(`   🔹 Nama: ${response.data.name || "Tidak tersedia"}`);
            console.log(`   🔹 Email: ${response.data.email || "Tidak tersedia"}`);
            console.log(`   🔹 ID: ${response.data.id || "Tidak tersedia (cek struktur respons)"}`);
        } else {
            console.log("⚠️ Data user tidak ditemukan dalam respons.");
        }
    } catch (error) {
        console.error("❌ Terjadi kesalahan saat mengambil data user:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
};

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

        console.log("✅ Login berhasil!");
        await getUserInfo(); // Ambil user info setelah login

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat login:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
};

login();
