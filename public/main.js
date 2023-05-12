
const camillaNodeVersion = "0.2.0"
let preferences;


loadPreferences();

// Load settings
const MaxDB= parseInt(getSettingValue("MaxDB"));
const hueRotate = getSettingValue("hueRotate");
const maxBands = getSettingValue("MaxBands");
const showLevelBars = getSettingValue("showLevelBars");
const headerHue = parseInt(getSettingValue("headerHue"));
const mainHue = parseInt(getSettingValue("mainHue"));
const eqparamFontSize = parseInt(getSettingValue("eqparamFontSize"))+"px";
const autoDownload = getSettingValue("autoDownload");
const autoUpload = getSettingValue("autoUpload");
const saturation = getSettingValue("saturation");
const levelmeterHeight = parseInt(getSettingValue("levelmeterHeight"));
const showClippingIndicator = getSettingValue("showClippingIndicator");
const configCount = parseInt(getSettingValue("configCount"));

const defaultFreqList = [30,100,200,500,1000,2000,4000,6000,8000,12000]

//////////////////////////////////////// Settings & Preferences Related Functions

function loadPreferences() {
    let preferencesString = window.localStorage.getItem('preferences');
    if (preferencesString==undefined) preferences = loadDefaultPreferences(); else preferences =JSON.parse(preferencesString);
    window.localStorage.setItem('preferences',JSON.stringify(preferences));
    //console.log(preferences)
}

function loadSettings() {
    let settingsElement = document.getElementById('settings');

    let legend = preferences.legend;
    for (let group of Object.keys(legend)) {
        groupElement = document.createElement('div');        
        groupElement.className='settingsGroup';
        
        groupTitleElement = document.createElement('div');        
        groupTitleElement.innerText=legend[group];
        groupTitleElement.className='settingsGroupTitle';

        groupElement.appendChild(groupTitleElement);
        
        for (let item of Object.keys(preferences[group])) {
            let itemElement;
            let itemTitle = document.createElement('div');            
            itemTitle.innerText=preferences[group][item].title;

            switch (preferences[group][item].params.format) {
                case "boolean":
                    itemElement = document.createElement("input")
                    itemElement.type="checkbox";
                    if (preferences[group][item].value) itemElement.checked=true;
                    break;
                case "range":
                    itemElement = document.createElement("input")
                    itemElement.type="range";
                    itemElement.min = preferences[group][item].params.min;
                    itemElement.max = preferences[group][item].params.max;
                    itemElement.value = preferences[group][item].value
                    break;            
            }
            itemElement.setAttribute("settingName",item);
            itemElement.id = item;

            groupElement.appendChild(itemTitle);
            groupElement.appendChild(itemElement);
            // console.log(group+":"+item+":"+preferences[group][item].params.format)
        }

        settingsElement.appendChild(groupElement);
        settingsElement.appendChild(document.createElement('hr'))
    }
}

function loadDefaultPreferences() {
    let legend = {"display":"Display Preferences","general":"General Preferences","equalizer":"Equalizer Preferences"}
    let display = {
        "mainHue":{"title":"Main Hue","value":190,"params":{"format":"range","min":0,"max":360}},        
        "headerHue":{"title":"Header Hue","value":190,"params":{"format":"range","min":0,"max":360}},        
        "saturation":{"title":"Saturation","value":30,"params":{"format":"range","min":10,"max":80}},
        "hueRotate" : {"title":"Change EQ Band Color With Chaning Gain","value":true,"params":{"format":"boolean"}},
        "eqparamFontSize": {"title":"Equalizer Parameter Font Size (px)","value":14,"params":{"format":"range","min":11,"max":16}},
    }

    let general = {
        "messageboxDefaultTimeOut":{"title":"Message box default timeout duration","value":1500,"params":{"format":"range","min":500,"max":3000}},
    }
    let equalizer = { 
        "MaxDB":{"title":"Maximum Gain (dB)","value":16,"params":{"format":"range","min":6,"max":30}},
        "MaxBands" : {"title":"Maximum Number of EQ Bands","value":24,"params":{"format":"range","min":6,"max":36}},
        "showLevelBars" :{"title":"Show Level Bars","value":true,"params":{"format":"boolean"}},      
        // "showClippingIndicator" :{"title":"Show Clipping Indicator","value":true,"params":{"format":"boolean"}},      
        "levelmeterHeight":{"title":"Level bar height (px)","value":20,"params":{"format":"range","min":10,"max":40}},
        "autoUpload":{"title":"Automatically Upload Changes to DSP","value":false,"params":{"format":"boolean"}},
        "autoDownload":{"title":"Download EQ Config From DSP at Startup","value":true,"params":{"format":"boolean"}}, 
        "configCount":{"title":"Number of saved configurations to show","value":6,"params":{"format":"range","min":3,"max":12}},           
    }
    return {"legend":legend,"display":display,"general":general,"equalizer":equalizer}
}


function getSettingValue(setting) {
    return getObjectValue(preferences,setting)        
}

function setSettingValue(setting,value) {        
    return setObjectValue(preferences,setting,value)        
}

function getObjectValue(searchObject,searchKey) {
    let found = undefined;
    found = searchObject[searchKey];        
    if (found!=undefined) return found;        
    for (let key of Object.keys(searchObject)) {            
        if (typeof searchObject[key]=="object") {                                            
            let found = getObjectValue(searchObject[key],searchKey);   
            if (found!=undefined) return found.value;
        }
    }                
    return found;
}

function setObjectValue(searchObject,searchKey,value) {
    let found = undefined;
    found = searchObject[searchKey];        

    if (found!=undefined) { 
        found.value=value;  
        return true; 
    }       

    for (let key of Object.keys(searchObject)) {            
        if (typeof searchObject[key]=="object") {                                            
            let found = getObjectValue(searchObject[key],searchKey);   
            //console.log(found)
            if (found!=undefined) { 
                found.value=value;  
                return true; 
            }       
        }
        
    }                
    return false;
}

//////////////////////////////////////////////// Interacting with the node.js server ///////////////////////////////////////////////

function getConfigFromServer(configName) {         
    return new Promise ((resolve,reject)=>{
          fetch('/getConfig?configName='+configName).then((res)=>res.json()).then((data)=>{resolve(data)}).catch(err=>reject(err));        
    })    
}

function JSONToYaml(jsonObject) {

}


//////////////////////////////////////// Generic UI Functions ///////////////



////////////////////////////////////////// Server Configuration 

function getServerList() {
    let serverConfig = window.localStorage.getItem("serverConfig");
    
    if (serverConfig == undefined) {
        serverConfig=defaultServerConfig();
    }else { 
        serverConfig=JSON.parse(serverConfig);
    }

    return serverConfig
}

function defaultServerConfig() {
    return [{"Raspberry Pi 4":{"serverIp":"192.168.50.74","port":"1234","default":false}}]
}

function addServerConfig(serverConfig) {
    let existingServerConfig = getServerList();
    existingServerConfig.push(serverConfig);
    saveServerConfig(existingServerConfig);    
}

function saveServerConfig(serverConfig) {
    window.localStorage.setItem("serverConfig",JSON.stringify(serverConfig))
}

function getDefaultServerConfig() {
    let serverConfig =getServerList()[0];    
    //console.log(serverConfig)
    let serverName = Object.keys(serverConfig)[0];   

    let retObject = {}
    retObject.serverName =serverName
    retObject.serverIp=serverConfig[serverName].serverIp;
    retObject.port=serverConfig[serverName].port;

    return retObject;
}