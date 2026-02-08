const TelegramBot = require('node-telegram-bot-api');
const Parser = require('rss-parser');
const express = require('express');

// --- הגדרות הבוט ---
// הטוקן שלך (שים לב: שמור על הקובץ הזה חסוי!)
const token = '8392824005:AAGr8he4a70SXrjBiuN3qkK68MXH6lNcI9I'; 
const channelId = '@globaleyesite'; 

// יצירת הבוט
const bot = new TelegramBot(token, {polling: true});
const parser = new Parser();

// --- מנגנון שרת דמה (כדי ש-Render/שרתים לא יכבו את הבוט) ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Global Eye Bot is Active!'));
app.listen(port, () => console.log(`Server running on port ${port}`));
// -----------------------------------------------------------

// רשימת מקורות RSS
const FEEDS = [
    "https://rotter.net/rss/scoops1.xml",
    "https://www.0404.co.il/feed",
    "https://rss.walla.co.il/feed/22",
    "https://www.ynet.co.il/Integration/StoryRss1854.xml"
];

// מילות מפתח לסינון (איראן והסביבה)
const IRAN_KEYWORDS = ["איראן", "טהרן", "גרעין", "משמרות המהפכה", "חמינאי", "חיזבאללה", "לבנון", "סוריה"];

// זיכרון זמני למניעת כפילויות
let sentTitles = new Set();

async function checkNews() {
    console.log("Checking feeds for updates...");
    for (const url of FEEDS) {
        try {
            const feed = await parser.parseURL(url);
            feed.items.forEach(item => {
                // בדיקה אם הכותרת כבר נשלחה בעבר
                if (sentTitles.has(item.title)) return; 

                // ניקוי כותרות (בעיקר לרוטר שמכניס מספר תגובות בכותרת)
                let cleanTitle = item.title.replace(/\([^)]*\)/g, '').trim();

                // בדיקה אם הכתבה מכילה מילות מפתח
                const isIranNews = IRAN_KEYWORDS.some(keyword => cleanTitle.includes(keyword));

                if (isIranNews) {
                    const message = `🔴 **דיווח חדש: ${cleanTitle}**\n\nלקריאה: ${item.link}\n\n🌍 פורסם ב: GLOBAL EYE`;
                    
                    // שליחת ההודעה לערוץ
                    bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
                    console.log(`Sent to Telegram: ${cleanTitle}`);
                    
                    // הוספה לזיכרון כדי לא לשלוח שוב
                    sentTitles.add(item.title);
                }
            });
        } catch (error) {
            console.error(`Error fetching feed ${url}:`, error.message);
        }
    }
}

// --- משימות קבועות ---

// 1. פרסום האתר פעם ב-24 שעות
setInterval(() => {
    bot.sendMessage(channelId, "📡 **GLOBAL EYE - מערכת הניטור המתקדמת**\n\nהתעדכנו בכל הדיווחים בזמן אמת דרך האתר שלנו:\nhttps://globaleye.site", { parse_mode: 'Markdown' });
}, 1000 * 60 * 60 * 24);

// 2. ניקוי זיכרון הכותרות פעם ב-24 שעות (כדי לחסוך זיכרון בשרת)
setInterval(() => { 
    sentTitles.clear(); 
    console.log("Cleared sent titles cache.");
}, 1000 * 60 * 60 * 24);

// 3. בדיקת חדשות כל דקה (60000 מילישניות)
setInterval(checkNews, 60000);

// הרצה ראשונית מיידית בעת הפעלת הבוט
checkNews();
console.log("Bot started successfully...");
