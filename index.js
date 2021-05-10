const express = require('express');
const app = express();
const Music = require('./uytube.js')
require('dotenv').config()
// defines the port that the static site listens on, makes it so heroku can define it
const PORT = process.env.PORT;
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/uytube', {useNewUrlParser: true, useUnifiedTopology: true});


app.use(cors())
app.use(bodyParser.json())


// creates new, unique ID for each music file
const ID = async () =>{
    let alphanum= "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let str = "";
    for (let i = 0; i<6; i++) {
        str += alphanum.charAt(Math.floor(Math.random()*alphanum.length));
    }
    // fix promise rejection
    return await Music.findOne({'id':str}).then((file)=>{
            if (!file) return str;
            else return ID();
        })
}

function Success (message) {
    this.status=true;
    this.message=message;
}

function Error (message) {
    this.status=false;
    this.message=message;
}

app.get('/get',(req,res)=>{
    const id = req.query.id;
    Music.findOne({'id':id}).then((file)=>{
        if (!file) res.end(JSON.stringify(new Error("ID not found")))
        else res.end(JSON.stringify(new Success({data:file})))
    })
})

app.post('/add', (req,res) =>{
    req.on("data",(data)=>{
        let musObj= JSON.parse(data.toString());
        ID().then((id)=>{
            const newMusic = new Music({
                'id':id,
                'data':musObj,
            });
            newMusic.save((err)=>{
                if (err) throw err;
                res.end(JSON.stringify(new Success({id:id})))
            });
        });
    })
})



module.exports = app 

app.use(express.static('www'));

app.listen(PORT, () => console.log(`Frontend server listening on port ${PORT}`));
//backend_app.listen(3001, () => console.log(`Backend server listening on port 3001`));