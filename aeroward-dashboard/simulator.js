const axios = require('axios');
const API_URL = 'http://localhost:3000/api/ingest';

const WARDS = [
  { id: 'c534390a-9f5a-42b8-9b83-6e4ce3946b77', name: 'Ward A' },
  { id: 'e7568f54-2b9e-4b51-a076-ed6513b3b91d', name: 'Ward B' },
  { id: '0d39942b-441d-4081-af2e-787c32af327f', name: 'Ward C' },
  { id: 'e9931c64-caf1-4497-81ad-225e0803bab6', name: 'Ward D' },
  { id: 'ed03ccf4-8318-4912-9e20-ce8833219b0e', name: 'Ward E' },
];

function generateReading(wardName) {
  let pm25, pm10;
  if (wardName === 'Ward C') {
    pm25 = Math.floor(80 + Math.random() * 20);
    pm10 = Math.floor(180 + Math.random() * 50);
  } else if (wardName === 'Ward D') {
    pm25 = Math.floor(50 + Math.random() * 30);
    pm10 = Math.floor(90 + Math.random() * 40);
  } else {
    pm25 = Math.floor(Math.random() * 60) + 10;
    pm10 = Math.floor(Math.random() * 80) + 20;
  }
  return { pm25, pm10 };
}

async function sendCityWideData() {
  console.log(`\n--- City Mesh Update: ${new Date().toLocaleTimeString()} ---`);
  for (const ward of WARDS) {
    const { pm25, pm10 } = generateReading(ward.name);
    try {
      const res = await axios.post(API_URL, {
        ward_id: ward.id,
        sensor_id: "75388701-4993-4700-848e-67056637370a",
        pm2_5: pm25,
        pm10: pm10,
      });
      console.log(`✅ ${ward.name}: PM2.5=${pm25}, PM10=${pm10} | ${res.data.ml_classification?.source ?? 'OK'}`);
    } catch (error) {
      console.error(`❌ ${ward.name} Failed:`, error.response?.data || error.message);
    }
  }
}

console.log("🚀 AeroWard Simulator Started...\n");
setInterval(sendCityWideData, 5000);
sendCityWideData();