const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const JSZip = require('jszip');

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
const historyFile = path.join(storageDir, 'shareHistory.json');
const counterFile = path.join(storageDir, 'counter.json');
const performanceFile = path.join(storageDir, 'performance.json');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(storageDir, { recursive: true });
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Initialize counter file if not exists
    try {
      await fs.access(counterFile);
    } catch {
      await fs.writeFile(counterFile, JSON.stringify({ 
        visits: 0, 
        toolUsage: {
          removebg: 0,
          fbshare: 0,
          mediadownloader: 0,
          fbcover: 0,
          smsbomber: 0,
          idtemplates: 0
        }
      }, null, 2));
    }
    
    // Initialize share history file if not exists
    try {
      await fs.access(historyFile);
    } catch {
      await fs.writeFile(historyFile, JSON.stringify([], null, 2));
    }
    
    // Initialize performance file if not exists
    try {
      await fs.access(performanceFile);
    } catch {
      await fs.writeFile(performanceFile, JSON.stringify({
        tools: {
          removebg: { success: 0, failed: 0, total: 0 },
          fbshare: { success: 0, failed: 0, total: 0 },
          mediadownloader: { success: 0, failed: 0, total: 0 },
          fbcover: { success: 0, failed: 0, total: 0 },
          smsbomber: { success: 0, failed: 0, total: 0 },
          idtemplates: { success: 0, failed: 0, total: 0 }
        },
        lastUpdated: new Date().toISOString()
      }, null, 2));
    }
  } catch (err) {
    console.error('Directory creation error:', err);
  }
}
ensureDirectories();

// ========== UTILITY FUNCTIONS ==========
async function updateCounter(toolName = null) {
  try {
    const data = await fs.readFile(counterFile, 'utf8');
    const counter = JSON.parse(data);
    counter.visits = (counter.visits || 0) + 1;
    if (toolName && counter.toolUsage[toolName] !== undefined) {
      counter.toolUsage[toolName] = (counter.toolUsage[toolName] || 0) + 1;
    }
    await fs.writeFile(counterFile, JSON.stringify(counter, null, 2));
    return counter;
  } catch (err) {
    console.error('Counter update error:', err);
    return null;
  }
}

async function updatePerformance(toolName, success, failed) {
  try {
    const data = await fs.readFile(performanceFile, 'utf8');
    const performance = JSON.parse(data);
    
    if (!performance.tools[toolName]) {
      performance.tools[toolName] = { success: 0, failed: 0, total: 0 };
    }
    
    performance.tools[toolName].success += success;
    performance.tools[toolName].failed += failed;
    performance.tools[toolName].total += (success + failed);
    performance.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(performanceFile, JSON.stringify(performance, null, 2));
    return performance;
  } catch (err) {
    console.error('Performance update error:', err);
    return null;
  }
}

async function getPerformance() {
  try {
    const data = await fs.readFile(performanceFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { tools: {}, lastUpdated: new Date().toISOString() };
  }
}

async function getStats() {
  try {
    const counterData = await fs.readFile(counterFile, 'utf8');
    const counter = JSON.parse(counterData);
    const historyData = await fs.readFile(historyFile, 'utf8');
    const shareHistory = JSON.parse(historyData);
    const performance = await getPerformance();
    
    const totalShares = shareHistory.length;
    const totalSuccess = shareHistory.reduce((acc, curr) => acc + (curr.success || 0), 0);
    const totalFailed = shareHistory.reduce((acc, curr) => acc + (curr.failed || 0), 0);
    const successRate = (totalSuccess + totalFailed) > 0 ? Math.round((totalSuccess / (totalSuccess + totalFailed)) * 100) : 0;
    
    return {
      visits: counter.visits || 0,
      toolUsage: counter.toolUsage || {},
      shareStats: { totalShares, totalSuccess, totalFailed, successRate },
      performance: performance.tools || {}
    };
  } catch (err) {
    console.error('Stats error:', err);
    return { visits: 0, toolUsage: {}, shareStats: { totalShares: 0, totalSuccess: 0, totalFailed: 0, successRate: 0 }, performance: {} };
  }
}

// Clean old uploaded files (older than 1 hour)
async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(uploadsDir);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = await fs.stat(filePath);
      if (now - stat.mtimeMs > 3600000) {
        await fs.unlink(filePath).catch(() => {});
        console.log(`Cleaned up: ${file}`);
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}
setInterval(cleanupOldFiles, 30 * 60 * 1000);

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
      await updatePerformance('removebg', 1, 0);
      res.json({ success: true, url: response.data.data.url, message: 'Background removed successfully!' });
    } else {
      await updatePerformance('removebg', 0, 1);
      throw new Error('Invalid response from removal service');
    }
  } catch (error) {
    console.error('Remove BG error:', error.message);
    await updatePerformance('removebg', 0, 1);
    res.status(500).json({ success: false, error: 'Failed to remove background. Please try again.' });
  }
});

