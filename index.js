require('dotenv').config();  
require('newrelic');

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); 
const app = express();
const port = 8080;

const client = require('prom-client');
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const url = process.env.MONGODB_URI; 
const mongoClient = new MongoClient(url);

const dbName = 'myNewDatabase';

async function main() {
  try {
    await mongoClient.connect();
    console.log('Підключено до MongoDB сервера');
    const db = mongoClient.db(dbName);
    const productsCollection = db.collection('products');

    // Маршрут для збору метрик Prometheus
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // Кореневий маршрут
    app.get('/', (req, res) => {
      res.send('Hello, World!');
    });

    // Отримати всі продукти
    app.get('/products', async (req, res) => {
      const products = await productsCollection.find({}).toArray();
      res.json(products);
    });

    // Додати новий продукт
    app.post('/products', express.json(), async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.json(result);
    });

    // Отримати продукт за ID
    app.get('/products/:productId', async (req, res) => {
    const productId = req.params.productId;

    // Перевірка, чи є productId допустимим ObjectId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).send('Неправильний формат productId');
    }

    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).send('Продукт не знайдено');
    }

    res.json(product);
});


    // Отримати категорію за ID
    app.get('/categories/:categoryId', (req, res) => {
      const categoryId = req.params.categoryId;
      res.json({
        id: categoryId,
        name: `${categoryId} category`
      });
    });

    // Запуск сервера
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error);
  }
}

main().catch(console.error);
