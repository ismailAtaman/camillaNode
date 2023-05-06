//// Global variables
PORT = 80;

const { json } = require('express');
//// Global Objects
const express = require('express');
const app = express();
const fs = require('fs');
const WebSocket = require('ws');
// const client = new WebSocket('ws://192.168.50.74:1234')

//// Global settings

app.use(express.static('public'));
app.set('view engine','ejs');

//// Default gets
app.get('/',(req,res)=>{
    res.render('equalizer');     
}) 

app.get('/server',(req,res)=>{
    res.render('server');     
}) 

app.get('/device',(req,res)=>{
    res.render('device');     
}) 


app.get('/settings',(req,res)=>{
    res.render('settings');     
}) 

app.post('/saveConfig',(req,res)=>{
    let queryResponse="";
    req.on('data', function(chunk) {
        queryResponse+=chunk;        
    }).on('end', function(){
        let config = JSON.parse(queryResponse);              
        let fileName = './config/'+config.configName+'.json'
        console.log(fileName)
        let fileBuffer = Buffer.from(JSON.stringify(config),'utf-8');        
        fs.writeFileSync(fileName,fileBuffer);        
        res.end();
    });    
}) 

app.get('/getConfigList',(req,res)=>{
    let configList = Array();
    let files = fs.readdirSync('./config',);
    let fileList = Array();
    for (let file of files) {
        if (file.includes('json')) fileList.push(file.replace('.json',''));
    }
    res.write(JSON.stringify(fileList));
    res.end();
})

app.get('/getConfig',function(req,res){    
    let filePath='./config/'+req.query.configName+'.json'    
    if (!fs.existsSync(filePath)) { res.write('{"status":"error","reason":"Config not found"}'); res.end() }
    let config = fs.readFileSync(filePath);
    //console.log(config.toString());
    res.write (config.toString());
    res.end();
});

app.get('/configExists',function(req,res){    
    let filePath='./config/'+req.query.configName+'.json'    
    //console.log(filePath);
    fs.existsSync(filePath)?res.write('true'):res.write('false');
    res.end();
})

app.get('/deleteConfig',function(req,res){    
    let filePath='./config/'+req.query.configName+'.json'    
    if (!fs.existsSync(filePath)) { res.write('{"status":"error","reason":"Config not found"}'); res.end()}
    try {
        fs.unlink(filePath,(r)=>{
            if (r==null) res.write("Deleted");
            res.end();
        });
    }
    catch(err) {
        console.log("Error deleting configuration file.")
        console.log(err);
    }
    

})

// const { exec } = require('child_process');
// exec('dir', (err, stdout, stderr) => {
//   if (err) {
//     //some err occurred
//     console.error(err)
//   } else {
//    // the *entire* stdout and stderr (buffered)
//    console.log(`stdout: ${stdout}`);
//    console.log(`stderr: ${stderr}`);
//   }
// });

app.listen(PORT,console.log(`CamillaNode is running on port ${PORT}...`));