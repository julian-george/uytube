const express = require('express');
const app = express();
const backend_app = require('./uytube.js')
require('dotenv').config()
// defines the port that the static site listens on, makes it so heroku can define it
const PORT = process.env.PORT;

app.use(express.static('www'));

app.listen(PORT, () => console.log(`Frontend server listening on port ${PORT}`));
backend_app.listen(3001, () => console.log(`Backend server listening on port 3001`));