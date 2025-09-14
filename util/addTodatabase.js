const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const parser = new Parser();
const { pc } = require('./pincode.js');

// Fetch RSS feed items
async function fetchRSSFeed(feedUrl, limit = 50) {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.slice(0, limit);
}

// Scrape full article text
async function fetchFullArticle(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // Avoid blocking
        });
        const $ = cheerio.load(data);

        // Extract paragraphs for BBC articles
        const paragraphs = $('article p, div[data-component="text-block"] p')
            .map((i, el) => $(el).text())
            .get();

        const fullText = paragraphs.join('\n');
        return fullText;
    } catch (err) {
        console.error('Error fetching article:', url, err.message);
        return '';
    }
}

// Prepare chunk: heading + full text
function createChunk(articleTitle, fullText) {
    return `${articleTitle}\n\n${fullText}`;
}

// Main function
async function main() {
    const feedUrl = 'http://feeds.bbci.co.uk/news/rss.xml'; // Replace with working feed
    const rssItems = await fetchRSSFeed(feedUrl);

    const articlesWithChunks = [];
    let idCounter = 4; // Start IDs from 4

    for (const item of rssItems) {
        const fullText = await fetchFullArticle(item.link);
        if (!fullText) continue;

        const chunkText = createChunk(item.title, fullText);

        articlesWithChunks.push({
            _id: String(idCounter), // Sequential ID starting from 4
            chunk_text: chunkText,
            category: JSON.stringify({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
            })
        });
        
        idCounter++; // Increment for next article
    }

    addToPinecone(articlesWithChunks);

    console.log(`Prepared ${articlesWithChunks.length} chunks from ${rssItems.length} articles.`);
    console.log(articlesWithChunks.slice(0, 3)); // Print first 3 chunks for demo
}

main();

async function addToPinecone(recordsToUpsert) {
    try{
        const namespace = pc.index("news-index")

await namespace.upsertRecords(recordsToUpsert);

console.log("Articles upserted successfully!");
    }catch(err){
        console.error("Error upserting articles:", err);
        
    }
    
}




// Get namespace using index name and host


