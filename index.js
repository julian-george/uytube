const express = require('express');
const app = express();
const Music = require('./Music.js')
require('dotenv').config()
// defines the port that the static site listens on, makes it so heroku can define it
const PORT = process.env.PORT;
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
mongoose.connect('mongodb://ec2-3-15-150-147.us-east-2.compute.amazonaws.com:27017/uytube', {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{console.log("MongoDB successfully connected")}).catch((error)=>{console.log("Connection Error: "+error)});

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
    return await Music.findOne({'id':str}).then((err,file)=>{
            if (!file) return str;
            else return ID();
        }).catch((error)=>{
            throw error
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
    }).catch((error)=>{console.log("Error: "+error)})
})

app.post('/add', (req,res) =>{
    req.on("data",(data)=>{
        let musObj= JSON.parse(data.toString());
        ID().then((id)=>{
            const newMusic = new Music({
                'id':id,
                'data':musObj,
            });
            newMusic.save(()=>{
                res.end(JSON.stringify(new Success({id:id})))
            })
        }).catch((error)=>{console.log("Error: "+error)});  
    })
})

app.use(express.static('www'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));