const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const app = express();

// CORS middleware - tillad requests fra Shopify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://dit-design.dk');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Håndter preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '50mb' }));

// Shopify app konfiguration - med fallback hvis API ikke er tilgængelig
let shopify = null;
try {
  const Shopify = require('@shopify/shopify-api');
  shopify = new Shopify({
    apiKey: process.env.SHOPIFY_API_KEY || 'test_key',
    apiSecretKey: process.env.SHOPIFY_API_SECRET || 'test_secret',
    scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
    hostName: (process.env.HOST || 'localhost:3000').replace(/https?:\/\//, ''),
    isEmbeddedApp: true,
    apiVersion: '2024-01'
  });
  console.log('Shopify API initialiseret');
} catch (error) {
  console.log('Shopify API ikke tilgængelig, kører uden webhook support:', error.message);
}

// Database til at gemme customizer data
let customizerOrders = new Map();

// Middleware til at parse customizer data fra cart
app.post('/api/customizer/save', async (req, res) => {
  try {
    const { customizerData, orderId } = req.body;
    
    if (!customizerData || !orderId) {
      return res.status(400).json({ error: 'Manglende data' });
    }
    
    // Gem billeder permanent
    const savedImages = await saveCustomizerImages(customizerData, orderId);
    
    // Gem order data
    customizerOrders.set(orderId, {
      ...customizerData,
      savedImages,
      orderId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    
    res.json({ success: true, orderId, savedImages });
  } catch (error) {
    console.error('Fejl ved gem af customizer data:', error);
    res.status(500).json({ error: 'Server fejl' });
  }
});

// Funktion til at gemme billeder permanent
async function saveCustomizerImages(customizerData, orderId) {
  const savedImages = {};
  const orderDir = path.join(__dirname, 'uploads', orderId);
  
  // Opret mappe til denne ordre
  await fs.mkdir(orderDir, { recursive: true });
  
  // Gem billeder for hver view
  for (const [view, elements] of Object.entries(customizerData.elements)) {
    if (elements.length > 0) {
      const viewDir = path.join(orderDir, view);
      await fs.mkdir(viewDir, { recursive: true });
      
      // Generer høj-kvalitet billede for denne view
      const imagePath = await generateHighQualityImage(elements, view, customizerData.productSizes[view], viewDir);
      savedImages[view] = imagePath;
      
      // Gem individuelle billeder
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.type === 'image') {
          const imageFileName = `image_${i + 1}.png`;
          const imagePath = path.join(viewDir, imageFileName);
          
          // Konverter base64 til fil
          const base64Data = element.src.replace(/^data:image\/[a-z]+;base64,/, '');
          await fs.writeFile(imagePath, base64Data, 'base64');
          
          savedImages[`${view}_image_${i + 1}`] = imagePath;
        }
      }
    }
  }
  
  return savedImages;
}

// Funktion til at generere høj-kvalitet billede
async function generateHighQualityImage(elements, view, productSize, outputDir) {
  const scale = 4; // 4x opløsning for høj kvalitet
  const canvas = createCanvas(productSize.width * scale, productSize.height * scale);
  const ctx = canvas.getContext('2d');
  
  // Sæt høj kvalitet rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Skaler context
  ctx.scale(scale, scale);
  
  // Tegn alle elementer
  for (const element of elements) {
    ctx.save();
    
    if (element.type === 'image') {
      // Load og tegn billede
      const img = await loadImage(Buffer.from(element.src.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64'));
      
      ctx.translate(element.x + element.width/2, element.y + element.height/2);
      ctx.rotate(element.rotation * Math.PI / 180);
      ctx.scale(element.scale, element.scale);
      ctx.drawImage(img, -element.width/2, -element.height/2, element.width, element.height);
      
    } else if (element.type === 'text') {
      // Tegn tekst
      ctx.font = `${element.size}px ${element.font}`;
      ctx.fillStyle = element.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.translate(element.x, element.y);
      ctx.rotate(element.rotation * Math.PI / 180);
      ctx.scale(element.scale, element.scale);
      
      ctx.fillText(element.text, 0, 0);
    }
    
    ctx.restore();
  }
  
  // Gem billedet
  const outputPath = path.join(outputDir, `${view}_complete.png`);
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
  
  return outputPath;
}

// Admin endpoint til at liste alle customizer ordrer
app.get('/api/admin/orders', (req, res) => {
  const orders = Array.from(customizerOrders.values()).map(order => ({
    orderId: order.orderId,
    createdAt: order.createdAt,
    status: order.status,
    customizerPrice: order.customizerPrice,
    elements: order.elements // Send hele elements objektet med detaljerede data
  }));
  
  res.json(orders);
});

// Admin endpoint til at downloade billeder for en ordre
app.get('/api/admin/orders/:orderId/download/:view', async (req, res) => {
  try {
    const { orderId, view } = req.params;
    const order = customizerOrders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Ordre ikke fundet' });
    }
    
    const imagePath = order.savedImages[view];
    if (!imagePath) {
      return res.status(404).json({ error: 'Billede ikke fundet' });
    }
    
    res.download(imagePath);
  } catch (error) {
    console.error('Fejl ved download:', error);
    res.status(500).json({ error: 'Server fejl' });
  }
});

// Admin endpoint til at downloade alle billeder for en ordre
app.get('/api/admin/orders/:orderId/download-all', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = customizerOrders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Ordre ikke fundet' });
    }
    
    // Opret ZIP fil med alle billeder
    const archiver = require('archiver');
    const archive = archiver('zip');
    
    res.attachment(`customizer_order_${orderId}.zip`);
    archive.pipe(res);
    
    for (const [view, imagePath] of Object.entries(order.savedImages)) {
      if (imagePath && await fs.access(imagePath).then(() => true).catch(() => false)) {
        archive.file(imagePath, { name: `${view}.png` });
      }
    }
    
    await archive.finalize();
  } catch (error) {
    console.error('Fejl ved download af alle billeder:', error);
    res.status(500).json({ error: 'Server fejl' });
  }
});

