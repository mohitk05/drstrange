const redis = require("redis");

module.exports = () => {
    return new Promise(res => {
        const redisClient = redis.createClient();
        redisClient.on('connect', () => {
            console.log('Redis connected')
            res(redisClient)
        });
        redisClient.on('error', (e) => rej(e));
    })
}