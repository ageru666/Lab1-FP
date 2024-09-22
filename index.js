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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
