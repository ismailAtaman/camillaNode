
async function mainBodyOnLoad() {    
    if (document.title !='CamillaNode') return;

    applyColorScheme(document);
    
    window.mainframe.addEventListener("load",function(){        
        applyColorScheme(window.mainframe.contentDocument);
    })

    window.mainframe = document.getElementById('mainframe');    

    window.mainframe.addEventListener("load",function() {
        updateActions(this.getAttribute('src').replace("/",""));        
    })

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
    // if (indicators!=null) indicators.style = 'display:none'

    // Connect to camillaDSP
    await conectToDSP();

    // Load & Apply preferences
    window.parent.activeSettings = window.preferences.getPreferences();
    applyPreferences(); 
    
    // Track which page we are on to update tools accordingly
    const eqTools = document.getElementById("eqTools");
    eqTools.childNodes.forEach(e=>{if (e.tagName=='DIV') e.style.display='none'});
    eqTools.style.display='flex';    
    const observer = new MutationObserver(mut=>{        
        mut.forEach(m=>{
            if (m.attributeName=="src") {
                const page = m.target.getAttribute('src').replace("/","");                                                                
                updateActions(page);                                
            }            
        })
    })

    observer.observe(window.mainframe,{attributes:true});    

    if (true==false) {
        document.addEventListener("mousemove",(e)=>{
            console.log(e.clientX)
            if (e.clientX<30) leftAnimateOpen();
                if (e.clientX>255) {
                if (e.timeout!=undefined) clearTimeout(timeout); 
                // if (window.leftClosing || window.leftOpening) return;
                let timeout = setTimeout(leftAnimateClose,5000);
                e.timeout= timeout;
            }
        })    

        setTimeout(()=>{        
            leftAnimateClose();
            //document.documentElement.style.setProperty("--toolbar-width",0);        
        },1000)
    }
}

function leftAnimateClose() {    
    let sectionLeft = document.getElementById("sectionLeft");
    window.leftClosing=true;
    let interval = setInterval(()=>{
        if (window.leftOpening) {
            clearInterval(interval); 
            return;
        }
        let currentWidth = sectionLeft.getBoundingClientRect().width;
        let stepSize = currentWidth / 20;
        if (stepSize<0.2) {             
            document.documentElement.style.setProperty("--toolbar-width","0px");    
            clearInterval(interval); 
            window.leftClosing=false;
            return;
        }
        document.documentElement.style.setProperty("--toolbar-width",currentWidth-stepSize+"px");        
        sectionLeft.style.opacity=(currentWidth-stepSize)/220;
    },20)    
}

function leftAnimateOpen() {    
    window.leftOpening=true;
    let interval = setInterval(()=>{
        let currentWidth = sectionLeft.getBoundingClientRect().width;
        let stepSize = (220 - currentWidth) / 15;
        if (stepSize<0.3) {             
            document.documentElement.style.setProperty("--toolbar-width","250px");    
            clearInterval(interval); 
            window.leftOpening=false;
            return;
        }
        document.documentElement.style.setProperty("--toolbar-width",currentWidth+stepSize+"px");        
        sectionLeft.style.opacity=(currentWidth+stepSize)/220;
    },30)    
}


function updateActions(page) {
    const eqTools = document.getElementById("eqTools");
    eqTools.childNodes.forEach(e=>{if (e.tagName=='DIV') e.style.display='none'});
    
    if (page=="basic") eqTools.children["basicTools"].style.display='flex';
    if (page=="equalizer") eqTools.children["equalizerTools"].style.display='flex';
    if (page=="advanced") eqTools.children["advancedTools"].style.display='flex';

}

async function conectToDSP() {
    const DSP = new camillaDSP();
    await DSP.connect();    
    window.DSP= DSP;        
    initIndicators();
}

