

//// Global Objects
const express = require('express');
const { json } = require('express');
const app = express();
const fs = require('fs');
const WebSocket = require('ws');
const configsFile = "savedConfigs.dat"


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
app.use(express.static(__dirname+'/public/'));


//// Default gets
app.get('/connections',(req,res)=>{
    res.sendFile(__dirname+'/public/html/connections.html');
}) 

app.get('/basic',(req,res)=>{
    res.sendFile(__dirname+'/public/html/basic.html');
}) 

app.get('/',(req,res)=>{
    // res.render('equalizer');     
    res.sendFile(__dirname+'/public/html/main.html');
}) 


app.get('/equalizer',(req,res)=>{
    res.sendFile(__dirname+'/public/html/equalizer.html');
}) 

app.get('/advanced',(req,res)=>{
    res.sendFile(__dirname+'/public/html/advanced.html');
}) 

app.get('/room',(req,res)=>{
    res.sendFile(__dirname+'/public/html/room.html'); 
}) 

app.get('/preferences',(req,res)=>{
    res.sendFile(__dirname+'/public/html/preferences.html');
}) 

app.get('/spectrum',(req,res)=>{
    res.sendFile(__dirname+'/public/html/spectrum.html');
}) 

// app.post('/validateConfig',(req,res)=>{
//     let queryResponse="";
//     req.on('data', function(chunk) {
//         queryResponse+=chunk;        
//     }).on('end', function(){
//         let config = JSON.parse(queryResponse);              
//         let fileName = configsFile;
//         // console.log(fileName)
//         let fileBuffer = Buffer.from(JSON.stringify(config),'utf-8');        
//         fs.writeFileSync(fileName,fileBuffer,function(err){
//             console.log("Error saving file ",fileName,"\n",err);            
//         });        
//         res.end();
//     }); 
    
// })



app.post('/saveConfigName',(req,res)=>{
    let queryResponse="";
    req.on('data', function(chunk) {queryResponse+=chunk;}).on('end', function(){
        //let currentConfig= JSON.parse(queryResponse);        
        fs.writeFileSync("currentConfig.json",queryResponse)
    })
})

app.get('/getConfigName',(req,res)=>{    
    if (fs.existsSync("currentConfig.json")) {
        let currentConfig = fs.readFileSync("currentConfig.json");
        res.write(JSON.stringify(currentConfig.toString('utf-8')));    
    } else {
        let currentConfig = JSON.stringify({"configName":"","configShortcut":""})
        res.write(JSON.stringify(currentConfig));    
    }    

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

// saveConfigFile and getConfigFile are new implementations of saving configurations
// on the server as a string file which is converted to an array for loading. Rest of the config related 
// functions are obselete. (2024-05-07)

app.post('/saveConfigFile',(req,res)=>{
    let queryResponse="";
    req.on('data', function(chunk) {
        queryResponse+=chunk;        
    }).on('end', function(){
        let config = JSON.parse(queryResponse);              
        let fileName = configsFile;
        // console.log(fileName)
        let fileBuffer = Buffer.from(JSON.stringify(config),'utf-8');        
        fs.writeFileSync(fileName,fileBuffer,function(err){
            console.log("Error saving file ",fileName,"\n",err);            
        });        
        res.end();
    });    
}) 

app.get('/getConfigFile',function(req,res){    
    let filePath=configsFile;
    // console.log("File exists?",fs.existsSync(filePath))
    if (!fs.existsSync(filePath)) { 
        res.write(JSON.stringify([])); 
        res.end();
        return;
    }

    let config = fs.readFileSync(filePath);
    //console.log(config.toString());
    res.write (config.toString());
    res.end();
});


////////////////////////////////////////////////////////////////////////////////////////

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