
let ws;

async function connectToDsp() {
    const config = window.localStorage.getItem("Config");
    if (config==null) {
        console.log("No configuration found.");        
        window.location.href='/server';
        sConfig = {
            "server":"192.168.50.208",
            "port" : 1234,
        };
        window.localStorage.setItem("Config",JSON.stringify(sConfig));

    } else {       
        const sConfig = JSON.parse(config);
        //console.log(sConfig);
        server = sConfig.server;
        port = sConfig.port;
    }

    const WS = new WebSocket("ws://"+server+":"+port);
    return new Promise((resolve,reject)=>{
        
        WS.addEventListener('open',function(){            
            ws = WS;
            resolve([true,WS]);
        })

        let errorListener = WS.addEventListener('error',function(m){
            WS.removeEventListener('error',errorListener);
            reject([false,m]);
        })

    })
}

function handleDSPMessage(m) {        
    const res = JSON.parse(m.data);            

    const responseCommand = Object.keys(res)[0];
    const result = res[responseCommand].result;
    const value =  res[responseCommand].value;

    // console.log("Command : "+responseCommand)
    // console.log("Result : "+result)
    // console.log("Value : "+value)    

    switch (responseCommand) {
        case 'GetVersion':
            if (result=='Ok') return [true,JSON.parse(value)]; else return[false,value];            
            break;        

        case 'GetConfigJson':
            if (result=='Ok') return [true,JSON.parse(value)]; else return[false,value];          
            break;                            
                    
        case 'SetConfigJson':
            if (result=='Ok') return [true,value]; else return[false,value];          
            break;        

        case 'GetState':
            if (result=='Ok') return [true,value]; else return[false,value];          
            break;

        case "GetPlaybackSignalPeak":
            if (result=='Ok') return [true,JSON.parse(value)]; else return[false,value];          
            break;

        case "GetPlaybackSignalRms":
            if (result=='Ok') return [true,value]; else return[false,value];           
            break;                

        case "SetUpdateInterval":
            if (result=='Ok') return [true,value]; else return[false,value];           
            break;                
        default:
            console.log("Unhandled message received from DSP : "+responseCommand);

            if (result=='Ok') return [true,JSON.parse(value)]; else return[false,value];                        
    }

    resolve(true);

}

async function sendDSPMessage(message) {
    return new Promise((resolve,reject)=>{
        let eventListener = ws.addEventListener('message',function(m){
            let handleResult = handleDSPMessage(m);
            if (handleResult[0]) resolve(handleResult[1]); else reject(handleResult[1]);
            ws.removeEventListener('message',eventListener);
        });
        ws.send(JSON.stringify(message));             
    })     
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

    return new Promise((resolve,reject)=>{
        let message={'SetConfigJson':JSON.stringify(DSPConfig)};    
        sendDSPMessage(message).then(()=>{console.log('Upload successful');resolve()}).catch(()=>{console.log('Upload failed.');reject()});
    })
    
    
}

async function downloadConfigFromDSP() {    
    return new Promise((resolve,reject)=>{
        sendDSPMessage('GetConfigJson').then(DSPConfig=>{
            resolve(DSPConfig);
        }).catch(err=>{
            console.log("downloadConfigFromDSP Error");
            console.log(err);
            reject(err)
        });
    })
}

function convertFilterArayToJSON(filterArray) {
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

    let sliderJSON = {}
    sliderJSON.filters=filters;
    sliderJSON.pipeline=pipeline;
    return sliderJSON;
}

async function saveConfig(config) {
    fetch('/saveConfig',{
        method: "POST",
        headers: {
            'Accept' : 'application/json',
            'content-type' : 'application/json'
        },
        body: JSON.stringify(config)});    
}

async function getConfig() {
    message="GetConfigJson";
    sendDSPMessage(message);  
}

