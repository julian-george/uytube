const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
require('dotenv').config()
const Music = require('./Music.js')
// defines the port that the static site listens on, makes it so heroku can define it
const PORT = process.env.PORT || 3000;
const MONGOURL = process.env.MONGOURL

mongoose.connect(MONGOURL, {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{console.log("MongoDB successfully connected")}).catch((error)=>{console.log("Connection Error: "+error)});

app.use(cors())
app.use(bodyParser.json())

// creates new, unique ID for each music file
const ID = async () =>{
    let alphanum= "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let str = "";
    for (let i = 0; i<6; i++) {
        str += alphanum.charAt(Math.floor(Math.random()*alphanum.length));
    }
    return await Music.findOne({'id':str}).then((file)=>{
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

function Failure (message) {
    this.status=false;
    this.message=message;
}

app.get('/get',(req,res)=>{
    console.log("GET")
    const id = req.query.id;
    Music.findOne({'id':id}).then((file)=>{
        if (!file) res.end(JSON.stringify(new Failure("ID not found")))
        else res.end(JSON.stringify(new Success({data:file})))
    }).catch((error)=>{
        const errorText="Error: "+error
        console.log(errorText)
        res.end(JSON.stringify(new Failure(errorText)))
    })
})

app.post('/add', (req,res) =>{
    console.log("POST")
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
        }).catch((error)=>{
            const errorText="Error: "+error
            console.log(errorText)
            res.end(new Failure(errorText))
        });  
    })
})

app.use(express.static('./frontend'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));