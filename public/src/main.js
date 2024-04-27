


function mainBodyOnLoad() {    
    if (document.title !='CamillaNode') return;
    window.mainframe = document.getElementById('mainframe');    

    // Find all navigate items and add event handler to change them to links to their target attribute        
    const navigates = document.getElementsByClassName("navigate");    
    for (i=0;i<navigates.length;i++) {        
        navigates[i].addEventListener('click',function (){ 
            let target =this.getAttribute('target')
            if (target.length>0) window.mainframe.src=target;             
        })
    }    

    // Hide indicators.
    let indicators = document.getElementById("indicators")
    if (indicators!=null) indicators.style = 'display:none'

    // Connect to camillaDSP
    conectToDSP();
    

}

async function conectToDSP() {
    const DSP = new camillaDSP();
    await DSP.connect();

    let version = document.getElementById('version')
    DSP.sendDSPMessage("GetVersion").then(r=>version.innerText="CamillaDSP Version "+r);

    let status = document.getElementById('status')            
    DSP.sendDSPMessage("GetState").then(r=>status.innerText=r);    


    setInterval(async ()=>{
        let status = document.getElementById('status')            
        DSP.sendDSPMessage("GetState").then(r=>status.innerText=r);                        
    },5000);
    window.DSP= DSP;        
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function saveToLocalStorage(val) {
    window.localStorage.setItem(val.key,val.value);
    
}

async function importFilters(filterText,DSP) {
    let filterArray = parseAutoEQText(filterText);
    // console.log(filterArray);
    DSP.updateFilters(filterArray);
    
}

function filterToJSON(filter) {                        
    let tmpObj = new Object();        
    
    if (filter.enabled) gain=0;            
    
    if (filter.type=="Gain") {
         tmpObj={"type":"Gain","parameters":{"gain":filter.gain,"inverted":false,"scale":"dB"}};
     } else {
        tmpObj={"type":"Biquad","parameters":{"type":filter.type,"freq":filter.freq,"gain":filter.gain,"q":filter.q}};       
     }
     console.log("json",tmpObj)    
    return tmpObj;
}

function parseAutoEQText(text) {    
    let lines = text.split('\n');
    let filterArray=[];            
    let filter={};
    let i=0;
    //console.log(lines)

    for (let line of lines) {
        if (line.length<3) continue;
        //console.log(line)
        let name = line.substring(0,line.indexOf(':'));
        let lineFragments = line.substring(line.indexOf(':')+1).split(' ');
        // console.log(name,lineFragments)

        let enabled,filterType,gain,freq,qfact;        

        if (name=='Preamp') { 
            //if (typeof lineFragments[1]!="number") return false;
            enabled=true;
            gain=lineFragments[1]; 
            freq=0;
            qfact=0; 
            filterType="Gain"            
            enabled=true;
            name="Gain"
        } else {
            //if (typeof lineFragments[2]!="number" || typeof lineFragments[4]!="number" || typeof lineFragments[7]!="number" || typeof lineFragments[10]!="number" ) return false;            
            i<10?name="Filter0"+i:name="Filter"+i;            
            enabled=lineFragments[1].toLowerCase()=="on"?true:false;
            filterType=lineFragments[2];
            freq=lineFragments[4];
            gain=lineFragments[7];
            qfact=lineFragments[10];
        }         

        //console.log(filterType)
        
        switch (filterType) {
            case "PK":
                filterType="Peaking";
                break;
            case "LSC":
                filterType="Lowshelf";
                break;
            case "HSC":
                filterType="Highshelf"
                break;
            default:
                break;
        }

        if (name!="Gain" && parseInt(freq)==0) continue;

        filter={};
        filter[name] = {
            "enabled"   : enabled,
            "type"      : filterType,
            "freq"      : parseInt(freq),
            "gain"      : parseFloat(gain),
            "q"         : parseFloat(qfact)
        }

        // console.log(filter[name])

        filterArray.push(filter);        
        i++;
    }
    // console.log("parse",filterArray)    
    return filterArray;
}

function getActivePage() {
    return window.document.frame.src.split("/")[3];            
}

async function connect(camillaDSP) {
    const server = document.getElementById('server').value;        
    const port = document.getElementById('port').value;    
    const spectrumPort = document.getElementById('spectrumPort').value;    

    const DSP = new camillaDSP();                

    let state = document.getElementById("state");
    let connected = await DSP.connect(server,port,spectrumPort)    

    if (connected) {
        window.localStorage.setItem("server",server);
        window.localStorage.setItem("port",port);           
        window.localStorage.setItem("spectrumPort",spectrumPort);           
        console.log("Connected.") 
    } else {                            
        state.innerText="Can not connect to DSP. Make sure you got the corrent name or IP address and port, and the websocket server is enabled on external interface.";
        state.style.color="#C66";
        return -1;
    }

    
    let config =  await DSP.sendDSPMessage("GetConfigJson");                     
    if (config.pipeline==null || config.mixers==null || config.filter==null) config = camillaDSP.getDefaultConfig(config,true);
                
    conencted = DSP.sendDSPMessage({"SetConfigJson":JSON.stringify(config)});            
    if (connected) {
        state.innerText="Connected.";
        state.style.color="#6C6";
    } else {
        state.innerText="Error uploading configuration.";
        state.style.color="#EC6";
    }            
    
    // state.innerText="Connected.";
    // state.style.color="#6C6";

    // Update indcators 
    let samplingRate=document.getElementById("samplingRate") 
    let clippingIndicator=document.getElementById("clippingIndicator")
    let limiter=document.getElementById("limiter")
    let balance=document.getElementById("balance")
    let crossfeed=document.getElementById("crossfeed")
    let filters=document.getElementById("filters")
    let spectrum=document.getElementById("spectrum")
    let DSPstate=document.getElementById("DSPState")
    let DSPversion=document.getElementById("DSPVersion")
    let nodeVersion=document.getElementById("nodeVersion")

    let int=setInterval(function(int){                            
        state.innerText='';                
        window.clearInterval(int);
    },5000);            
}          

/*

Preamp: -6dB dB
Filter 1: ON LSC Fc 45 Hz Gain 4 dB Q 0.7
Filter 2: ON PK Fc 87 Hz Gain -5 dB Q 8.7
Filter 3: ON LSC Fc 100 Hz Gain 6 dB Q 0.7
Filter 4: ON PK Fc 120 Hz Gain -12 dB Q 5.4
Filter 5: ON PK Fc 185 Hz Gain -8 dB Q 10.7
Filter 6: ON PK Fc 300 Hz Gain -3 dB Q 3
Filter 7: ON PK Fc 600 Hz Gain -3 dB Q 0.4
Filter 8: ON PK Fc 850 Hz Gain 4 dB Q 5
Filter 9: ON PK Fc 1130 Hz Gain 4 dB Q 6
Filter 10: ON PK Fc 1500 Hz Gain 4 dB Q 0.5
Filter 11: ON HSC Fc 2000 Hz Gain -2 dB Q 0.4
Filter 12: ON PK Fc 2000 Hz Gain 4 dB Q 6
Filter 13: ON PK Fc 3000 Hz Gain 3 dB Q 1.8
Filter 14: ON PK Fc 5000 Hz Gain -2 dB Q 1.41


*/
