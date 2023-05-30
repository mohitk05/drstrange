const { EventEmitter } = require('events');
const { promisify } = require("util");
const QUEUE_NAME = 'to_crawl';
const redisClient = global.redisClient;
const lpop = promisify(redisClient.lpop).bind(redisClient, QUEUE_NAME);
const rpush = promisify(redisClient.rpush).bind(redisClient, QUEUE_NAME);
const llen = promisify(redisClient.llen).bind(redisClient, QUEUE_NAME);
const lfirst = promisify(redisClient.lrange).bind(redisClient, QUEUE_NAME, 0, 0);
const hset = promisify(redisClient.hset).bind(redisClient, 'urls_seen');
const hget = promisify(redisClient.hget).bind(redisClient, 'urls_seen');

class CrawlQueue extends EventEmitter {
    constructor(init) {
        super();
        init && init.forEach(u => {
            this.add(u, null);
        })
    }

    async dequeue() {
        let size = await this.size();
        return !size ? null : await lpop();
    }

    async size() {
        return await llen();
    }

    async peek() {
        let size = await this.size();
        return !size ? null : await lfirst();
    }

    async add(url, parent) {
        if (await hget(url) == '1') return;
        await rpush(JSON.stringify({ url, parent }));
        await hset(url, '1');
        await this.log();
        if (await this.size() === 1) this.emit('pull');
    }

    async log() {
        console.log('URLs in queue: ', await this.size());
    }
}

module.exports = CrawlQueue;