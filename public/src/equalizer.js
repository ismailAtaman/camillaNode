
document.loading=false;        
        
// Run equalizerOnLoad function after DSP is connected.
let interval;
interval = setInterval(function(){            
    // console.log(window.parent.DSP);
    if (window.parent.DSP!=undefined) {                
        equalizerOnLoad();
        clearInterval(interval);
    }
},50);


async function equalizerOnLoad() {            
    document.loading=true;
    const PEQ = document.getElementById('PEQ');            
    
    DSP=window.parent.DSP;        
    
    
    /// Basics Controls Section
    const basicControls = document.getElementById('basicControls');

    // Create UI elements
    let vol = new EQKnob("Volume",31);        
    let balance = new EQKnob("Balance",181);
    let crossfeed = new EQKnob("Crossfeed",31);
    let preamp = new EQKnob("Pre-amp",181);

    crossfeed.knob.instance.offAtDefault=true;
    balance.knob.instance.offAtDefault=true;
    preamp.knob.instance.offAtDefault=true;
    
    basicControls.appendChild(vol.knob);        
    basicControls.appendChild(balance.knob)
    basicControls.appendChild(crossfeed.knob)
    basicControls.appendChild(preamp.knob)

    window.vol=vol;
    window.balance=balance;
    window.crossfeed=crossfeed;
    window.preamp=preamp;

    // Load data from DSP
    DSP.sendDSPMessage("GetVolume").then(r=>{            
        let volMarker = r/3*10 + 181;
        vol.setVal(volMarker);            
    });

    // load crossfeed
    let crossfeedVal = await DSP.getCrossfeed() * 20 +331;        
    crossfeed.knob.instance.setVal(crossfeedVal);
    
    // load balance
    let bal = await DSP.getBalance() * 10 +181;
    balance.knob.instance.setVal(bal)

    vol.knob.addEventListener("change",function(e){
        const volume = (this.instance.getVal() -181)/10*3; // 3db change per every tick            
        DSP.sendDSPMessage({"SetVolume":volume})
    })

    balance.knob.addEventListener("change",function(e){
        const bal = (this.instance.getVal() -181)/10*1; // 1db change per every tick            
        DSP.setBalance(bal);
    })

    crossfeed.knob.addEventListener("change",function(e){
        let crossfeedVal = (this.instance.getVal()-331)/20;
        // console.log(crossfeedVal)
        DSP.setCrossfeed(crossfeedVal);
    })

    preamp.knob.addEventListener("change",function(e){
        const preampGain = (this.instance.getVal() -181)/10*1; // 1db change per every tick       
        // console.log(preampGain);
        setPreamp(preampGain);                 
    })

    updateElementWidth();

    window.addEventListener("resize",updateElementWidth);        

    /// Parametric EQ section
    await loadFiltersFromConfig();    

    // Plot the config
    plotConfig();              

    // change loading to false after 50ms to avoud update running multiple times during loading.            
    setInterval(function(){document.loading=false},50);            

    const spec = document.getElementById("spectrum");   

    if(window.parent.activeSettings.showEqualizerSpectrum) {        
        spec.style.display="grid";
        initSpectrum();    
    } else {
        spec.style.display="none";
    }
}

function updateElementWidth() {
    const spec = document.getElementById("spectrum");   
    const barCount=spec.childNodes.length-1;
    const barWidth= (spec.getBoundingClientRect().width - (barCount*6)) / barCount;
    document.documentElement.style.setProperty("--levelbar-width",barWidth+"px") 
    
    const canvas = document.getElementById("plotCanvas");           
    canvas.width = spec.getBoundingClientRect().width;
    plotConfig();
}


