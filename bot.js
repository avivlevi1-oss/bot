const TelegramBot = require('node-telegram-bot-api');
const Parser = require('rss-parser');
const express = require('express'); // תוספת לשרת

// הגדרת משתני סביבה (כדי לא לשים את הטוקן בגלוי בגיטהאב)
const token = process.env.TELEGRAM_TOKEN; 
const channelId = '@globaleyesite'; 

// יצירת הבוט
const bot = new TelegramBot(token, {polling: true});
const parser = new Parser();

// --- מנגנון שרת דמה כדי ש-Render לא יכבה את הבוט ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Global Eye Bot is Active!'));
app.listen(port, () => console.log(`Server running on port ${port}`));
// ----------------------------------------------------

const FEEDS = [
    "https://rotter.net/rss/scoops1.xml",
    "https://www.0404.co.il/feed",
    "https://rss.walla.co.il/feed/22",
    "https://www.ynet.co.il/Integration/StoryRss1854.xml"
];

const IRAN_KEYWORDS = ["איראן", "טהרן", "גרעין", "משמרות המהפכה", "חמינאי", "חיזבאללה", "לבנון", "סוריה"];
let sentTitles = new Set();

async function checkNews() {
    console.log("Checking feeds...");
    for (const url of FEEDS) {
        try {
            const feed = await parser.parseURL(url);
            feed.items.forEach(item => {
                if (sentTitles.has(item.title)) return; // מניעת כפילויות

                // ניקוי כותרות רוטר
                let cleanTitle = item.title.replace(/\([^)]*\)/g, '').trim();

                const isIranNews = IRAN_KEYWORDS.some(keyword => cleanTitle.includes(keyword));

                if (isIranNews) {
                    const message = `🔴 **דיווח חדש: ${cleanTitle}**\n\nלקריאה: ${item.link}\n\n🌍 פורסם ב: GLOBAL EYE`;
                    bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
                    sentTitles.add(item.title);
                }
            });
        } catch (error) {
            console.error(`Error: ${url}`);
        }
    }
}

// ניקוי זיכרון כל 24 שעות כדי שהבוט לא יקרוס
setInterval(() => { sentTitles.clear(); }, 1000 * 60 * 60 * 24);

// בדיקה כל דקה
setInterval(checkNews, 60000);