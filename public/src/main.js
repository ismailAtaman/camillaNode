
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

    loadPreferences(); 
    
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

    let version = document.getElementById('version')
    DSP.sendDSPMessage("GetVersion").then(r=>version.innerText="CamillaDSP Version "+r);

    let status = document.getElementById('status')            
    DSP.sendDSPMessage("GetState").then(r=>status.innerText=r);    


    setInterval(async ()=>{
        let status = document.getElementById('status')            
        DSP.sendDSPMessage("GetState").then(r=>status.innerText=r);                        
    },5000);
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

async function importFilters(filterText,DSP) {
    let filterArray = parseAutoEQText(filterText);
    // console.log(filterArray);

    // Convert filterArray to filters object
    let tmpFilters={};
    filterArray.forEach(e => {
        let name = Object.keys(e)[0];
        obj = filterToJSON(e[name]);
        tmpFilters[name] = obj;            
    });
    
    
    await DSP.clearFilters();
    console.log("Import after clear",DSP.config.filters);
    Object.assign(DSP.config.filters,tmpFilters);
    DSP.config.pipeline=DSP.updatePipeline(DSP.config);
    DSP.uploadConfig();
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
    if (config.pipeline==null || config.mixers==null || config.filter==null) config = camillaDSP.getDefaultConfig(config,true);
                
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

async function loadPreferences() {
    // Load preferences
    window.parent.activeSettings = window.preferences.getPreferences();

    // Apply preferences
    //// Find the navigator that default page is pointing and invote its click event
    let navigators = document.getElementsByClassName("navigate");
    for (let navigator of navigators) {        
        console.log(window.activeSettings.defaultPage)
        if (navigator.getAttribute("target").replace("/","")==window.activeSettings.defaultPage.toLowerCase()) {
            console.log("navigating..")
            navigator.dispatchEvent(new Event("click"));
            break;
        }
    };
    
    


    if (window.activeSettings.DCProtection) {
        const DSP = window.parent.DSP;
        await DSP.downloadConfig();        
        Object.assign(DSP.config.filters,DSP.DCProtectionFilter);
        DSP.config.pipeline = DSP.updatePipeline(DSP.config);
        DSP.uploadConfig();
    }
}

function applyColorScheme(doc) {
    const hue = window.preferences.getSettingValue('ui','backgroundHue');
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
    const mod = document.getElementById("modalWindow");
    mod.showModal();            
}

// Configuration functions //////////////////////////////////////////////////////////////////////////////////////////////

function showManageConfigs() {
    const mod = document.getElementById("manageConfigs");
    const configList = document.getElementById("configList")
    const activePage = getActivePage();

    // let configsAray = configsObject.loadConfigsRemote(activePage);                       
    // console.log(configsAray);
    loadConfigs(activePage,configList);
    document.getElementById("configName").addEventListener('keyup',function(e){                
        if (e.key=="Enter") saveConfigurationClick();
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
            // console.log(DSP.config);                    
            DSP.config.title=configName.value;                     
            DSP.addFilters(data.filters);
            await DSP.uploadConfig(DSP.config);                                        
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

async function loadConfigs(activePage,configList) {
    let configsArray = await configsObject.loadConfigsRemote(activePage,true);                        
    // console.log(configsArray);
    configList.innerHTML='';
    document.getElementById("configName").value='';
    let configItemElement;
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

