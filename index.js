

//// Global Objects
const express = require('express');
const { json } = require('express');
const app = express();
const fs = require('fs');
const WebSocket = require('ws');

//// Global variables
let strAppConfig;

if (fs.existsSync('camillaNodeConfig.json')) {
    strAppConfig = fs.readFileSync('camillaNodeConfig.json');
} else {
    strAppConfig = JSON.stringify({"port":80})
    fs.writeFileSync('camillaNodeConfig.json',strAppConfig);   
}
let appConfig = JSON.parse(strAppConfig);

PORT = appConfig.port;
let currentConfigName="";




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


app.post('/saveConfigName',(req,res)=>{
    let queryResponse="";
    req.on('data', function(chunk) {queryResponse+=chunk;}).on('end', function(){
        //let currentConfig= JSON.parse(queryResponse);        
        fs.writeFileSync("currentConfig.json",queryResponse)
    })
})

app.get('/getConfigName',(req,res)=>{
    let currentConfig = fs.readFileSync("currentConfig.json")
    res.write(JSON.stringify(currentConfig.toString('utf-8')));    
    res.end()
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


app.get('/log',function(req,res){    
    // Check camilla    

})

app.get('/restartService',function(req,res){
    // const { exec } = require('child_process');
    // exec('sudo service camilldasp restart', (err, stdout, stderr) => {
    //     if (err) {
    //         //some err occurred
    //         console.error(err);
    //         // res.write({"status":"error","details":stderr})            
    //     } else {
    //     // the *entire* stdout and stderr (buffered)
    //     console.log(`stdout: ${stdout}`);
    //     console.log(`stderr: ${stderr}`);
    //     }
    // })
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