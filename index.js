const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== SECURITY & MIDDLEWARE ==========
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'your-domain.com' : '*',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static('public'));

// ========== FILE STORAGE SETUP ==========
const storageDir = path.join(__dirname, 'storage');
const uploadsDir = path.join(__dirname, 'public/uploads');

async function ensureDirectories() {
  try {
    await fs.mkdir(storageDir, { recursive: true });
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const counterPath = path.join(storageDir, 'counter.json');
    try {
      await fs.access(counterPath);
    } catch {
      await fs.writeFile(counterPath, JSON.stringify({ visits: 0, toolUsage: {} }, null, 2));
    }
  } catch (err) {
    console.error('Directory creation error:', err);
  }
}
ensureDirectories();

// ========== UTILITY FUNCTIONS ==========
async function updateCounter(toolName = null) {
  try {
    const counterPath = path.join(storageDir, 'counter.json');
    const data = await fs.readFile(counterPath, 'utf8');
    const counter = JSON.parse(data);
    counter.visits = (counter.visits || 0) + 1;
    if (toolName) {
      counter.toolUsage[toolName] = (counter.toolUsage[toolName] || 0) + 1;
    }
    await fs.writeFile(counterPath, JSON.stringify(counter, null, 2));
    return counter;
  } catch (err) {
    console.error('Counter update error:', err);
    return null;
  }
}

// ========== REMOVE BACKGROUND ==========
const multerStorage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});
const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed'));
    }
  }
});

app.post('/api/removebg', upload.single('image'), async (req, res) => {
  try {
    await updateCounter('removebg');
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const imgUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    const apiUrl = `https://api-library-kohi.onrender.com/api/removebg?url=${encodeURIComponent(imgUrl)}`;
    
    const response = await axios.get(apiUrl, { timeout: 30000 });
    
    if (response.data?.data?.url) {
      res.json({ success: true, url: response.data.data.url, message: 'Background removed successfully!' });
    } else {
      throw new Error('Invalid response from removal service');
    }
  } catch (error) {
    console.error('Remove BG error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to remove background. Please try again.' });
  }
});

// ========== FBSHARE (NO RATE LIMIT, WITH BACKUP API) ==========
const ua_list = [
  "Mozilla/5.0 (Linux; Android 10; Wildfire E Lite) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/298.0.0.10.115;]",
  "Mozilla/5.0 (Linux; Android 11; KINGKONG 5 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/320.0.0.12.108;]",
  "Mozilla/5.0 (Linux; Android 11; G91 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.126 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/325.0.1.4.108;]"
];

let shareHistory = [];
let activeShares = new Map();
const HISTORY_FILE = path.join(__dirname, 'history.json');

// Load history on startup
(async () => {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    shareHistory = JSON.parse(data);
  } catch (err) {
    console.log('No existing history found, starting fresh');
    shareHistory = [];
  }
})();

// Save history periodically
setInterval(async () => {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(shareHistory, null, 2));
  } catch (err) {
    console.error('Error saving history:', err);
  }
}, 60000);

async function extractToken(cookie, ua, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get("https://business.facebook.com/business_locations", {
        headers: {
          "user-agent": ua,
          "referer": "https://www.facebook.com/",
          "Cookie": cookie,
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.5",
          "dnt": "1",
          "connection": "keep-alive",
          "upgrade-insecure-requests": "1"
        },
        timeout: 15000,
        maxRedirects: 5
      });
      const patterns = [/(EAAG\w+)/, /(EAA[A-Za-z0-9]+)/, /access_token=([^&\s"]+)/];
      for (const pattern of patterns) {
        const match = response.data.match(pattern);
        if (match) return match[1];
      }
      return null;
    } catch (err) {
      console.error(`Token extraction attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) return null;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

async function performShare(postLink, token, cookie, ua, shareId, totalLimit) {
  const results = [];
  for (let i = 0; i < totalLimit; i++) {
    if (activeShares.get(shareId) === 'cancelled') break;
    try {
      const response = await axios.post("https://graph.facebook.com/v18.0/me/feed", null, {
        params: { link: postLink, access_token: token, published: 0 },
        headers: {
          "user-agent": ua,
          "Cookie": cookie,
          "accept": "application/json, text/plain, */*",
          "origin": "https://business.facebook.com",
          "referer": "https://business.facebook.com/"
        },
        timeout: 15000
      });
      if (response.data && response.data.id) {
        results.push({ success: true, id: response.data.id });
        const item = shareHistory.find(h => h.id === shareId);
        if (item) {
          item.success = results.length;
          item.progress = Math.round((results.length / totalLimit) * 100);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    } catch (err) {
      results.push({ success: false, error: err.message });
      if (err.response && err.response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
  return {
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    total: results.length
  };
}

app.post('/api/share', async (req, res) => {
  const shareId = Date.now();
  try {
    await updateCounter('fbshare');
    const { cookie, link, limit } = req.body;
    const limitNum = parseInt(limit);
    
    if (!cookie || !link || !limitNum || limitNum > 5000) {
      return res.status(400).json({ status: false, message: 'Cookie, link, and limit (max 5000) are required.' });
    }
    
    const ua = ua_list[Math.floor(Math.random() * ua_list.length)];
    let token = await extractToken(cookie, ua);
    let successCount = 0;
    
    const historyEntry = {
      id: shareId,
      link,
      requested: limitNum,
      success: 0,
      failed: 0,
      status: 'processing',
      progress: 0,
      startTime: new Date().toISOString(),
      endTime: null
    };
    shareHistory.unshift(historyEntry);
    activeShares.set(shareId, 'active');
    
    if (token) {
      const result = await performShare(link, token, cookie, ua, shareId, limitNum);
      successCount = result.success;
      historyEntry.success = result.success;
      historyEntry.failed = result.failed;
    }
    
    // Backup API fallback
    if (successCount < limitNum * 0.5) {
      console.log('Using backup API for remaining shares...');
      try {
        const backupUrl = `https://vern-rest-api.vercel.app/api/share?cookie=${encodeURIComponent(cookie)}&link=${encodeURIComponent(link)}&limit=${limitNum - successCount}`;
        const backupResponse = await axios.get(backupUrl, { timeout: 30000 });
        if (backupResponse.data?.status && backupResponse.data?.success_count) {
          successCount += backupResponse.data.success_count;
          historyEntry.success = successCount;
          historyEntry.failed = limitNum - successCount;
        }
      } catch (backupErr) {
        console.error('Backup API failed:', backupErr.message);
      }
    }
    
    historyEntry.status = successCount > 0 ? 'completed' : 'failed';
    historyEntry.endTime = new Date().toISOString();
    historyEntry.progress = 100;
    activeShares.delete(shareId);
    
    res.json({ 
      status: true, 
      message: `Shared ${successCount} times successfully.`, 
      share_id: shareId, 
      success_count: successCount,
      failed_count: limitNum - successCount,
      history: historyEntry 
    });
    
  } catch (error) {
    console.error('Share error:', error);
    activeShares.delete(shareId);
    res.status(500).json({ status: false, message: 'Server error. Please try again.' });
  }
});