async function loadFiltersFromConfig() {                        
    PEQ.innerHTML='';        
    await DSP.downloadConfig();    

    if (window.parent.activeSettings.peqDualChannel) {        
        console.log("Single channel :",DSP.isSingleChannel());
        if (DSP.isSingleChannel()) await splitChannels();                

        window.document.documentElement.style.setProperty("--peq-columns","1fr 1fr");
        window.document.documentElement.style.setProperty("--peq-before-grid-column","1 / span 2;");    
        window.document.documentElement.style.setProperty("--peq-channel-before-display","block");
    }
        
    for (let channelNo=0;channelNo<2;channelNo++) {

        let peqChannel = document.createElement('div');
        peqChannel.className="peqChannel"; peqChannel.id="peqChannel"+channelNo;
        peqChannel.setAttribute("channelNo",channelNo); peqChannel.setAttribute("label","Channel "+channelNo);

        let filterList;
        if (window.parent.activeSettings.peqDualChannel) filterList=DSP.getChannelFiltersList(channelNo); else filterList=Object.keys(DSP.filters);

        // console.log("filter list ",filterList);

        for (let filter of filterList) {
            let currentFilter = DSP.filters[filter];
            if (currentFilter.type=="Gain") {
                let gain =Math.round(currentFilter.parameters.gain);
                setPreamp(gain);                 
                preamp.setVal(gain * 10 + 181);
            }

            if (currentFilter.type!="Biquad" || currentFilter.name.startsWith("__")) continue;
            let peqElement = createFilterElement(currentFilter);
            peqChannel.appendChild(peqElement);
        }

        PEQ.appendChild(peqChannel);
        if (channelNo>=0 && !window.parent.activeSettings.peqDualChannel) break;
    }

    sortAll();
    document.loading=false;
}

function createFilterElement(currentFilter) {
    currentFilter.createElement(true);            

    let peqElement = document.createElement('div');
    peqElement.filter=currentFilter; peqElement.className="peqElement"; peqElement.setAttribute("configName",currentFilter.name);
        
    let filterBasic = document.createElement('div'); 
    filterBasic.id = "filterBasic"; filterBasic.className='filterBasic';

    // let nameSpan = document.createElement('span'); nameSpan.innerText='Name :'
    // filterBasic.appendChild(nameSpan);
    // filterBasic.appendChild(currentFilter.elementCollection.filterName);    
    
    let typeSpan = document.createElement('span'); typeSpan.innerText='Filter Type :'
    filterBasic.appendChild(typeSpan);
    filterBasic.appendChild(currentFilter.elementCollection.filterType);                

    let subTypeSpan = document.createElement('span'); subTypeSpan.innerText='Filter Sub Type :'
    filterBasic.appendChild(subTypeSpan);
    filterBasic.appendChild(currentFilter.elementCollection.filterSubType);       

    let peqParams = document.createElement('div');             
    peqParams.id = "peqParams"; peqParams.className='peqParams';          
    
    peqElement.appendChild(filterBasic);
    peqElement.appendChild(currentFilter.elementCollection.peqParams);
    

    peqElement.addEventListener("updated",plotConfig)
    peqElement.addEventListener("addNewFilter",e=>addNewFilter(e))
    peqElement.addEventListener("removeFilter",e=>removeFilter(e))    

    if (window.parent.activeSettings.peqSingleLine) {        
        peqElement.style = "display:flex; height: 40px;"
        filterBasic.style = 'margin-right: 20px'
        window.document.documentElement.style.setProperty("--peq-param-border-radius","0px 7px 7px 0px");
        

        peqElement.appendChild(currentFilter.elementCollection.addButton);
        peqElement.appendChild(currentFilter.elementCollection.removeButton);
    } else {
        window.document.documentElement.style.setProperty("--peq-param-border-radius","0px 0px 7px 7px");

        filterBasic.appendChild(currentFilter.elementCollection.addButton);
        filterBasic.appendChild(currentFilter.elementCollection.removeButton);
    }
    return peqElement;
}

async function splitChannels() {
    DSP.config.filters= DSP.splitFiltersToChannels(DSP.config.filters);                 

    // Update pipeline
    let pipeline=[];
    for (let mixer in DSP.config.mixers) {
        pipeline.push({"type":"Mixer","name":mixer});
    }

    pipeline.push({"type":"Filter","channel":0,"names":Object.keys(DSP.config.filters).filter(e=>e.includes("__c0"))})
    pipeline.push({"type":"Filter","channel":1,"names":Object.keys(DSP.config.filters).filter(e=>e.includes("__c1"))})

    DSP.config.pipeline=pipeline;

    await DSP.uploadConfig();
}


function plotConfig() {
    const canvas = document.getElementById("plotCanvas");            
    plot(DSP.config.filters,canvas,DSP.config.title);            
}

