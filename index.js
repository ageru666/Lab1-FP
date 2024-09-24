const express = require('express');
const app = express();
const port = 3000;

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
  // feature

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
