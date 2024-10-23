require('newrelic');
const express = require('express');
const app = express();
const port = 8080;

const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

// Маршрут для збору метрик Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Маршрут для кореневої сторінки
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Маршрут GET для products
app.get('/products/:productId', (req, res) => {
  const productId = req.params.productId;
  res.json({
    id: productId,
    name: `${productId} name`
  });
});

// Маршрут GET для category
app.get('/categories/:categoryId', (req, res) => {
    const categoryId = req.params.categoryId;
    res.json({
      id: categoryId,
      name: `${categoryId} category`
    });
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});