const axios = require('axios');

const API_URL = 'https://www.magicnewton.com/portal/api/userQuests';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..NqsAJrZWRErcv9hY.xxPaU7Kkn42nKebLSJBzaq5BUxu8NtcoV2OzS4kUz8tBy5IUQ48UpaoqjRflqzPKgGR8vUH6DMZAS2DfLNufSRaMBULyjMl11yumeRSjXOk_Tehn66gS5sihWMni1W4uKWvjkbs2FlOgNS2N3b2-fbciZOSdhFB_1lVKdLFlfn2UR4asDlQZrTXtP6fWqN27b1Rii7rb3PglbvNOwixaVNey2rPyucAHNeyrdjfqkWHESDATOHTO8dDB6QCc36sL.35u76nbo6BPCUHugpR9oIA'; // Ganti dengan tokenmu

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
