//// Global variables
PORT = 80;

//// Global Objects
const express = require('express');
const app = express();
const WebSocket = require('ws');
const client = new WebSocket('ws://192.168.50.74:1234')

//// Global settings
app.use(express.static('public'));
app.set('view engine','ejs');

//// Default gets
app.get('/',(req,res)=>{
    res.render('index');     
}) 

client.on('error', (e)=> {
    console.log(e);   
})

client.on('message', (m)=>{
    const mObj = JSON.parse(m);
    console.log(mObj);  
    
})

client.on('open', ()=>{
    console.log('WS Connected')
    message="GetVersion"
    client.send(JSON.stringify(message))    
})

app.listen(PORT,console.log(`CamillaNode is running on port ${PORT}...`));