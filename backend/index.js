const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const Music = require("./Music.js");
// defines the port that the static site listens on, makes it so heroku can define it
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB successfully connected.");
  })
  .catch((error) => {
    console.log("Connection Error: " + error);
  });

app.use(cors());
app.use(bodyParser.json());

// creates new, unique ID for each music file
const ID = async () => {
  let alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  let str = "";
  for (let i = 0; i < 6; i++) {
    str += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
  }
  return await Music.findOne({ id: str })
    .then((file) => {
      if (!file) return str;
      else return ID();
    })
    .catch((error) => {
      throw error;
    });
};

function Success(message) {
  this.status = true;
  this.message = message;
}

function Failure(message) {
  this.status = false;
  this.message = message;
}

app.get("/get", (req, res) => {
  const id = req.query.id;
  Music.findOne({ id: id })
    .then((file) => {
      if (!file) res.end(JSON.stringify(new Failure("ID not found")));
      else res.end(JSON.stringify(new Success({ data: file })));
    })
    .catch((error) => {
      const errorText = "Error: " + error;
      console.log(errorText);
      res.end(JSON.stringify(new Failure(errorText)));
    });
});

app.post("/add", (req, res, next) => {
  req.on("data", (data) => {
    let musObj;
    try {
      musObj = JSON.parse(data.toString());
    } catch (err) {
      res.end(JSON.stringify(new Failure(err).message));
    }
    ID()
      .then((id) => {
        const newMusic = new Music({
          id: id,
          data: musObj,
        });
        newMusic
          .save()
          .then(() => {
            res.end(JSON.stringify(new Success({ id: id })));
          })
          .catch((err) => {
            throw err;
          });
      })
      .catch((error) => {
        const errorText = "Error: " + error;
        console.log(errorText);
        res.end(JSON.stringify(new Failure(errorText).message));
      });
  });
});

app.use(express.static("./frontend"));

app.listen(PORT, () =>
  console.log(
    `Server listening on port ${PORT}. \nView at http://127.0.0.1:${PORT}.`
  )
);