// ========== FBSHARE ==========
const ua_list = [
  "Mozilla/5.0 (Linux; Android 10; Wildfire E Lite) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/298.0.0.10.115;]",
  "Mozilla/5.0 (Linux; Android 11; KINGKONG 5 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/320.0.0.12.108;]",
  "Mozilla/5.0 (Linux; Android 11; G91 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.126 Mobile Safari/537.36[FBAN/EMA;FBLC/fr_FR;FBAV/325.0.1.4.108;]"
];

let activeShares = new Map();

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

async function performShare(postLink, token, cookie, ua, shareId, totalLimit, updateProgress) {
  const results = { success: 0, failed: 0 };
  
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
        results.success++;
        updateProgress(results.success, results.failed, Math.round(((results.success + results.failed) / totalLimit) * 100));
      }
    } catch (err) {
      results.failed++;
      updateProgress(results.success, results.failed, Math.round(((results.success + results.failed) / totalLimit) * 100));
      if (err.response && err.response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  }
  return results;
}

async function saveShareHistory(history) {
  try {
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error saving share history:', err);
  }
}

async function loadShareHistory() {
  try {
    const data = await fs.readFile(historyFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

app.post('/api/share', async (req, res) => {
  const shareId = Date.now().toString();
  try {
    await updateCounter('fbshare');
    const { cookie, link, limit } = req.body;
    const limitNum = parseInt(limit);
    
    if (!cookie || !link || !limitNum || limitNum > 5000) {
      return res.status(400).json({ status: false, message: 'Cookie, link, and limit (max 5000) are required.' });
    }
    
    res.json({ status: true, message: 'Share started', share_id: shareId, total_limit: limitNum });
    
    let shareHistory = await loadShareHistory();
    const ua = ua_list[Math.floor(Math.random() * ua_list.length)];
    let token = await extractToken(cookie, ua);
    let successCount = 0;
    let failedCount = 0;
    
    const historyEntry = {
      id: shareId,
      requested: limitNum,
      success: 0,
      failed: 0,
      status: 'processing',
      progress: 0,
      startTime: new Date().toISOString(),
      endTime: null
    };
    
    shareHistory.unshift(historyEntry);
    await saveShareHistory(shareHistory);
    activeShares.set(shareId, 'active');
    
    const updateProgress = async (success, failed, progress) => {
      successCount = success;
      failedCount = failed;
      const updatedHistory = await loadShareHistory();
      const entry = updatedHistory.find(h => h.id === shareId);
      if (entry) {
        entry.success = success;
        entry.failed = failed;
        entry.progress = progress;
        await saveShareHistory(updatedHistory);
      }
    };
    
    if (token) {
      const result = await performShare(link, token, cookie, ua, shareId, limitNum, updateProgress);
      successCount = result.success;
      failedCount = result.failed;
    }
    
    if (successCount < limitNum * 0.5 && activeShares.get(shareId) !== 'cancelled') {
      console.log('Using backup API for remaining shares...');
      try {
        const backupUrl = `https://vern-rest-api.vercel.app/api/share?cookie=${encodeURIComponent(cookie)}&link=${encodeURIComponent(link)}&limit=${limitNum - successCount}`;
        const backupResponse = await axios.get(backupUrl, { timeout: 30000 });
        if (backupResponse.data?.status && backupResponse.data?.success_count) {
          successCount += backupResponse.data.success_count;
          failedCount = limitNum - successCount;
          await updateProgress(successCount, failedCount, 100);
        }
      } catch (backupErr) {
        console.error('Backup API failed:', backupErr.message);
      }
    }
    
    const finalHistory = await loadShareHistory();
    const finalEntry = finalHistory.find(h => h.id === shareId);
    if (finalEntry) {
      finalEntry.status = successCount > 0 ? 'completed' : 'failed';
      finalEntry.endTime = new Date().toISOString();
      finalEntry.success = successCount;
      finalEntry.failed = failedCount;
      finalEntry.progress = 100;
      await saveShareHistory(finalHistory);
    }
    
    await updatePerformance('fbshare', successCount, failedCount);
    activeShares.delete(shareId);
    
  } catch (error) {
    console.error('Share error:', error);
    activeShares.delete(shareId);
    if (!res.headersSent) {
      res.status(500).json({ status: false, message: 'Server error. Please try again.' });
    }
  }
});

app.get('/api/share/history', async (req, res) => {
  const history = await loadShareHistory();
  const cleanedHistory = history.slice(0, 50).map(({ link, ...rest }) => rest);
  res.json({ status: true, history: cleanedHistory });
});

app.get('/api/share/:id/progress', async (req, res) => {
  const history = await loadShareHistory();
  const share = history.find(h => h.id === req.params.id);
  if (!share) {
    return res.status(404).json({ status: false, message: 'Share not found' });
  }
  res.json({ 
    status: true, 
    share: {
      id: share.id,
      progress: share.progress || 0,
      success: share.success || 0,
      failed: share.failed || 0,
      requested: share.requested,
      status: share.status,
      active: activeShares.has(share.id)
    }
  });
});

app.post('/api/share/:id/cancel', async (req, res) => {
  const shareId = req.params.id;
  if (activeShares.has(shareId)) {
    activeShares.set(shareId, 'cancelled');
    const history = await loadShareHistory();
    const share = history.find(h => h.id === shareId);
    if (share) {
      share.status = 'cancelled';
      share.endTime = new Date().toISOString();
      await saveShareHistory(history);
    }
    res.json({ status: true, message: 'Share cancelled successfully' });
  } else {
    res.status(404).json({ status: false, message: 'No active share found with that ID' });
  }
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

async function handleSpotifyResponse(apiUrl) {
  try {
    const response = await axios.get(apiUrl, { timeout: 30000 });
    const data = response.data;
    if (data && data.success === true && data.data) {
      const spotifyData = data.data;
      const trackInfo = spotifyData.track || {};
      const downloadInfo = spotifyData.download || {};
      return {
        success: true,
        platform: 'spotify',
        data: {
          title: trackInfo.name || 'Unknown Track',
          artist: trackInfo.artists || 'Unknown Artist',
          albumImage: trackInfo.albumImage || '',
          duration: trackInfo.duration || '',
          downloadUrl: downloadInfo.url || null
        }
      };
    } else {
      throw new Error('Invalid Spotify API response structure');
    }
  } catch (error) {
    console.error('Spotify API error:', error.message);
    throw error;
  }
}

app.post('/api/download-media', async (req, res) => {
  try {
    await updateCounter('mediadownloader');
    const { platform, url } = req.body;
    if (!platform || !url) {
      return res.status(400).json({ success: false, error: 'Platform and URL are required' });
    }
    const apiUrl = API_ENDPOINTS[platform](url);
    let result;
    if (platform === 'spotify') {
      result = await handleSpotifyResponse(apiUrl);
    } else {
      const responseData = await axios.get(apiUrl, { timeout: 30000 });
      result = { success: true, platform: platform, data: responseData.data };
    }
    await updatePerformance('mediadownloader', 1, 0);
    res.json(result);
  } catch (error) {
    console.error('Download error:', error.message);
    await updatePerformance('mediadownloader', 0, 1);
    res.status(500).json({ success: false, error: 'Failed to fetch media. Please check the URL and try again.' });
  }
});

app.get('/api/spotify-download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Download URL is required' });
    }
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'audio/mpeg,audio/*,*/*',
        'Referer': 'https://open.spotify.com/',
        'Origin': 'https://open.spotify.com'
      },
      timeout: 60000
    });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="spotify_track.mp3"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.data.pipe(res);
  } catch (error) {
    console.error('Spotify download proxy error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to download audio file.' });
  }
});

