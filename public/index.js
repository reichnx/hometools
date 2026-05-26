<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Media Tools Dashboard - RemoveBG, FBshare, Downloader, FB Cover</title>
    <link rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/4712/4712109.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            transition: background 0.3s ease, color 0.3s ease;
            min-height: 100vh;
            overflow-x: hidden;
        }
        #particles-js {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        }
        /* Light Mode */
        body.light-mode {
            background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
            color: #1a1a2e;
        }
        body.light-mode .main-wrapper { background: rgba(255, 255, 255, 0.92); }
        body.light-mode .card, body.light-mode .input-section, body.light-mode .result-section {
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.05);
        }
        body.light-mode .sidebar {
            background: rgba(255, 255, 255, 0.98);
            border-right: 1px solid rgba(0,0,0,0.08);
        }
        body.light-mode .menu-item { color: #1f2937; }
        body.light-mode .menu-item:hover { background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%); }
        body.light-mode .menu-item.active {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            color: #4f46e5;
            border-left: 3px solid #667eea;
        }
        body.light-mode .platform-card { background: #f8fafc; border: 1px solid #e2e8f0; }
        body.light-mode .platform-card.active { background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-color: #667eea; }
        body.light-mode input, body.light-mode textarea { background: white; border: 2px solid #e2e8f0; color: #1f2937; }
        /* Dark Mode */
        body.dark-mode {
            background: linear-gradient(135deg, #0a0a12 0%, #0f0f1a 100%);
            color: #eef2ff;
        }
        body.dark-mode .main-wrapper { background: rgba(10, 10, 18, 0.94); }
        body.dark-mode .card, body.dark-mode .input-section, body.dark-mode .result-section {
            background: rgba(18, 18, 31, 0.95);
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            border: 1px solid rgba(102,126,234,0.1);
        }
        body.dark-mode .sidebar { background: #0f0f1a; border-right: 1px solid #1e293b; }
        body.dark-mode .menu-item { color: #cbd5e6; }
        body.dark-mode .menu-item:hover { background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); }
        body.dark-mode .menu-item.active {
            background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
            color: #818cf8;
            border-left: 3px solid #818cf8;
        }
        body.dark-mode .platform-card { background: #1a1c2e; border: 1px solid #2d2d44; }
        body.dark-mode .platform-card.active { background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); border-color: #818cf8; }
        body.dark-mode input, body.dark-mode textarea { background: #1a1a2e; color: white; border-color: #2d2d44; }
        /* Layout */
        .main-wrapper {
            display: flex;
            min-height: 100vh;
            position: relative;
            z-index: 1;
        }
        nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 200;
            border-bottom: 1px solid rgba(102,126,234,0.2);
        }
        body.dark-mode nav { background: rgba(15,15,26,0.95); }
        .navbar-left { display: flex; align-items: center; gap: 15px; }
        .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            gap: 5px;
        }
        .hamburger div {
            width: 25px;
            height: 3px;
            background: #667eea;
            border-radius: 3px;
            transition: 0.3s;
        }
        nav img { width: 35px; height: 35px; border-radius: 50%; object-fit: cover; }
        nav h6 { font-size: 1rem; font-weight: 600; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        #theme-button { font-size: 1.5rem; cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.3s ease; color: #667eea; }
        .sidebar {
            position: fixed;
            top: 60px;
            left: 0;
            width: 280px;
            height: calc(100vh - 60px);
            overflow-y: auto;
            padding: 20px 0;
            transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
            z-index: 100;
            backdrop-filter: blur(20px);
        }
        .sidebar::-webkit-scrollbar { width: 5px; }
        .sidebar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .sidebar::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }
        .main-content {
            flex: 1;
            margin-left: 280px;
            margin-top: 60px;
            padding: 30px;
            max-width: calc(100% - 280px);
            transition: margin-left 0.3s ease;
        }
        .sidebar-header { padding: 0 24px 20px 24px; border-bottom: 1px solid rgba(102,126,234,0.2); margin-bottom: 20px; text-align: center; }
        .sidebar-header h2 { font-size: 1.3rem; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sidebar-menu { padding: 0 16px; }
        .menu-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 16px;
            margin: 4px 0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .menu-item i { width: 24px; font-size: 1.1rem; }
        .menu-item:hover { transform: translateX(6px); }
        .card, .input-section, .result-section {
            border-radius: 28px;
            padding: 28px;
            margin-bottom: 24px;
            transition: all 0.25s ease;
        }
        .platforms {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 12px;
            margin-bottom: 24px;
        }
        .platform-card {
            border-radius: 20px;
            padding: 16px 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .platform-card:hover { transform: translateY(-3px); }
        .platform-card i { font-size: 1.8rem; margin-bottom: 8px; display: block; }
        .input-group { display: flex; gap: 12px; flex-wrap: wrap; }
        input, textarea, select {
            flex: 1;
            padding: 14px 18px;
            border-radius: 16px;
            font-size: 0.9rem;
            font-family: inherit;
            transition: all 0.2s;
        }
        input:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.2); }
        button {
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 16px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102,126,234,0.4); }
        .download-btn {
            padding: 10px 20px;
            background: linear-gradient(135deg, #27ae60 0%, #219a52 100%);
            color: white;
            border: none;
            border-radius: 40px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
        }
        .media-card {
            border-radius: 20px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 12px;
            background: rgba(102,126,234,0.05);
        }
        .loading { text-align: center; padding: 40px; }
        .loading i { font-size: 2rem; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .error { text-align: center; padding: 30px; color: #e74c3c; }
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 28px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }
        body.dark-mode .modal-content { background: #1a1c2e; color: white; }
        .close-modal {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
        }
        .greeting {
            text-align: center;
            margin-bottom: 20px;
        }
        @media (max-width: 768px) {
            .hamburger { display: flex; }
            .sidebar { transform: translateX(-100%); width: 260px; }
            .sidebar.open { transform: translateX(0); }
            .main-content { margin-left: 0; max-width: 100%; padding: 20px; }
        }
    </style>
</head>
<body>
    <div id="particles-js"></div>

    <!-- Popup Modal (Greeting + Privacy) -->
    <div id="popupModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <div class="greeting">
                <i class="fas fa-hand-peace" style="font-size: 48px; color: #667eea;"></i>
                <h2>Welcome to Media Tools!</h2>
                <p>Your all-in-one solution for background removal, media downloading, Facebook sharing, and cover creation.</p>
            </div>
            <hr style="margin: 20px 0;">
            <h3><i class="fas fa-shield-alt"></i> Privacy Policy</h3>
            <p style="font-size: 0.85rem; line-height: 1.5;">We respect your privacy. This website does not store any of your images, media, or personal data permanently. All processing is done through external APIs. Your files are temporarily cached and automatically deleted after processing. We do not share your information with third parties except as necessary to provide the tools. By using this site, you agree to these terms.</p>
            <button onclick="acceptPrivacy()" style="width: 100%; margin-top: 20px;">I Understand, Let's Go!</button>
        </div>
    </div>

    <nav>
        <div class="navbar-left">
            <div class="hamburger" onclick="toggleMenu()"><div></div><div></div><div></div></div>
            <img src="https://i.imgur.com/PuIgFvt.jpeg" alt="logo">
            <h6>DeepSeek Technology</h6>
        </div>
        <i class="ri-moon-fill" id="theme-button"></i>
    </nav>

    <div class="main-wrapper">
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h2>AutoPageBot</h2>
                <div class="subtitle">Media Tools Suite</div>
            </div>
            <div class="sidebar-menu">
                <div class="menu-item active" data-tool="dashboard">
                    <i class="fas fa-tachometer-alt"></i><span>Dashboard</span>
                </div>
                <div class="menu-item" data-tool="removebg">
                    <i class="fas fa-magic"></i><span>Remove Background</span>
                </div>
                <div class="menu-item" data-tool="fbshare">
                    <i class="fas fa-share-alt"></i><span>FB Share Tool</span>
                </div>
                <div class="menu-item" data-tool="mediadownloader">
                    <i class="fas fa-download"></i><span>Media Downloader</span>
                </div>
                <div class="menu-item" data-tool="fbcover">
                    <i class="fas fa-image"></i><span>FB Cover Maker</span>
                </div>
            </div>
            <div class="sidebar-footer" style="padding: 20px 16px; border-top: 1px solid rgba(102,126,234,0.2); margin-top: 20px;">
                <div class="menu-item" onclick="showPrivacyPolicy()">
                    <i class="fas fa-lock"></i><span>Privacy Policy</span>
                </div>
            </div>
        </div>

        <div class="main-content" id="mainContent">
            <!-- Dynamic content will be loaded here -->
            <div class="loading"><i class="fas fa-spinner fa-pulse"></i> Loading...</div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>
    <script>
        particlesJS("particles-js", {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#667eea" },
                shape: { type: "circle" },
                opacity: { value: 0.4, random: true },
                size: { value: 2.5, random: true },
                line_linked: { enable: true, distance: 150, color: "#667eea", opacity: 0.2, width: 1 },
                move: { enable: true, speed: 1, direction: "none", random: false, straight: false, out_mode: "out" }
            },
            interactivity: { detect_on: "canvas", events: { onhover: { enable: true, mode: "repulse" } } }
        });

        // Theme
        let isDarkMode = localStorage.getItem('theme') === 'dark';
        const themeButton = document.getElementById('theme-button');
        function applyTheme() {
            if (isDarkMode) {
                document.body.classList.add('dark-mode'); document.body.classList.remove('light-mode');
                themeButton.classList.remove('ri-moon-fill'); themeButton.classList.add('ri-sun-fill');
            } else {
                document.body.classList.add('light-mode'); document.body.classList.remove('dark-mode');
                themeButton.classList.remove('ri-sun-fill'); themeButton.classList.add('ri-moon-fill');
            }
        }
        applyTheme();
        themeButton.addEventListener('click', () => { isDarkMode = !isDarkMode; localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); applyTheme(); });

        // Modal handling
        let privacyAccepted = localStorage.getItem('privacyAccepted');
        function showPrivacyPolicy() { document.getElementById('popupModal').style.display = 'flex'; }
        function closeModal() { document.getElementById('popupModal').style.display = 'none'; }
        function acceptPrivacy() {
            localStorage.setItem('privacyAccepted', 'true');
            closeModal();
        }
        if (!privacyAccepted) { setTimeout(() => { showPrivacyPolicy(); }, 500); }

        // Menu & UI
        function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }
        let currentTool = 'dashboard';
        
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const tool = item.dataset.tool;
                if (tool) {
                    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
                    item.classList.add('active');
                    currentTool = tool;
                    loadTool(tool);
                }
                if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
            });
        });

        async function loadTool(tool) {
            const mainContent = document.getElementById('mainContent');
            if (tool === 'dashboard') {
                await loadDashboard();
            } else if (tool === 'removebg') {
                mainContent.innerHTML = getRemoveBGHTML();
                attachRemoveBGEvents();
            } else if (tool === 'fbshare') {
                mainContent.innerHTML = getFBShareHTML();
                attachFBShareEvents();
            } else if (tool === 'mediadownloader') {
                mainContent.innerHTML = getMediaDownloaderHTML();
                attachMediaDownloaderEvents();
            } else if (tool === 'fbcover') {
                mainContent.innerHTML = getFBCoverHTML();
                attachFBCoverEvents();
            }
        }

        async function loadDashboard() {
            try {
                const statsRes = await fetch('/api/stats');
                const statsData = await statsRes.json();
                const stats = statsData.stats || { visits: 0, toolUsage: {} };
                document.getElementById('mainContent').innerHTML = `
                    <div class="card"><h2><i class="fas fa-chart-line"></i> Dashboard</h2><p>Welcome to your media toolkit. Track usage and access all tools from the side menu.</p></div>
                    <div class="card"><h3><i class="fas fa-chart-pie"></i> Usage Statistics</h3><p><strong>Total Visits:</strong> ${stats.visits || 0}</p><p><strong>Remove BG Uses:</strong> ${stats.toolUsage?.removebg || 0}</p><p><strong>FB Share Uses:</strong> ${stats.toolUsage?.fbshare || 0}</p><p><strong>Media Downloader Uses:</strong> ${stats.toolUsage?.mediadownloader || 0}</p><p><strong>FB Cover Uses:</strong> ${stats.toolUsage?.fbcover || 0}</p></div>
                    <div class="card"><h3><i class="fas fa-rocket"></i> Quick Access</h3><div class="platforms">${['removebg','fbshare','mediadownloader','fbcover'].map(t => `<div class="platform-card" onclick="document.querySelector('[data-tool=${t}]').click()"><i class="fas ${t==='removebg'?'fa-magic':t==='fbshare'?'fa-share-alt':t==='mediadownloader'?'fa-download':'fa-image'}"></i><span>${t==='removebg'?'Remove BG':t==='fbshare'?'FB Share':t==='mediadownloader'?'Media Downloader':'FB Cover'}</span></div>`).join('')}</div></div>
                `;
            } catch(e) { console.error(e); }
        }

        function getRemoveBGHTML() {
            return `<div class="card"><h2><i class="fas fa-magic"></i> Remove Background</h2><p>Upload an image and remove its background instantly.</p></div>
            <div class="input-section"><div class="input-group"><input type="file" id="imageInput" accept="image/*"><button id="removeBgBtn"><i class="fas fa-eraser"></i> Remove Background</button></div></div>
            <div class="result-section" id="removeBgResult"><div class="result-header"><i class="fas fa-info-circle"></i><h3>Result</h3></div><div style="text-align:center;padding:30px;">Upload an image to see the result.</div></div>`;
        }

        function attachRemoveBGEvents() {
            document.getElementById('removeBgBtn').onclick = async () => {
                const file = document.getElementById('imageInput').files[0];
                if (!file) { alert('Please select an image'); return; }
                const formData = new FormData();
                formData.append('image', file);
                document.getElementById('removeBgResult').innerHTML = `<div class="loading"><i class="fas fa-spinner fa-pulse"></i><p>Removing background...</p></div>`;
                try {
                    const res = await fetch('/api/removebg', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.success) {
                        document.getElementById('removeBgResult').innerHTML = `<div class="result-header"><i class="fas fa-check-circle"></i><h3>Success!</h3></div><div class="media-card"><div class="media-info"><div class="media-title">Image with background removed</div></div><a href="${data.url}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> Download Image</a></div><img src="${data.url}" style="max-width:100%; border-radius:16px; margin-top:15px;">`;
                    } else { throw new Error(data.error); }
                } catch(e) { document.getElementById('removeBgResult').innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i><p>${e.message}</p></div>`; }
            };
        }

        function getFBShareHTML() {
            return `<div class="card"><h2><i class="fas fa-share-alt"></i> Facebook Share Tool</h2><p>Auto-share posts to Facebook (max 5000 shares). Uses backup API if main fails.</p></div>
            <div class="input-section"><div class="input-group" style="flex-direction:column;"><textarea id="fbCookie" rows="3" placeholder="Facebook cookie (entire cookie string)..."></textarea><input type="text" id="fbLink" placeholder="Post URL to share..."><input type="number" id="fbLimit" placeholder="Number of shares (max 5000)" max="5000"><button id="fbShareBtn"><i class="fas fa-share"></i> Start Sharing</button></div></div>
            <div class="result-section" id="fbShareResult"><div class="result-header"><i class="fas fa-history"></i><h3>Share History</h3></div><div id="shareHistoryList">Loading...</div></div>`;
        }

        async function attachFBShareEvents() {
            await loadShareHistory();
            document.getElementById('fbShareBtn').onclick = async () => {
                const cookie = document.getElementById('fbCookie').value.trim();
                const link = document.getElementById('fbLink').value.trim();
                const limit = parseInt(document.getElementById('fbLimit').value);
                if (!cookie || !link || !limit || limit > 5000) { alert('Valid cookie, link, and limit (max 5000) required'); return; }
                const btn = document.getElementById('fbShareBtn');
                btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Sharing...';
                try {
                    const res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cookie, link, limit }) });
                    const data = await res.json();
                    if (data.status) { alert(`✅ ${data.message}`); await loadShareHistory(); }
                    else { alert('Error: ' + data.message); }
                } catch(e) { alert('Network error: ' + e.message); }
                finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-share"></i> Start Sharing'; }
            };
        }

        async function loadShareHistory() {
            try {
                const res = await fetch('/api/share/history');
                const data = await res.json();
                const historyHtml = data.history.length ? data.history.map(h => `<div class="media-card"><div><strong>${new Date(h.timestamp).toLocaleString()}</strong><br><small>${h.link}</small></div><div>✅ ${h.success} / ${h.requested}</div></div>`).join('') : '<div style="text-align:center;padding:20px;">No share history yet.</div>';
                document.getElementById('shareHistoryList').innerHTML = historyHtml;
            } catch(e) { console.error(e); }
        }

        function getMediaDownloaderHTML() {
            return `<div class="card"><h2><i class="fas fa-download"></i> Media Downloader</h2><p>Download from TikTok, Instagram, YouTube, Spotify, Facebook, SoundCloud</p></div>
            <div class="platforms" id="downloadPlatforms"></div>
            <div class="input-section"><div class="input-group"><input type="text" id="mediaUrl" placeholder="Paste media URL..."><button id="downloadMediaBtn"><i class="fas fa-download"></i> Fetch Media</button></div></div>
            <div class="result-section" id="downloadResult"><div class="result-header"><i class="fas fa-info-circle"></i><h3>Result</h3></div><div style="text-align:center;padding:30px;">Paste a link and click Fetch.</div></div>`;
        }

        function attachMediaDownloaderEvents() {
            const platforms = ['tiktok','instagram','youtube','spotify','facebook','soundcloud'];
            let selectedPlatform = 'tiktok';
            const platformDiv = document.getElementById('downloadPlatforms');
            platformDiv.innerHTML = platforms.map(p => `<div class="platform-card ${p==='tiktok'?'active':''}" data-platform="${p}"><i class="fab fa-${p}"></i><span>${p.charAt(0).toUpperCase()+p.slice(1)}</span></div>`).join('');
            document.querySelectorAll('#downloadPlatforms .platform-card').forEach(card => {
                card.onclick = () => {
                    document.querySelectorAll('#downloadPlatforms .platform-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    selectedPlatform = card.dataset.platform;
                };
            });
            document.getElementById('downloadMediaBtn').onclick = async () => {
                const url = document.getElementById('mediaUrl').value.trim();
                if (!url) { alert('Please enter a URL'); return; }
                const btn = document.getElementById('downloadMediaBtn');
                btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Fetching...';
                document.getElementById('downloadResult').innerHTML = `<div class="loading"><i class="fas fa-spinner fa-pulse"></i><p>Fetching media...</p></div>`;
                try {
                    const res = await fetch('/api/download-media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: selectedPlatform, url }) });
                    const data = await res.json();
                    if (data.success) { displayDownloadResult(data.data, selectedPlatform); }
                    else { throw new Error(data.error); }
                } catch(e) { document.getElementById('downloadResult').innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i><p>${e.message}</p></div>`; }
                finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Fetch Media'; }
            };
        }

        function displayDownloadResult(data, platform) {
            let html = `<div class="result-header"><i class="fab fa-${platform}"></i><h3>${platform.toUpperCase()} Results</h3></div><div class="result-content">`;
            if (platform === 'tiktok' && data.data) {
                if (data.data.video) html += `<div class="media-card"><div>Video</div><a href="${data.data.video}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> Download Video</a></div>`;
                if (data.data.audio) html += `<div class="media-card"><div>Audio</div><a href="${data.data.audio}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> Download Audio</a></div>`;
            } else if ((platform === 'instagram' || platform === 'facebook') && data.data?.videoUrl) {
                html += `<div class="media-card"><div>${platform} Video</div><a href="${data.data.videoUrl}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> Download</a></div>`;
            } else if (platform === 'youtube' && data.mp3) {
                html += `<div class="media-card"><div>${data.title || 'Audio'}</div><a href="${data.mp3}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> MP3</a></div>`;
                if (data.mp4) html += `<div class="media-card"><div>Video</div><a href="${data.mp4}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> MP4</a></div>`;
            } else if (platform === 'spotify' && data.data?.download) {
                html += `<div class="media-card"><div>${data.data.title || 'Track'}</div><a href="${data.data.download}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> Download</a></div>`;
            } else if (platform === 'soundcloud' && data.url) {
                html += `<div class="media-card"><div>${data.title || 'Audio'}</div><a href="${data.url}" class="download-btn" download target="_blank"><i class="fas fa-download"></i> Download</a></div>`;
            } else { html += '<div>No downloadable media found.</div>'; }
            document.getElementById('downloadResult').innerHTML = html + '</div>';
        }

        function getFBCoverHTML() {
            return `<div class="card"><h2><i class="fas fa-image"></i> Facebook Cover Maker</h2><p>Generate a custom Facebook cover image with your details.</p></div>
            <div class="input-section"><div class="input-group" style="flex-direction:column; gap:10px;"><input type="text" id="coverName" placeholder="Your Name"><input type="text" id="coverSubname" placeholder="Subtitle"><input type="text" id="coverAddress" placeholder="Address"><input type="email" id="coverEmail" placeholder="Email"><input type="text" id="coverPhone" placeholder="Phone Number"><input type="text" id="coverUid" placeholder="Facebook UID (optional)"><select id="coverColor"><option value="red">Red</option><option value="blue">Blue</option><option value="green">Green</option><option value="purple">Purple</option><option value="orange">Orange</option></select><button id="generateCoverBtn"><i class="fas fa-image"></i> Generate Cover</button></div></div>
            <div class="result-section" id="coverResult"><div class="result-header"><i class="fas fa-image"></i><h3>Your Cover</h3></div><div style="text-align:center;padding:30px;">Fill in the details and click Generate.</div></div>`;
        }

        function attachFBCoverEvents() {
            document.getElementById('generateCoverBtn').onclick = async () => {
                const params = new URLSearchParams({
                    name: document.getElementById('coverName').value || 'User',
                    subname: document.getElementById('coverSubname').value || '',
                    address: document.getElementById('coverAddress').value || '',
                    email: document.getElementById('coverEmail').value || '',
                    sdt: document.getElementById('coverPhone').value || '',
                    uid: document.getElementById('coverUid').value || '',
                    color: document.getElementById('coverColor').value
                });
                const coverUrl = `/api/fbcover?${params.toString()}`;
                document.getElementById('coverResult').innerHTML = `<div class="result-header"><i class="fas fa-image"></i><h3>Your Cover</h3></div><div style="text-align:center;"><img src="${coverUrl}" style="max-width:100%; border-radius:16px; margin-bottom:15px;"><div><a href="${coverUrl}" class="download-btn" download="fb_cover.png"><i class="fas fa-download"></i> Download Cover</a></div></div>`;
            };
        }

        loadDashboard();
    </script>
</body>
</html>