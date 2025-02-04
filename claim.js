const axios = require('axios');

const API_URL = 'https://www.magicnewton.com/portal/api/userQuests';
const AUTH_TOKEN = 'Bearer eyJBUElfS0VZIjoicGtfbGl2ZV9DMTgxOUQ1OUY1REZCOEUyIiwiRE9NQUlOX09SSUdJTiI6Imh0dHBzOi8vd3d3Lm1hZ2ljbmV3dG9uLmNvbSIsImhvc3QiOiJhdXRoLm1hZ2ljLmxpbmsiLCJzZGsiOiJtYWdpYy1zZGsiLCJ2ZXJzaW9uIjoiMjguMjEuMCIsImxvY2FsZSI6ImVuX1VTIn0='; // Ganti dengan tokenmu

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
