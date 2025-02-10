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

// Fungsi untuk mendapatkan data user
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

        // Simpan data user
        const userData = {
            id: response.data.id || "Tidak tersedia",
            name: response.data.name || "Tidak tersedia",
            email: response.data.email || "Tidak tersedia",
            refCode: response.data.refCode || "Tidak tersedia"
        };

        // Menampilkan preview data user
        console.log("\n📌 **Preview Data User:**");
        console.log(JSON.stringify(userData, null, 2));

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat mengambil data user:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
};

// Fungsi untuk login ke MagicNewton
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
        await getUserInfo(); // Panggil fungsi untuk mendapatkan info user setelah login

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat login:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
};

// Jalankan fungsi login
login();
