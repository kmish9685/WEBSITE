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
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    try {
        console.log(`Scraping: ${url}`);
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });

        const dom = new JSDOM(response.data);
        const doc = dom.window.document;

        const title = doc.querySelector('meta[property="og:title"]')?.content
            || doc.querySelector('title')?.textContent || "Unknown Title";

        const thumbnail = doc.querySelector('meta[property="og:image"]')?.content
            || doc.querySelector('meta[name="twitter:image"]')?.content
            || "https://via.placeholder.com/400x225?text=No+Thumbnail";

        // --- DYNAMIC CATEGORY LOGIC ---
        // 1. Try to get category from OG tags (some tubes use article:section or video:category)
        let categoryName = doc.querySelector('meta[property="article:section"]')?.content
            || doc.querySelector('meta[property="video:category"]')?.content;

        // 2. If no meta tag, try to extract from the URL path (e.g. site.com/category/video-title)
        if (!categoryName) {
            try {
                const parsedUrl = new URL(url);
                const pathParts = parsedUrl.pathname.split('/').filter(p => p.length > 0);
                // Often the first or second path segment is the category
                if (pathParts.length > 1) {
                    categoryName = pathParts[0].replace(/-/g, ' ');
                }
            } catch (e) { }
        }

        // 3. Fallback
        if (!categoryName) categoryName = "trending";

        // Clean up category name and create ID
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1); // Capitalize
        const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');

        const videoData = {
            id: "v_" + Date.now(),
            title: title.trim(),
            thumbnail: thumbnail,
            url: url,
            category: categoryId,
            views: Math.floor(Math.random() * 500) + "K",
            duration: Math.floor(Math.random() * 10 + 2) + ":00"
        };

        // --- UPDATE DATA.JS ---
        const dataPath = path.join(__dirname, 'data.js');
        let dataContent = fs.readFileSync(dataPath, 'utf8');

        // Check if category exists, if not inject it
        if (!dataContent.includes(`"id": "${categoryId}"`)) {
            const newCatObj = { id: categoryId, name: categoryName };
            // Simple string replacement to inject the new category into the array
            dataContent = dataContent.replace(
                /const categories = \[\s*\{/i,
                `const categories = [\n    ${JSON.stringify(newCatObj)},\n    {`
            );
            console.log(`Created new category: ${categoryName}`);
        }

        fs.writeFileSync(dataPath, dataContent);

        // Append the video
        const appendString = `\n// Auto-added via Admin\nvideoDatabase.unshift(${JSON.stringify(videoData, null, 2)});\n`;
        fs.appendFileSync(dataPath, appendString);

        console.log("Successfully added:", videoData.title);
        res.json({ success: true, video: videoData, categoryCreated: categoryName });
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
