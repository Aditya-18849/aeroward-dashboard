# 🌍 AeroWard

> **Hyper-Local Air Quality Monitoring & Instant Hazard Alert System**

![Dashboard Demo](https://lovely-madeleine-ac6668.netlify.app/favicon.ico) **Live Demo (Dashboard):** [AeroWard Command Center](https://lovely-madeleine-ac6668.netlify.app/)  
**Live Demo (Citizen App):** *(Add your Netlify/Expo Web link here or an APK link)*

---

## 🚨 The Problem: "Averages Lie"
Right now, if you check the AQI in a city, you get a single average number. But averages hide the truth. A school just 5 miles away might be engulfed in hazardous construction dust, while the rest of the city breathes easy. Current systems are reactive, slow, and fail to protect citizens from sudden, hyper-local toxic events. 

## 💡 The Solution: AeroWard
AeroWard is a proactive, closed-loop nervous system for the city. It combines IoT sensor data, AI-driven anomaly detection, and instant citizen communication to close the gap between **detection** and **protection**.

### Key Features
* 🗺️ **Metro Command Center (Web):** A real-time dashboard for city admins to monitor a mesh network of ward-level IoT sensors.
* 🤖 **AI Anomaly Detection:** Doesn't just report "bad air." The AI analyzes chemical signatures (e.g., high PM10 but low NO2) to identify specific hazards like unpermitted construction dust versus traffic smog.
* ⚡ **Automated Mitigation:** Generative AI instantly drafts mitigation plans (e.g., "Dispatch Water Sprinklers") for one-click admin approval.
* 📱 **Citizen App (Mobile):** A React Native mobile app that gives citizens a live look at their specific zone.
* 🚨 **Zero-Latency Alerts:** When an admin dispatches a mitigation plan, the citizen app instantly flashes a "Red Alert" instructing users to close windows and wear masks.

---

## 📸 System Previews

### 1. The Command Center (Next.js)
*(Drag and drop your dashboard screenshot here)*

### 2. The Citizen App (React Native)
*(Drag and drop your mobile app screenshot here)*

---

## 🛠️ Tech Stack

**Frontend (Admin Dashboard)**
* Framework: Next.js (React)
* Styling: Tailwind CSS
* Charts & Icons: Recharts, Lucide React

**Mobile (Citizen App)**
* Framework: React Native (Expo)
* UI/UX: Custom Animations, Glassmorphism, Dynamic Status Bar

**Backend / AI Logic (Simulated for Demo)**
* Python (Data processing & AI threshold logic)
* Simulated IoT JSON endpoints

---

## 🚀 How to Run Locally

### 1. Running the Admin Dashboard
```bash
# Clone the repository
git clone [https://github.com/Aditya-18849/aeroward-dashboard.git](https://github.com/Aditya-18849/aeroward-dashboard.git)

# Navigate into the project
cd aeroward-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