// Admin endpoint til at få detaljer for en ordre
app.get('/api/admin/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = customizerOrders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Ordre ikke fundet' });
  }
  
  res.json(order);
});

// Admin endpoint til at opdatere ordre status
app.put('/api/admin/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  const order = customizerOrders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Ordre ikke fundet' });
  }
  
  order.status = status;
  order.updatedAt = new Date().toISOString();
  
  customizerOrders.set(orderId, order);
  
  res.json({ success: true, order });
});

// Webhook til at håndtere ordre oprettelse (kun hvis Shopify API er tilgængelig)
if (shopify) {
  app.post('/webhooks/orders/create', async (req, res) => {
    try {
      const order = req.body;
      
      // Find customizer data i line items
      for (const item of order.line_items) {
        if (item.properties && item.properties._customizer_data) {
          const customizerData = JSON.parse(item.properties._customizer_data);
          const orderId = order.id.toString();
          
          // Gem billeder og data
          await saveCustomizerImages(customizerData, orderId);
          
          // Opdater order med rigtig ID
          customizerOrders.set(orderId, {
            ...customizerData,
            orderId,
            shopifyOrderId: order.id,
            customerEmail: order.email,
            customerName: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim(),
            createdAt: new Date().toISOString(),
            status: 'new'
          });
          
          console.log(`Customizer data gemt for ordre ${orderId}`);
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Fejl ved webhook:', error);
      res.status(500).send('Error');
    }
  });
} else {
  console.log('Webhook endpoint ikke tilgængelig - Shopify API mangler');
}

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Customizer Backend App kører!', 
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Serve admin interface
app.use('/admin', express.static(path.join(__dirname, 'admin')));

const PORT = process.env.PORT || 3000;

// Bedre fejlhåndtering
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`Customizer backend app kører på port ${PORT}`);
  console.log(`Admin interface: http://localhost:${PORT}/admin`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
