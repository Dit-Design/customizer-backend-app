# 🚀 Railway Deployment Guide

## Trin 1: Opret Railway konto
1. Gå til [railway.app](https://railway.app)
2. Klik "Start a New Project"
3. Log ind med GitHub

## Trin 2: Upload til GitHub
1. Opret et nyt repository på GitHub
2. Upload alle filer fra `customizer-backend-app` mappen
3. Sørg for at `.env` fil IKKE er inkluderet (den skal være i .gitignore)

## Trin 3: Deploy på Railway
1. I Railway dashboard, klik "Deploy from GitHub repo"
2. Vælg dit repository
3. Railway vil automatisk detektere at det er en Node.js app

## Trin 4: Konfigurer miljø variabler
I Railway dashboard, tilføj disse variabler:

```
SHOPIFY_API_KEY=din_api_key_her
SHOPIFY_API_SECRET=din_api_secret_her
HOST=https://din-app-url.railway.app
PORT=3000
NODE_ENV=production
SESSION_SECRET=din_session_secret_her
```

## Trin 5: Få din app URL
1. Railway vil give dig en URL som: `https://din-app-navn.railway.app`
2. Kopier denne URL

## Trin 6: Opdater customizer kode
I din `Sections/Custom-product-preview.liquid` fil, erstat:
```javascript
const backendResponse = await fetch('https://din-backend-app-url.com/api/customizer/save', {
```

Med:
```javascript
const backendResponse = await fetch('https://din-app-navn.railway.app/api/customizer/save', {
```

## Trin 7: Test systemet
1. Gå til `https://din-app-navn.railway.app/admin`
2. Du skulle gerne se admin interface
3. Test customizer på din Shopify shop

## Troubleshooting
- Hvis app ikke starter: Tjek Railway logs
- Hvis billeder ikke gemmes: Tjek uploads mappe tilladelser
- Hvis webhook ikke virker: Verificer URL i Shopify Partner Dashboard 