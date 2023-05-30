const crawl = require('./crawl');
const dbConnect = require('./db');
const redisConnect = require('./redis');
const cluster = require('cluster');

const os = require('os');
const numCPUs = os.cpus().length;


const startList = [
    'https://mohitkarekar.com'
]

const wait = async (time) => {
    return new Promise((res) => {
        setTimeout(() => res(), time);
    })
}

const run = async (mongoClient) => {
    const CrawlQueue = require('./crawlQueue');
    let queue = new CrawlQueue(startList);
    const database = mongoClient.db("drstrange");
    const crawlsDb = database.collection("crawls4");
    console.log('Starting to crawl...');
    let stop = true;
    const pull = async () => {
        // console.log('Executing jobs in queue')
        while (await queue.size() > 0) {
            let obj = await queue.dequeue();
            const { url, parent } = JSON.parse(obj);
            console.log(url);
            await crawl({ url, parent }, crawlsDb)
                .then(async (links) => {
                    if (await queue.size() > 20000) {
                        stop = true;
                        return;
                    } else {
                        // if (stop) stop = false;
                    }
                    !stop && links.forEach(link => {
                        queue.add(link, url);
                    })
                })
                .catch(() => { });
        }
    }
    let i = 0;
    console.time('CRAWL');
    while (i < 20000) {
        await pull();
        i++;
    }
    console.timeEnd('CRAWL');
}

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    dbConnect().then(async client => {
        redisConnect().then(redisClient => {
            global.redisClient = redisClient;
            run(client).catch(() => { });
        })
    })
}

