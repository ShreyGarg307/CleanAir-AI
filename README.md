<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CleanAir & Clear Streets

A real-time civic pollution monitoring and reporting platform for citizens and municipal officers.

View your app in AI Studio: https://ai.studio/apps/26563f37-c98b-4f70-a069-30025c2cac19

---

⭐⭐⭐ Municipal Login Credentials ⭐⭐⭐

email -- email@gmail.com

pass -- 123456

or

email -- test@gmail.com

pass -- test12345

use this too login in Municipal Portal 

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

---

## Run Locally

### Step 1 — Install Dependencies

```bash
npm install
```

### Step 2 — Configure Environment Variables

Copy the example environment file:

```bash
# Windows PowerShell
Copy-Item ".env.example" ".env.local"

# macOS / Linux
cp .env.example .env.local
```

Then open `.env.local` and fill in your API keys:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Platform API key (Maps, Places, Geocoding) |
| `VITE_GOV_DATA_AQI_API_KEY` | India Open Government Data AQI API key |
| `VITE_OPENWEATHER_API_KEY` | OpenWeatherMap API key (for wind layer) |
| `VITE_WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API Phone Number ID |
| `VITE_WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API Access Token |

### Step 3 — Start the Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Demo Login Credentials

The app supports two user roles with built-in demo fallbacks:

**Citizen (Google Sign-In)**
- Click "Continue as Citizen" — uses Google OAuth popup.
- If the popup is blocked or domain is unauthorized, it auto-falls back to a demo citizen account.

**Municipal Officer (Email & Password)**
- Email: `admin@cleanair.gov`
- Password: any value (demo fallback activates automatically)

---

## Build for Production

```bash
npm run build
```

The production-ready files will be output to the `dist/` folder.
