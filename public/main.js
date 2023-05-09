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

const defaultFreqList = [30,100,200,800,1000,2000,4000,6000,8000,12000]

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
    let legend = {"display":"Display Settings","general":"General Settings","equalizer":"Equalizer Settings"}
    let display = {
        "mainHue":{"title":"Main Hue","value":210,"params":{"format":"range","min":0,"max":360}},
        "saturation":{"title":"Saturation","value":30,"params":{"format":"range","min":10,"max":80}},
        "headerHue":{"title":"Header Hue","value":210,"params":{"format":"range","min":0,"max":360}},        
        "hueRotate" : {"title":"Change EQ Band Color With Chaning Gain","value":true,"params":{"format":"boolean"}},
        "eqparamFontSize": {"title":"Equalizer Parameter Font Size","value":14,"params":{"format":"range","min":11,"max":16}},
    }

    let general = {
        "messageboxDefaultTimeOut":{"title":"Message box default timeout duration","value":1500,"params":{"format":"range","min":500,"max":3000}},

    }
    let equalizer = { 
        "MaxDB":{"title":"Maximum gain in db","value":16,"params":{"format":"range","min":6,"max":30}},
        "MaxBands" : {"title":"Maximum number of EQ bands","value":24,"params":{"format":"range","min":6,"max":36}},
        "showLevelBars" :{"title":"Show level bars","value":true,"params":{"format":"boolean"}},      
        "autoUpload":{"title":"Automatically upload changes to DSP","value":false,"params":{"format":"boolean"}},
        "autoDownload":{"title":"Download loaded config from DSP at startup","value":true,"params":{"format":"boolean"}},            
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

