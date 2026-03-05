const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // Serves index.html and data.js

// API Endpoint to scrape and add video
app.post('/api/add-video', async (req, res) => {
    const { url, category } = req.body;
    if (!url || !category) return res.status(400).json({ error: 'Missing url or category' });

    try {
        console.log(`Scraping: ${url}`);
        // Disguise as browser
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });

        const dom = new JSDOM(response.data);
        const doc = dom.window.document;

        // Extract Title and Thumbnail from Open Graph tags
        const title = doc.querySelector('meta[property="og:title"]')?.content
            || doc.querySelector('title')?.textContent || "Unknown Title";

        const thumbnail = doc.querySelector('meta[property="og:image"]')?.content
            || doc.querySelector('meta[name="twitter:image"]')?.content
            || "https://via.placeholder.com/400x225?text=No+Thumbnail";

        // Create the new video object
        const videoData = {
            id: "v_" + Date.now(),
            title: title.trim(),
            thumbnail: thumbnail,
            url: url,
            category: category,
            views: Math.floor(Math.random() * 500) + "K",
            duration: Math.floor(Math.random() * 10 + 2) + ":00"
        };

        // Inject this directly into data.js using unshift so it appears first
        const appendString = `\n// Auto-added via Admin Panel\nvideoDatabase.unshift(${JSON.stringify(videoData, null, 2)});\n`;
        fs.appendFileSync(path.join(__dirname, 'data.js'), appendString);

        console.log("Successfully added:", videoData.title);
        res.json({ success: true, video: videoData });
    } catch (error) {
        console.error("Scraping error:", error.message);
        res.status(500).json({ error: 'Failed to scrape URL' });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`===========================================`);
    console.log(`✅ Admin Panel running at: http://localhost:${PORT}/admin.html`);
    console.log(`📺 Main Site running at: http://localhost:${PORT}/index.html`);
    console.log(`===========================================`);
});