async function initIndicators() {
    // console.log("updating indicators")

    // Update indcators 
    let samplingRateInd=document.getElementById("samplingRateInd"); 
    let uzilizationInd=document.getElementById("uzilizationInd");     
    let clippingInd=document.getElementById("clippingInd");
    let limiterInd=document.getElementById("limiterInd");
    let balanceInd=document.getElementById("balanceInd");
    let crossfeedInd=document.getElementById("crossfeedInd");
    let filtersInd=document.getElementById("filtersInd");
    let spectrumInd=document.getElementById("spectrumIndicatorInd");
    let DSPstateInd=document.getElementById("DSPStateInd");
    let DSPversionInd=document.getElementById("DSPVersionInd");
    let nodeVersionInd=document.getElementById("nodeVersionInd");

    let rate=await window.DSP.sendDSPMessage("GetCaptureRate");
    let bal = await DSP.getBalance();
    let crs = await DSP.getCrossfeed();
    let cfg = await DSP.sendDSPMessage("GetConfigJson")
    let clp = await window.DSP.sendDSPMessage("GetClippedSamples");
    let dUtl= await window.DSP.sendDSPMessage("GetProcessingLoad");
    let sUtl= await window.DSP.sendSpectrumMessage("GetProcessingLoad");
    let utl = sUtl+dUtl;

    samplingRateInd.innerText=  new Intl.NumberFormat('en-US').format(rate);
    uzilizationInd.innerText=Math.round(utl*10)/10+"%";
    if (clp>0) { clippingInd.innerText = "CLIPPED"; clippingInd.style.color="red"; } else {clippingInd.innerText = "No clipping"; clippingInd.style.color="#9A9";}
    if (bal==0) balanceInd.innerText="0 Centre";
    if (bal>0) balanceInd.innerText=bal+" Right";
    if (bal<0) balanceInd.innerText=bal+" Left";
    
    if (crs==-15) crossfeedInd.innerText="x-feed off"; else crossfeedInd.innerText="x-feed : "+crs+"dB"
    filtersInd.innerText=Object.keys(cfg.filters).length-1+" filters";
    
    

    setInterval(async function(){
        DSP.sendDSPMessage("ResetClippedSamples");
    },10000);

    setInterval(async function(){                            
        let bal = await DSP.getBalance();
        let cfg = await DSP.sendDSPMessage("GetConfigJson")
        let crs = await DSP.getCrossfeed();

        if (bal==0) balanceInd.innerText="0 Centre";
        if (bal>0) balanceInd.innerText=bal+" Right";
        if (bal<0) balanceInd.innerText=bal+" Left";
        filtersInd.innerText=Object.keys(cfg.filters).length-1+" filters";
        if (crs==-15) crossfeedInd.innerText="x-feed off"; else crossfeedInd.innerText="x-feed : "+crs+"dB"
    },4000);  

    setInterval(async function(){                            
        let rate=await window.DSP.sendDSPMessage("GetCaptureRate");
        let clp = await window.DSP.sendDSPMessage("GetClippedSamples");
        
        samplingRateInd.innerText=  new Intl.NumberFormat('en-US').format(rate);
        uzilizationInd.innerText=Math.round(await window.DSP.sendSpectrumMessage("GetProcessingLoad")*10)/10+"%";
        if (clp>0) { clippingInd.innerText = "CLIPPED"; clippingInd.style.color="red"; } else {clippingInd.innerText = "No clipping"; clippingInd.style.color="#9A9";}
        
    },2000);    
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function saveToLocalStorage(val) {
    window.localStorage.setItem(val.key,val.value);
    
}

async function importFilters(filterText,DSP,title) {
    let filterArray = parseAutoEQText(filterText);
    // console.log(filterText);
    // console.log(filterArray);

    // Convert filterArray to filters object
    let tmpFilters={};
    filterArray.forEach(e => {
        let name = Object.keys(e)[0];
        obj = filterToJSON(e[name]);
        tmpFilters[name] = obj;            
    });
    
    //const DSP = window.DSP;    
    await DSP.clearFilters();
    DSP.addFilters(tmpFilters);
    if (!title==undefined) DSP.config.title=title;    
    await DSP.uploadConfig();    
}

function filterToJSON(filter) {                        
    let tmpObj = new Object();        
    
    if (filter.enabled) gain=0;            
    
    if (filter.type=="Gain") {
         tmpObj={"type":"Gain","parameters":{"gain":filter.gain,"inverted":false,"scale":"dB"}};
     } else {
        tmpObj={"type":"Biquad","parameters":{"type":filter.type,"freq":filter.freq,"gain":filter.gain,"q":filter.q}};       
     }
    //  console.log("json",tmpObj)    
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
            case "LS":
                filterType="Lowshelf";
                break;
            case "HSC":
            case "HS":
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
    return window.mainframe.src.split("/")[3];            
}

async function connect(camillaDSP) {
    const server = document.getElementById('server').value;        
    const port = document.getElementById('port').value;    
    const spectrumPort = document.getElementById('spectrumPort').value;    

    let DSP = new camillaDSP();                

    let state = document.getElementById("state");
    let connected = await DSP.connect(server,port,spectrumPort)    

    if (connected) {
        window.localStorage.setItem("server",server);
        window.localStorage.setItem("port",port);           
        window.localStorage.setItem("spectrumPort",spectrumPort);           
        console.log("Connected.") 
        window.parent.DSP=DSP;
    } else {                            
        state.innerText="Can not connect to DSP. Make sure you got the corrent name or IP address and port, and the websocket server is enabled on external interface.";
        state.style.color="#C66";
        return -1;
    }

    
    let config =  await DSP.sendDSPMessage("GetConfigJson");                     
    if (config.pipeline==null || config.mixers==null || config.filter==null) config = DSP.getDefaultConfig(config,true);
                
    conencted = DSP.uploadConfig(config);            
    if (connected) {
        state.innerText="Connected.";
        state.style.color="#6C6";        
    } else {
        state.innerText="Error uploading configuration.";
        state.style.color="#EC6";
    }            
    
    // state.innerText="Connected.";
    // state.style.color="#6C6";

        
}          

function downloadFile(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }

async function applyPreferences() {    
    //// Find the navigator that default page is pointing and invoke its click event
    let navigators = document.getElementsByClassName("navigate");
    for (let navigator of navigators) {                
        if (navigator.getAttribute("target").replace("/","")==window.activeSettings.defaultPage.toLowerCase()) {            
            navigator.dispatchEvent(new Event("click"));
            break;
        }
    };    

    if (window.activeSettings.DCProtection) {
        const DSP = window.parent.DSP;        
        // console.log("DCP Exists?",DSP.config.filters[Object.keys(DSP.DCProtectionFilter)[0]]!=undefined)
        if (DSP.config.filters[Object.keys(DSP.DCProtectionFilter)[0]]==undefined) {
            DSP.addFilterToAllChannels(DSP.DCProtectionFilter);        
            await DSP.uploadConfig();
        }
    }

    applyColorScheme(document);
}

function applyColorScheme(doc) {
    const hue = window.preferences.getSettingValue('ui','backgroundHue');
    console.log("Hue :",hue)
    window.preferences.applyBackgroundHue(doc,hue); 
    window.preferences.applyBackgroundHue(window.mainframe.contentDocument,hue); 

}

// Import Functions /////////////////////////////////////////////////////////////////////////////////////////////////////
function showImport() {
    const mod = document.getElementById("importWindow");
    mod.showModal();            
}

function importClick() {
    importFilters(document.getElementById('importText').innerText,window.DSP);
    document.getElementById("importWindow").close();
    document.getElementById("mainframe").src='/equalizer';            
}

// Export Functions /////////////////////////////////////////////////////////////////////////////////////////////////////
async function exportConfig() {
    let configText = await DSP.convertConfigToText();
    // console.log(configText);
    if (DSP.config.title.length>0) title = DSP.config.title; else title="";
    downloadFile("CamillaNode PEQ Export - "+title,configText);
    // window.mainframe.contentWindow._configName
}

// AutoEQ Functions /////////////////////////////////////////////////////////////////////////////////////////////////////
function showAutoEQ() {
    const mod = document.getElementById("autoEQDialog");
    const repoList = document.getElementById('autoEQRepo');
    let searchText = document.getElementById('autoEQSearch').addEventListener("keyup",searchAutoEq)
    loadRepoList(repoList);
    loadHeadphoneList();
    mod.showModal();            
    
}

function loadRepoList(repoList) {
    repoList.replaceChildren();
    let o = document.createElement('option');
    o.innerText="[All]";
    repoList.appendChild(o);

    const autoEQ = window.autoEQ;
    autoEQ.loadAutoEQDB();


    for (let source of Object.keys(autoEQ.AutoEQResults)) {        
        let o = document.createElement('option');
        o.innerText=source;
        o.value=source;
        repoList.appendChild(o)
    }
    
    let lastVal = window.localStorage.getItem('lastRepo');
    if (lastVal!=undefined) repoList.value=lastVal;

    repoList.addEventListener('change',function(){
        repoList.value=="[All]"?autoEQ.initAutoEQDB():autoEQ.initAutoEQDB(repoList.value);
        window.localStorage.setItem('lastRepo',repoList.value);
    })
}


async function searchAutoEq() {
    let searchText = document.getElementById('autoEQSearch').value.toLowerCase();        
    let sourceText = document.getElementById("autoEQRepo").value;

    sourceText=='[All]'?sourceText=undefined:sourceText=sourceText;    
    loadHeadphoneList(searchText);    
}



function loadHeadphoneList(filter) {    
    const listObject = document.getElementById('headphoneList');
    const autoEQ = window.autoEQ;
    listObject.replaceChildren();
    
    let headphoneRecords = JSON.parse(window.localStorage.getItem('autoEQDB'));    

    // Filter the array if any search filter is applied
    if (filter!=undefined) headphoneRecords=headphoneRecords.filter(e=>e.deviceName.toLowerCase().match(filter));    

    // console.log(headphoneRecords)    
    let div;    

    if ( headphoneRecords===null) return;

    for (let headphone of headphoneRecords) {
        div = document.createElement('div');
        div.className='config';        
        div.innerText=headphone.deviceName;
        div.setAttribute('url',headphone.url);
        div.setAttribute('repoName',headphone.repoName);
        div.setAttribute('sourceName',headphone.sourceName);

        
        div.addEventListener('dblclick',async function(){
            let url = this.getAttribute('url')
            let fileList = await fetch(url).then((res)=>res.text());
            let list = JSON.parse(fileList).tree;
            let paramEQUrl;
            for (i=0;i<list.length;i++) {
                if (list[i].path.toLowerCase().search('parametriceq')>-1) {
                    paramEQUrl=list[i].url;
                    break;
                }
            }                
            //console.log(JSON.parse(fileList).tree);
            let paramEQ = await fetch(paramEQUrl).then((res)=>res.json());
            let paramEQText = atob(paramEQ.content);                                 
            
            
            await importFilters(paramEQText,window.DSP,this.innerText);                                    
            window.DSP.config.title=this.innerText;
            await window.DSP.uploadConfig();
            window.mainframe.contentWindow.loadFiltersFromConfig.apply();
            window.mainframe.contentWindow.plotConfig.apply();
            this.parentElement.parentElement.parentElement.close()
            
        })
        listObject.appendChild(div)
    }
}


// Configuration functions //////////////////////////////////////////////////////////////////////////////////////////////

function showManageConfigs() {
    const mod = document.getElementById("manageConfigs");
    const configList = document.getElementById("configList")
    const activePage = getActivePage();

    // let configsAray = configsObject.loadConfigsRemote(activePage);                       
    // console.log(configsAray);
    document.getElementById("configName").value='';
    loadConfigs(activePage,configList);
    document.getElementById("configName").addEventListener('keyup',function(e){                
        if (e.key=="Enter") saveConfigurationClick();
        loadConfigs(activePage,configList,this.value);
    })
    mod.showModal();            
}

async function saveConfigurationClick() {
    const activePage = getActivePage();
    const configName = document.getElementById("configName");
    const date = new Date();

    if (configName.value.length<3) {
        console.log("ConfigName ",configName.value)
        alert("Configuration name should be at least 3 characters long.");
        return;
    }

    const frameDocument = window.mainframe.contentWindow.document;            

    let data,DSPConfig;
    switch (activePage) {
        case "connections":                    
            let server = frameDocument.getElementById("server").value;
            let port = frameDocument.getElementById("port").value;
            let spectrumPort=frameDocument.getElementById("spectrumPort").value;
            data={"server":server,"port":port,"spectrumPort":spectrumPort}
            break;
        case "basic":
            DSPConfig = await DSP.sendDSPMessage("GetConfigJson");
            let vol = await DSP.sendDSPMessage("GetVolume");
            let balance = await DSP.getBalance();
            let crossfeed = await DSP.getCrossfeed();
            let filters={}
            filters.subBass= DSPConfig.filters.subBass;
            filters.bass= DSPConfig.filters.bass;
            filters.mids= DSPConfig.filters.mids;
            filters.upperMids= DSPConfig.filters.upperMids;
            filters.treble= DSPConfig.filters.treble;                    
            data={"volume":vol,"balance":balance,"crossfeed":crossfeed,"filters":filters,"mixers":DSPConfig.mixers}                    
            break;
        case "equalizer":
            DSPConfig = await DSP.sendDSPMessage("GetConfigJson");
            data={"title":DSPConfig.title,"filters":DSPConfig.filters,"mixers":DSPConfig.mixers,"pipeline":DSPConfig.pipeline}
            break;
        case "advanced":
            break;
        case "room":
            break;
        case "preferences":
            break;
    }


    let tmpConfig={"type":activePage,"name":configName.value,"createdDate":date,"data":data}
    // console.log(tmpConfig);

    configsObject.saveConfigRemote(tmpConfig).then(async r=>{}).catch(async e=>{                
        if (!confirm("A config with that name already exists. Would you like add another one?")) return;
        await configsObject.saveConfigRemote(tmpConfig,true);
    })                     

    await loadConfigs(activePage,document.getElementById("configList"))
    configName.value="";     
    
    // console.log("Saved : ", saved)
    // if (saved[0]) {
    //     await loadConfigs(activePage,document.getElementById("configList"))
    //     configName.value="";                
    // } else {
        
    // }
}

async function openConfigurationClick() {                     
    const activePage = getActivePage();
    const configName = document.getElementById("configName");
    const configId = configName.getAttribute("configId");
    let config = await configsObject.getConfigByIdRemote(configId);
    let data = config.data;
    // console.log("Open config",activePage,data)

    switch (activePage) {
        case "connections":          
            const frameDocument = window.mainframe.contentWindow.document;
            frameDocument.getElementById("server").value=data.server;
            frameDocument.getElementById("port").value=data.port;
            frameDocument.getElementById("spectrumPort").value=data.spectrumPort;
            break;

        case "basic":                                        
            await DSP.sendDSPMessage({"SetVolume":data.volume})                    
            await DSP.setBalance(data.balance);
            await DSP.setCrossfeed(data.crossfeed);
            DSPConfig = DSP.config;
            DSPConfig.filters.subBass= data.filters.subBass;
            DSPConfig.filters.bass= data.filters.bass;
            DSPConfig.filters.mids= data.filters.midsass;
            DSPConfig.filters.upperMids= data.filters.upperMids;
            DSPConfig.filters.treble= data.filters.treble;                    
            DSPConfig.mixers=data.mixers;
            DSPConfig.pipeline=DSP.updatePipeline(DSPConfig);
            DSPConfig.title="loading from config"
            await DSP.uploadConfig(DSPConfig);                    
            await window.mainframe.contentWindow.loadData.apply();                    
            break;

        case "equalizer":                
            await DSP.downloadConfig();                    
            DSP.config.mixers=data.mixers;
            DSP.clearFilters();            
            DSP.config.title=configName.value;                     
            DSP.addFilters(data.filters);
            await DSP.uploadConfig();                                        
            await window.mainframe.contentWindow.loadFiltersFromConfig.apply();
            window.mainframe.contentWindow.plotConfig.apply();              
            break;

        case "advanced":
            break;
        case "room":
            break;
        case "preferences":
            break;

    }

    // configsObject.saveLastConfig(configName);
    document.getElementById("manageConfigs").close();
}

async function deleteConfigurationClick() {                
    const configName = document.getElementById("configName");
    const configId = configName.getAttribute("configId");
    if (confirm("Are you sure you want to delete configuration?\n\n"+configName.value+"\n")==false) return

    let deleted = await configsObject.deleteRemote(configId);
    if (deleted) {
        const activePage = getActivePage();
        const configList = document.getElementById("configList");
        configName.setAttribute("configId","");
        loadConfigs(activePage,configList);
    } else {
        alert("Error deleting configuration!")
    }
}

async function loadConfigs(activePage,configList,filter) {
    let configsArray = await configsObject.loadConfigsRemote(activePage,true);                        
    // console.log(configsArray);
    configList.innerHTML='';
    //document.getElementById("configName").value='';
    let configItemElement;

    if (filter!=undefined) {
        configsArray = configsArray.filter(function(config){
            // console.log("filter : ",filter)
            return config.name.toLowerCase().includes(filter.toLowerCase());
        })
    }

    configsArray.forEach(e=>{
        configItemElement=document.createElement('div');
        configItemElement.className='config';
        configItemElement.innerText=e.name;
        configItemElement.setAttribute('alt',e.createdDate)
        configItemElement.setAttribute('configId',e.id)
        configItemElement.addEventListener('click',function(e){
            const configName= document.getElementById("configName");
            configName.value=this.innerText;
            configName.setAttribute("configId",this.getAttribute("configId"));
        });

        configItemElement.addEventListener('dblclick',function(e){
            const configName= document.getElementById("configName");
            configName.value=this.innerText;
            configName.setAttribute("configId",this.getAttribute("configId"));
            openConfigurationClick();
        })
        configList.appendChild(configItemElement);
    })
}

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
}