// ========== SMS BOMBER ==========
const SMS_API_KEY = '66ec8aa6ce70b55c877c4489fa545c67fee8633a42442343771bd2ade432ecbd';
const SMS_API_URL = 'https://oreo.gleeze.com/api/smsbomber';

app.post('/api/smsbomb', async (req, res) => {
  try {
    await updateCounter('smsbomber');
    let { phone, amount } = req.body;
    
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    let cleanPhone = phone.toString().trim().replace(/\s/g, '');
    
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+63' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('63') && !cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    
    if (cleanPhone.length < 12 || cleanPhone.length > 15) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }
    
    let amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 1) amountNum = 1;
    if (amountNum > 50) amountNum = 50;
    
    const apiUrl = `${SMS_API_URL}?phone=${encodeURIComponent(cleanPhone)}&amount=${amountNum}&api_key=${SMS_API_KEY}`;
    
    const response = await axios.get(apiUrl, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (response.data && response.data.success === true) {
      await updatePerformance('smsbomber', 1, 0);
      res.json({
        success: true,
        message: response.data.message || `SMS bombing started for ${cleanPhone}`,
        phone: cleanPhone,
        amount: amountNum,
        instant: response.data.instant || true
      });
    } else {
      await updatePerformance('smsbomber', 0, 1);
      throw new Error(response.data?.message || 'SMS bombing failed');
    }
    
  } catch (error) {
    console.error('SMS Bomber error:', error.message);
    await updatePerformance('smsbomber', 0, 1);
    
    if (error.response?.status === 429) {
      res.status(429).json({ success: false, error: 'Rate limited. Please wait a moment before trying again.' });
    } else if (error.response?.status === 403) {
      res.status(403).json({ success: false, error: 'API access forbidden. The service may be temporarily unavailable.' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to start SMS bombing. Please try again later.' });
    }
  }
});

// ========== ID TEMPLATES ==========
const ID_TEMPLATES = {
  national: {
    name: 'National ID',
    front: 'https://iili.io/CdCmXLP.jpg',
    back: 'https://iili.io/CdCyaHb.jpg'
  },
  philhealth: {
    name: 'PhilHealth ID',
    front: 'https://iili.io/Cdn9BqP.jpg',
    back: 'https://iili.io/Cdn9jBS.jpg'
  }
};

// Get ID templates list
app.get('/api/id-templates', async (req, res) => {
  try {
    await updateCounter('idtemplates');
    await updatePerformance('idtemplates', 1, 0);
    res.json({ success: true, templates: ID_TEMPLATES });
  } catch (error) {
    console.error('ID Templates error:', error.message);
    await updatePerformance('idtemplates', 0, 1);
    res.status(500).json({ success: false, error: 'Failed to fetch ID templates' });
  }
});

// Download single image from URL (proxy to avoid CORS)
app.get('/api/id-download', async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://iili.io/',
        'Origin': 'https://iili.io'
      },
      timeout: 30000
    });
    
    const fileExt = path.extname(url).split('?')[0] || '.jpg';
    const finalFilename = filename || `id_image${fileExt}`;
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.data.pipe(res);
    
  } catch (error) {
    console.error('ID Download error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to download image' });
  }
});