app.get('/api/share/history', (req, res) => {
  res.json({ status: true, history: shareHistory.slice(0, 50) });
});

app.get('/api/share/:id/progress', (req, res) => {
  const share = shareHistory.find(h => h.id == req.params.id);
  if (!share) return res.status(404).json({ status: false });
  res.json({ status: true, share });
});

// ========== MEDIA DOWNLOADER ==========
const API_ENDPOINTS = {
  tiktok: (url) => `https://api.zenithapi.qzz.io/tiktok?url=${encodeURIComponent(url)}`,
  instagram: (url) => `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(url)}`,
  youtube: (url) => `https://jonell.ccprojects.gleeze.com/api/d/youtubedl?url=${encodeURIComponent(url)}`,
  spotify: (url) => `https://api.zenithapi.qzz.io/spotify?url=${encodeURIComponent(url)}`,
  facebook: (url) => `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(url)}`,
  soundcloud: (url) => `https://jonell.ccprojects.gleeze.com/api/soundcloud?url=${encodeURIComponent(url)}`
};

app.post('/api/download-media', async (req, res) => {
  try {
    await updateCounter('mediadownloader');
    const { platform, url } = req.body;
    if (!platform || !url) {
      return res.status(400).json({ success: false, error: 'Platform and URL are required' });
    }
    const apiUrl = API_ENDPOINTS[platform](url);
    const response = await axios.get(apiUrl, { timeout: 30000 });
    res.json({ success: true, data: response.data, platform });
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch media. Please check the URL.' });
  }
});

// ========== FB COVER MAKER ==========
app.get('/api/fbcover', async (req, res) => {
  try {
    await updateCounter('fbcover');
    const { name, color, address, email, subname, sdt, uid } = req.query;
    // UID is now required
    if (!uid) {
      return res.status(400).json({ success: false, error: 'Facebook UID is required' });
    }
    const coverUrl = `https://hiroshi-api.onrender.com/canvas/fbcoverv2?name=${encodeURIComponent(name || 'User')}&color=${encodeURIComponent(color || 'blue')}&address=${encodeURIComponent(address || '')}&email=${encodeURIComponent(email || '')}&subname=${encodeURIComponent(subname || '')}&sdt=${encodeURIComponent(sdt || '')}&uid=${encodeURIComponent(uid)}`;
    
    const response = await axios.get(coverUrl, { responseType: 'arraybuffer', timeout: 30000 });
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Cover maker error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate cover image.' });
  }
});

// ========== STATS & HEALTH ==========
app.get('/api/stats', async (req, res) => {
  try {
    const counterPath = path.join(storageDir, 'counter.json');
    const data = await fs.readFile(counterPath, 'utf8');
    const counter = JSON.parse(data);
    
    // Calculate share stats
    const totalShares = shareHistory.length;
    const totalSuccess = shareHistory.reduce((acc, curr) => acc + (curr.success || 0), 0);
    const totalFailed = shareHistory.reduce((acc, curr) => acc + (curr.failed || 0), 0);
    const successRate = totalShares > 0 ? Math.round((totalSuccess / (totalSuccess + totalFailed)) * 100) : 0;
    
    res.json({ 
      success: true, 
      stats: {
        visits: counter.visits,
        toolUsage: counter.toolUsage,
        shareStats: { totalShares, totalSuccess, totalFailed, successRate }
      }
    });
  } catch (err) {
    res.json({ success: true, stats: { visits: 0, toolUsage: {}, shareStats: { totalShares: 0, totalSuccess: 0, totalFailed: 0, successRate: 0 } } });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ========== FRONTEND ROUTES ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
});