async function setPreamp(gain) {
    await DSP.downloadConfig();
    if (DSP.config.filters.Gain == undefined) {
        DSP.config.filters.Gain = {"type":"Gain","parameters":{"gain":0,"inverted":false,"scale":"dB"}}
    }  
    DSP.config.filters.Gain.parameters.gain= Math.round(gain);                
    DSP.config.pipeline=DSP.updatePipeline(DSP.config);
    await DSP.uploadConfig(DSP.config);
}

function addLine(parent,filterName,insertBefore) {
    let line = PEQline.addPEQLine(parent,insertBefore);            
    line.setAttribute("filterName",filterName);            
    line.addEventListener("update",peqlineUpdate);            
    line.addEventListener("remove",function(){peqlineRemove(this)});     
    line.addEventListener("add",function(){peqlineAdd(this)});  
    return line;   
}

function sortAll() {
    const PEQs=document.getElementsByClassName("PEQ");                        
    for (let PEQ of PEQs) {
        sortByFreq(PEQ);
    }
}

function sortByFreq(parent) {    

    let elementArray=[];
    parent.childNodes.forEach(element => {                
        element.childNodes.forEach(peqElement=> {
            if (peqElement.className=="peqElement") {                    
                elementArray.push(peqElement);                                                    
            }                
        })
        element.innerHTML='';
    });

    // console.log(elementArray);

    function compareLines(a,b) {    
        return parseInt(a.filter.parameters.freq) - parseInt(b.filter.parameters.freq);                
    }

    elementArray=elementArray.sort(compareLines);            
    for (let element of elementArray) {                        
        parent.childNodes.forEach(channel=>{
            channel.appendChild(element);
        })  
    }            
}

function generateFiltersObject() {
    let filters={};
    const PEQ = document.getElementById('PEQ');
    PEQ.childNodes.forEach(e=>{
        if (e.className=="peqline") {                                   
            filters[e.getAttribute("filterName")] = e.instance.valuesToJSON();
        }
    })
    // If there is a preamp setting, create the preamp filter
    preampGain=(preamp.knob.instance.getVal()-181)/10;
    if (preampGain!=0) {
        filters.Gain = {"type":"Gain","parameters":{"gain":preampGain,"inverted":false,"scale":"dB"}}
    }
    return filters;
}
async function clearPEQ() {        
    setPreamp(0);
    await DSP.clearFilters(true);        
    DSP.config.title=" ";
    await DSP.uploadConfig();
    document.getElementById('PEQ').innerHTML='';
    plotConfig();
    // peqlineUpdate();
 
}

const  freq = ['25', '30', '40', '50', '63', '80', '100', '125', '160', '200', '250',
'315', '400', '500', '630', '800', '1K', '1.2K', '1.6K', '2K', '2.5K',
'3.1K', '4K', '5K', '6.3K', '8K', '10K', '12K', '16K', '20K']

async function initSpectrum(){          
    // Create bars and boxes
    const spec = document.getElementById("spectrum");   
    const barCount=freq.length-1;
    const barWidth= ((spec.getBoundingClientRect().width - (barCount*6)) / barCount);
    document.documentElement.style.setProperty("--levelbar-width",barWidth+"px");
    

    let bar,box;
    spec.innerHTML='';
    for (i=0;i<=barCount;i++){
        bar = document.createElement("div");
        bar.className='levelbar';        
        bar.setAttribute('freq',freq[i]);        
        
        let hue=parseInt(window.document.documentElement.style.getPropertyValue('--bck-hue'));
        for (j=1;j<40;j++) {
            box = document.createElement('div');
            box.className='levelbox';                    
            box.style="background-color: hsl("+hue+", 30%, 50%);"        
            hue=hue-10;
            bar.appendChild(box);
        }

        spec.appendChild(bar);
    }

    // Get the data and update the analyser
    
    setInterval(async function(){
        const spec = document.getElementById("spectrum");
        let r = await DSP.getSpectrumData();                
        
        let i=0, height, boxCount, count;
        spec.childNodes.forEach(e=>{
            if (e.tagName=="DIV") {                         
                height = 200 + (2*Math.round(r[i]));  
                if (height<0) height=0;
                if (height>200) height=0;     
                boxCount= Math.round(height/8)-1;                                
                count=0;
                e.childNodes.forEach(e=>{
                    if (e.tagName=="DIV") {
                        if (count>boxCount) e.style.opacity=0; else e.style.opacity=1;
                        count++
                    }
                })
                i=i+2;
            }                     
        })       
                

    },100)
}

