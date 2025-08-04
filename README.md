# 🎨 Customizer Backend App

En Shopify backend app til at håndtere produkt customizer ordrer og DTF-print billeder.

## ✨ Funktioner

- **Automatisk billede gem** når kunder tilføjer produkter til kurv
- **Høj kvalitet billeder** (4x opløsning, 300 DPI) til DTF-print
- **Admin interface** til at håndtere ordrer
- **Download funktionalitet** for alle billeder i ZIP format
- **Ordre status håndtering** (Ny, Afventer, I Produktion, Færdig)
- **Webhook integration** med Shopify ordrer

## 🚀 Installation

### 1. Forudsætninger

- Node.js 16+ installeret
- Shopify Partner konto
- Shopify app credentials

### 2. Klon og installer

```bash
# Klon projektet
git clone <repository-url>
cd customizer-backend-app

# Installer dependencies
npm install
```

### 3. Konfiguration

Opret en `.env` fil i roden af projektet:

```env
# Shopify App Credentials
SHOPIFY_API_KEY=din_api_key_her
SHOPIFY_API_SECRET=din_api_secret_her
HOST=https://din-app-url.com

# Server konfiguration
PORT=3000
NODE_ENV=production

# Sikkerhed
SESSION_SECRET=din_session_secret_her
```

### 4. Shopify App Setup

1. **Opret en ny app** i Shopify Partner Dashboard
2. **Tilføj scopes:**
   - `read_products`
   - `write_products`
   - `read_orders`
   - `write_orders`
3. **Konfigurer webhooks:**
   - `orders/create` → `https://din-app-url.com/webhooks/orders/create`
4. **Tilføj app til din shop**

### 5. Start app'en

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📁 Projekt Struktur

```
customizer-backend-app/
├── app.js                 # Hoved app fil
├── package.json           # Dependencies
├── README.md             # Denne fil
├── admin/
│   └── index.html        # Admin interface
├── uploads/              # Gemte billeder (oprettes automatisk)
└── .env                  # Miljø variabler (oprettes manuelt)
```

## 🔧 API Endpoints

### Admin Endpoints

- `GET /api/admin/orders` - Liste alle customizer ordrer
- `GET /api/admin/orders/:orderId` - Få detaljer for en ordre
- `GET /api/admin/orders/:orderId/download/:view` - Download billede for specifik view
- `GET /api/admin/orders/:orderId/download-all` - Download alle billeder som ZIP
- `PUT /api/admin/orders/:orderId/status` - Opdater ordre status

### Customizer Endpoints

- `POST /api/customizer/save` - Gem customizer data og billeder

### Webhooks

- `POST /webhooks/orders/create` - Håndter nye Shopify ordrer

## 🎯 Sådan bruger du det

### 1. Kunde oplevelse

1. Kunden bruger customizeren på din Shopify shop
2. Tilføjer billeder og tekst til produkter
3. Klikker "Tilføj til kurv"
4. Customizer data gemmes automatisk i backend

### 2. Admin oplevelse

1. Gå til `https://din-app-url.com/admin`
2. Se alle customizer ordrer
3. Klik "Download Alle Billeder" for at få ZIP fil
4. Brug billederne til DTF-print

## 📊 Ordre Status

- **Ny** - Ordre er lige oprettet
- **Afventer** - Ordre afventer behandling
- **I Produktion** - Ordre er under produktion
- **Færdig** - Ordre er færdig behandlet

## 🖼️ Billede Kvalitet

- **Opløsning:** 4x skaleret (høj kvalitet)
- **Format:** PNG med transparent baggrund
- **DPI:** 300 DPI beregnet
- **Størrelse:** Faktiske produkt dimensioner

## 🔒 Sikkerhed

- Alle endpoints er beskyttet
- Billeder gemmes sikkert på server
- Webhook validering
- CORS konfiguration

## 🚨 Troubleshooting

### Fejl: "Canvas module not found"
```bash
# På Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# På macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# På Windows
# Installer Visual Studio Build Tools
```

### Fejl: "Permission denied" ved upload
```bash
# Giv skrive tilladelse til uploads mappe
chmod 755 uploads/
```

### Fejl: "Webhook not working"
1. Tjek at webhook URL er korrekt
2. Verificer at app har de rigtige scopes
3. Tjek server logs for fejl

## 📞 Support

Hvis du har problemer eller spørgsmål:

1. Tjek denne README
2. Se server logs for fejl
3. Kontakt support

## 🔄 Opdateringer

For at opdatere app'en:

```bash
git pull origin main
npm install
npm start
```

## 📝 Licens

MIT License - se LICENSE fil for detaljer. 