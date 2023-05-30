const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017/drstrange');
const connect = async () => {
    await client.connect();
    console.log('Connected to DB')
    return client;
}

connect().then(() => {
    const database = client.db("drstrange");
    const crawlsDb = database.collection("crawls4");
    http.createServer(async (req, res) => {
        if (req.url === '/') {
            const rs = fs.createReadStream('./index.html');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            rs.pipe(res);
            return;
        }

        if (req.url === '/api/graph') {
            let nodes = await crawlsDb.find({}, { projection: { html: 0 } });
            let response = [], edges = [];
            for await (const node of nodes) {
                response.push({ data: { id: node._id }, label: ' ' });
                if (!node.parent) continue;
                const parent = await crawlsDb.findOne({ url: node.parent });
                if (!parent) continue;
                edges.push({ data: { id: node._id + '_' + parent._id, source: parent._id, target: node._id }, label: ' ' });
            }
            response = response.concat(edges);
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(response));
            res.end();
            return;
        }
    }).listen(3000, () => {
        console.log('Started listening on 3000')
    });
})