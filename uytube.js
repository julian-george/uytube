const express = require('express');
const app = express();
const PORT = process.env.PORT;

app.use(express.static('www'));

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));