async function addNewFilter(e) {    
    // Create a filter object based on default filter 
    let filter = DSP.getDefaultFilter();
    let freq = 3146;
    let currentElementFreq = 3146;
    let peqChannel= undefined;
    let channel = 0;

    if (e==undefined) {        
        currentElementFreq=0;
        peqChannel= document.getElementById("peqChannel0")
    }  else {
        peqChannel= e.target.parentElement;
        channel = parseInt(peqChannel.getAttribute("channelno"));


        currentElementFreq = e.target.filter.parameters.freq;        
        if (e.target.nextSibling!=null) {
            freq = Math.round((currentElementFreq+e.target.nextSibling.filter.parameters.freq)/2);
        } else {
            freq = Math.round((currentElementFreq+20000)/2);
        }
    }

    // Set frequency to average of where filter is being insterted
    filter[Object.keys(filter)[0]].parameters.freq=freq;    
    
    // Create new DSP filter and upload
    let newFilter = DSP.createNewFilter(filter,channel);
    await DSP.uploadConfig();

    // Create and load the filter element to the channel element    
    let peqElement = createFilterElement(newFilter);

    // If first filter or last, just append it, if not insert after current element 
    if (e==undefined) {
        peqChannel.appendChild(peqElement);
    } else {
        if (e.target.nextSibling!=null) {
            peqChannel.insertBefore(peqElement,e.target.nextSibling);
        } else {
            peqChannel.appendChild(peqElement);
        }
    }  
    
}

async function removeFilter(e) {
    let peqChannel= e.target.parentElement;
    let channel = parseInt(peqChannel.getAttribute("channelno"));
    let filterName = e.target.getAttribute("configname");

    console.log("Removed "+filterName);

    // Remove from current channel. if Dual Channel EQ is off remove from other channel as well
    DSP.removeFilterFromChannelPipeline(filterName,channel);
    if (window.parent.activeSettings.peqDualChannel==false) DSP.removeFilterFromChannelPipeline(filterName,1-parseInt(channel));    

    await DSP.uploadConfig();

    peqChannel.removeChild(e.target);
    plotConfig();
}

function resetPEQ() {
    console.log("Reset needs to be re-implemented")
    // const PEQ = document.getElementById('PEQ');
    // for (let peqLine of PEQ.childNodes) {
    //     peqLine.instance.reset();
        
    // }
}

async function convertConfigs() {
    fetch("/getConfigList").then((res)=>res.text().then(async cData=>{
        const configList = JSON.parse(cData);

        for (let configName of configList) {
            let data = await fetch("/getConfig?configName="+configName).then((res)=>res.text());
            let configObject = JSON.parse(data);                
            await saveConfigObjectAsConfig(configName,configObject);            
        }        
    }))

    async function saveConfigObjectAsConfig(configName,configObject) {
        return new Promise(async (resolve,reject)=>{
            let filters={};

            if (configObject.filterArray==undefined) { resolve(false);  return }

            let Volume = configObject.filterArray.find(e=>Object.keys(e)[0]=="Volume");
            let Preamp = configObject.filterArray.find(e=>Object.keys(e)[0]=="Preamp");
    
            if (Volume!=undefined) {
                volumeIndex = configObject.filterArray.indexOf(Volume);
                configObject.filterArray.splice(volumeIndex,1);
            }
    
            if (Preamp!=undefined) {
                preampIndex = configObject.filterArray.indexOf(Preamp);                            
                filters["Gain"]={"type":"Gain","parameters":{"gain":Object.values(Preamp)[0].gain,"inverted":false,"scale":"dB"}};
                configObject.filterArray.splice(preampIndex,1);
            }               
            
            for (let filter of configObject.filterArray) {
                filters[Object.keys(filter)[0]]={"type":"Biquad","parameters":filter[Object.keys(filter)[0]]};
            }
    
            console.log("Converted filters : ",filters);
            await DSP.downloadConfig();
            await DSP.clearFilters();
            DSP.addFilters(filters);                
            const date = new Date();
    
            const configData={"title":DSP.config.title,"filters":DSP.config.filters,"mixers":DSP.config.mixers,"pipeline":DSP.config.pipeline}
            const tmpConfig={"type":"equalizer","name":configName,"createdDate":date,"data":configData}
    
            await window.savedConfigs.saveConfigRemote(tmpConfig,true);
            resolve(true);                
            
        })
        
    }

}