// Download both images as ZIP
app.get('/api/id-download-both', async (req, res) => {
  try {
    const { frontUrl, backUrl, idName } = req.query;
    
    if (!frontUrl || !backUrl) {
      return res.status(400).json({ success: false, error: 'Both front and back URLs are required' });
    }
    
    // Fetch both images
    const [frontResponse, backResponse] = await Promise.all([
      axios.get(frontUrl, { responseType: 'arraybuffer', timeout: 30000 }),
      axios.get(backUrl, { responseType: 'arraybuffer', timeout: 30000 })
    ]);
    
    // Create ZIP file
    const zip = new JSZip();
    const safeName = idName ? idName.toLowerCase().replace(/ /g, '_') : 'id';
    
    zip.file(`${safeName}_front.jpg`, frontResponse.data);
    zip.file(`${safeName}_back.jpg`, backResponse.data);
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_both.zip"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(zipBuffer);
    
  } catch (error) {
    console.error('ID ZIP Download error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create ZIP file' });
  }
});

// ========== FB COVER MAKER ==========
app.get('/api/fbcover', async (req, res) => {
  try {
    await updateCounter('fbcover');
    const { name, color, address, email, subname, sdt, uid } = req.query;
    
    if (!uid) {
      return res.status(400).json({ success: false, error: 'Facebook UID is required' });
    }
    
    const coverUrl = `https://hiroshi-api.onrender.com/canvas/fbcoverv2?name=${encodeURIComponent(name || 'User')}&color=${encodeURIComponent(color || 'blue')}&address=${encodeURIComponent(address || '')}&email=${encodeURIComponent(email || '')}&subname=${encodeURIComponent(subname || '')}&sdt=${encodeURIComponent(sdt || '')}&uid=${encodeURIComponent(uid)}`;
    
    const response = await axios.get(coverUrl, { responseType: 'arraybuffer', timeout: 30000 });
    await updatePerformance('fbcover', 1, 0);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(response.data);
  } catch (error) {
    console.error('Cover maker error:', error.message);
    await updatePerformance('fbcover', 0, 1);
    res.status(500).json({ success: false, error: 'Failed to generate cover image.' });
  }
});

// ========== STATS & HEALTH ==========
app.get('/api/stats', async (req, res) => {
  const stats = await getStats();
  res.json({ success: true, stats });
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
  console.log(`🚀 Home Tools Server running on http://localhost:${PORT}`);
  console.log(`📁 Storage directory: ${storageDir}`);
  console.log(`📁 Performance file: ${performanceFile}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, saving data and closing...');
  await cleanupOldFiles();
  process.exit(0);
});