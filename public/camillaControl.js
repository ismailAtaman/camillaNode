let server, port;
let connected = false;
let ws;

async function connect() {
    return new Promise((resolve,reject)=>{
        if (server.length==0 || port.length==0)  reject({"Status":"Error","Reason":"No server or port specified.","Details":"None"});

        ws = new WebSocket("ws://"+server+":"+port);

        ws.addEventListener("error", function (m){
            reject({"Status":"Error","Reason":"Can not connect to server.","Details":m});
            
        });

        ws.addEventListener("open", (event) => {            
            message="GetVersion";
            ws.send(JSON.stringify(message));        
        });

        ws.addEventListener("message", function (m){
            try {
                const res = JSON.parse(m.data);                                                                   
                if (res['GetVersion'].result=='Ok') {
                    CamillaDSPVersion=res['GetVersion'].value;                        
                    resolve("Success");
                }          
            }
            catch(err) {
                reject({"Status":"Error","Reason":"Can not connect to server.","Details":err});
            }  
        })
    });       
}

async function uploadConfigToDSP(filterArray) {        
    if (filterArray.length==0) return;    
    let DSPConfig = await sendDSPMessage('GetConfigJson');

    let filters = new Object();
    let pipeline = new Array();      
    let filterNameArray = new Array();

    // console.log(filterArray)

    for (let filter of filterArray) {
        let filterName=Object.keys(filter)[0];
        filters[filterName] = {
            "type": "Biquad",
            "parameters": {
            "type": "Peaking",
            "freq": filter[filterName].freq,
            "q": filter[filterName].q,
            "gain": filter[filterName].gain,
            }                    
        }
        filterNameArray.push(filterName);
    }

    pipeline.push({
        "type": "Filter",
        "channel": 0,
        "names": filterNameArray
    })

    pipeline.push(channel1 = {
        "type": "Filter",
        "channel": 1,
        "names": filterNameArray
    })

    // console.log(filters);
    // console.log(pipeline)    

    DSPConfig.filters=filters;
    DSPConfig.pipeline=pipeline;

    let message={'SetConfigJson':JSON.stringify(DSPConfig)};
    sendDSPMessage(message).then(()=>{console.log('Upload successful');}).catch(()=>{console.log('Upload failed.')});
    
}
    


async function saveConfig() {
    fetch('/saveConfig',{
        method: "POST",
        headers: {
            'Accept' : 'application/json',
            'content-type' : 'application/json'
        },
        body: JSON.stringify(DSPConfig)});    
}

async function getConfig() {
    message="GetConfigJson";
    sendDSPMessage(message);  
}

async function downloadConfigFromDSP() {
    return new Promise((resolve,reject)=>{
        sendDSPMessage('GetConfigJson').then((DSPConfig)=>{resolve(DSPConfig)}).catch((err)=>reject(err));
    })
}

async function sendDSPMessage(message) {
    return new Promise((resolve,reject)=>{
        ws.send(JSON.stringify(message));        
        
        ws.addEventListener('message',function(m){
            const res = JSON.parse(m.data);     
            // console.log(res);

            const responseCommand = Object.keys(res)[0];
            const result = res[responseCommand].result;
            const value =  res[responseCommand].value;

            // console.log("Command : "+responseCommand)
            // console.log("Result : "+result)
            // console.log("Value : "+value)

            switch (responseCommand) {
                case 'GetVersion':
                    if (result=='Ok') {
                        DSPVersion=JSON.parse(value);    
                        resolve();
                    } else {
                        reject(value)
                    }
                    break;        
        
                case 'GetConfigJson':
                    if (result=='Ok') {
                        DSPConfig=JSON.parse(value);    
                        resolve(DSPConfig);                        
                    } else {
                        reject(value)
                    }
                    break;                            
                            
                case 'SetConfigJson':
                    if (result=='Ok') {                        
                        resolve(true);
                    } else {                        
                        reject(value)
                    }
                    break;        
        
                case 'GetState':
                    if (result=='Ok') {            
                        DSPState=value;
                        console.log(DSPState);            
                        resolve(DSPState);
                    } else {
                        reject(value)
                    }

                default:
                    console.log("Unhandled DSP message")
                    console.log(res);
            }

            resolve(true);
        })

        ws.addEventListener('error',function(m){
            reject(m.data);
        })

    })     
}


