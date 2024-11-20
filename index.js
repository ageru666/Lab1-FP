require('dotenv').config();  
require('newrelic');

const express = require('express');
const axios = require('axios');  
const { MongoClient, ObjectId } = require('mongodb'); 
const redis = require('redis'); // Додаємо Redis
const compression = require('compression'); // Для стиснення відповідей
const client = require('prom-client'); // Для метрик Prometheus

const app = express();
const port = process.env.PORT || 8080;

// Prometheus: налаштування метрик
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const responseTime = new client.Histogram({
  name: 'response_time_seconds',
  help: 'Час відповіді на запит у секундах',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 3, 5]
});
register.registerMetric(responseTime);

app.use((req, res, next) => {
  const end = responseTime.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.originalUrl, status_code: res.statusCode });
  });
  next();
});

// Підключення до Redis
const redisClient = redis.createClient();

redisClient.on('connect', () => {
  console.log('Підключено до Redis');
});

redisClient.on('error', (err) => {
  console.error('Помилка Redis:', err);
});

// Гарантуємо, що Redis підключено
async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error('Помилка підключення до Redis:', err);
  }
}

const url = process.env.MONGODB_URI; 
const mongoClient = new MongoClient(url);

const dbName = 'myNewDatabase';

app.use(compression()); 

app.use('/static', express.static('public')); // Усі файли з папки `public` будуть доступні за URL `/static`


async function main() {
  try {
    await mongoClient.connect();
    console.log('Підключено до сервера MongoDB');
    const db = mongoClient.db(dbName);
    const productsCollection = db.collection('products');

    // Маршрут для збору метрик Prometheus
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // Кореневий маршрут
    app.get('/', (req, res) => {
      res.send('Привіт, Світ!');
    });

    app.get('/products/:productId', async (req, res) => {
      const start = Date.now(); // Початок вимірювання часу
      const productId = req.params.productId;
    
      if (!ObjectId.isValid(productId)) {
        return res.status(400).send('Неправильний формат productId');
      }
    
      try {
        await connectRedis(); // Гарантуємо, що Redis підключено
    
        // Перевірка кешу в Redis
        const cachedProduct = await redisClient.get(productId);
        if (cachedProduct) {
          // Оновлюємо TTI (продлеваем TTL при каждом доступе)
          await redisClient.expire(productId, 3600); // Устанавливаем новый TTL = 3600 секунд
          console.log(`TTI оновлено для продукту ${productId}`);
          const duration = Date.now() - start; // Час відповіді
          console.log(`Дані взяті з Redis для продукту ${productId}`);
          console.log(`Час відповіді: ${duration} мс`);
          return res.json(JSON.parse(cachedProduct)); // Розпарсені дані з кешу
        }
    
        // Якщо в Redis даних немає, звертаємося до MongoDB
        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
        if (!product) {
          return res.status(404).send('Продукт не знайдено');
        }
    
        // Зберігаємо дані у Redis
        await redisClient.setEx(productId, 3600, JSON.stringify(product)); // TTL = 3600 секунд
        console.log(`Дані додані до Redis для продукту ${productId}`);
        const duration = Date.now() - start; // Час відповіді
        console.log(`Час відповіді: ${duration} мс`);
        res.json(product);
      } catch (err) {
        console.error('Помилка:', err);
        res.status(500).send('Внутрішня помилка сервера');
      }
    });
    

    // Отримати категорію за ID
    app.get('/categories/:categoryId', (req, res) => {
      const categoryId = req.params.categoryId;
      res.json({
        id: categoryId,
        name: `${categoryId} категорія`
      });
    });

    app.get('/static-file', (req, res) => {
      res.sendFile(__dirname + '/public/image.jpg'); // Відправляємо конкретний файл із папки
    });

    // Запуск сервера
    app.listen(port, () => {
      console.log(`Сервер запущено за адресою http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error);
  }
}

main().catch(console.error);
