const axios = require('axios');
require('dotenv').config();

const API_URL = 'https://www.magicnewton.com/portal/api/userQuests';
const AUTH_TOKEN = `Bearer ${process.env.AUTH_TOKEN}`; // Ambil token dari .env

async function claimQuest() {
    try {
        const response = await axios.post(
            API_URL,
            { questType: 'rol_now' }, // Sesuaikan jika perlu
            {
                headers: {
                    Authorization: AUTH_TOKEN,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Claim success:', response.data);
    } catch (error) {
        console.error('Error claiming quest:', error.response ? error.response.data : error.message);
    }
}

function startDailyClaim() {
    claimQuest(); // Jalankan pertama kali
    setInterval(claimQuest, 24 * 60 * 60 * 1000); // Ulangi setiap 24 jam
}

startDailyClaim();
