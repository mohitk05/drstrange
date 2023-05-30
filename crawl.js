const http = require('https');
const cheerio = require('cheerio');

const crawl = ({ url, parent }, db) => {
    return new Promise((res, rej) => {
        http.get(url, (response => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            })
            response.on('end', async () => {
                await db.insertOne({
                    url,
                    parent,
                    html: data
                });
                res(parseUrls(data));
            })
            response.on('error', (e) => {
                // rej(e);
                res([]);
            })
        }))
    })
}

const parseUrls = (html) => {
    const $ = cheerio.load(html);
    const links = $('a').map((i, el) => $(el).attr('href'));
    return Array.from(new Set(links));
}

module.exports = crawl;