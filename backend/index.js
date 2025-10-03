const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors()); // разрешает фронтенду подключаться

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));