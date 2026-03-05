/**
 * Video Metadata Scraper (Aggregator Logic)
 * 
 * This script demonstrates the concept of how aggregators fetch the exact 
 * thumbnail, title, and description from a destination video page WITHOUT 
 * hosting the video itself.
 * 
 * It relies on "Open Graph" (OG) tags that almost all major video sites use.
 * 
 * Prerequisites:
 * npm install axios jsdom
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');

async function scrapeVideoMetadata(targetUrl, category) {
    try {
        console.log(`Fetching metadata for: ${targetUrl}`);

        // 1. Fetch the raw HTML of the destination page
        // We disguise our request as a normal browser so they don't block us
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // 2. Parse the HTML using JSDOM
        const dom = new JSDOM(response.data);
        const doc = dom.window.document;

        // 3. Extract the critical data using Open Graph (OG) meta tags
        // Almost ALL video sites put the exact thumbnail in `og:image`
        const title = doc.querySelector('meta[property="og:title"]')?.content
            || doc.querySelector('title')?.textContent
            || "Unknown Title";

        const thumbnail = doc.querySelector('meta[property="og:image"]')?.content
            || doc.querySelector('meta[name="twitter:image"]')?.content
            || "https://via.placeholder.com/400x225?text=No+Thumbnail";

        // 4. Create the final database object
        // Notice how the 'url' is the original targetUrl. 
        // This is the core of the redirect model.
        const videoData = {
            id: "v_" + Date.now(),
            title: title.trim(),
            thumbnail: thumbnail,
            url: targetUrl,
            category: category,
            views: Math.floor(Math.random() * 500) + "K", // Fake views for the UI
            duration: Math.floor(Math.random() * 10 + 2) + ":00" // Fake duration
        };

        console.log("Successfully scraped:\n", videoData);
        return videoData;

    } catch (error) {
        console.error(`Failed to scrape ${targetUrl}:`, error.message);
        return null;
    }
}

// === EXAMPLE USAGE ===
async function runScraper() {
    console.log("Starting Aggregator Scraper...\n");

    const newVideos = [];

    // Example: Scraping a tech review and a gaming video
    // In a real aggregator, this would be a list of 10,000+ links
    const targetLinks = [
        { url: "https://vimeo.com/76979871", category: "technology" }, // Sample Vimeo Video
        { url: "https://vimeo.com/1084537", category: "gaming" }      // Sample Vimeo Video
    ];

    for (const item of targetLinks) {
        const data = await scrapeVideoMetadata(item.url, item.category);
        if (data) newVideos.push(data);
    }

    // 5. Append this new data to our data.js file
    if (newVideos.length > 0) {
        const formattedData = `\n// Auto-scraped videos\nconst scrapedVideos = ${JSON.stringify(newVideos, null, 2)};\n// Add to existing array:\n// videoDatabase.push(...scrapedVideos);\n`;

        fs.appendFileSync('data.js', formattedData);
        console.log("\nSaved scraped data to data.js!");
    }
}

// Uncomment to run:
// runScraper();
