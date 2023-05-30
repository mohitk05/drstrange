const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017/drstrange');

const connect = async () => {
    await client.connect();
    console.log('Connected to DB')
    return client;
}

module.exports = connect;