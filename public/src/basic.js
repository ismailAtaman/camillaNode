

async function basicLoad() {       
    
    const basicControls = document.getElementById('basicControls');
    const ctx = document.getElementById('plotCanvas');    
    DSP = window.parent.DSP;            
    DSP.subBassFreq= parseInt(window.parent.activeSettings.subBassFreq)
    DSP.bassFreq= parseInt(window.parent.activeSettings.bassFreq)
    DSP.midsFreq= parseInt(window.parent.activeSettings.midsFreq)
    DSP.upperMidsFreq= parseInt(window.parent.activeSettings.upperMidsFreq)
    DSP.trebleFreq= parseInt(window.parent.activeSettings.trebleFreq)
    

    // Create UI elements
    let vol = new EQKnob("Volume",31);        
    let balance = new EQKnob("Balance",181);
    let crossfeed = new EQKnob("Crossfeed",31); 

    crossfeed.knob.instance.offAtDefault=true;
    balance.knob.instance.offAtDefault=true;
    
    basicControls.appendChild(vol.knob);        
    basicControls.appendChild(balance.knob)
    basicControls.appendChild(crossfeed.knob)

    let subBass = new EQKnob("Sub-bass",181);
    let bass = new EQKnob("Bass",181);
    let mids = new EQKnob("Mids",181);
    let upperMids = new EQKnob("Upper Mids",181);
    let treble = new EQKnob("Treble",181);

    subBass.knob.instance.offAtDefault=true;
    bass.knob.instance.offAtDefault=true;
    mids.knob.instance.offAtDefault=true;
    upperMids.knob.instance.offAtDefault=true;
    treble.knob.instance.offAtDefault=true;

    const toneControls = document.getElementById('toneControls');
    toneControls.appendChild(subBass.knob);
    toneControls.appendChild(bass.knob);
    toneControls.appendChild(mids.knob);
    toneControls.appendChild(upperMids.knob);
    toneControls.appendChild(treble.knob);

    window.vol=vol;
    window.balance=balance;
    window.crossfeed=crossfeed;
    window.subBass=subBass;
    window.bass=bass;
    window.mids=mids;
    window.upperMids=upperMids;
    window.treble=treble;

    loadData();        

    // Event Listeners
    vol.knob.addEventListener("change",function(e){
        const volume = (this.instance.getVal() -181)/10*3; // 3db change per every tick            
        DSP.sendDSPMessage({"SetVolume":volume})
    })

    balance.knob.addEventListener("change",function(e){
        const bal = (this.instance.getVal() -181)/10*1; // 1db change per every tick            
        DSP.setBalance(bal);
        DSP.uploadConfig();        
    })

    crossfeed.knob.addEventListener("change",function(e){
        let crossfeedVal = (this.instance.getVal()-331)/20;
        // console.log(crossfeedVal)
        DSP.setCrossfeed(crossfeedVal);
        DSP.uploadConfig();
    })

    subBass.knob.addEventListener("change",setTone);
    bass.knob.addEventListener("change",setTone);
    mids.knob.addEventListener("change",setTone);
    upperMids.knob.addEventListener("change",setTone);
    treble.knob.addEventListener("change",setTone);

    updateElementWidth();

    window.addEventListener("resize",updateElementWidth);

    const spec = document.getElementById("spectrum");   

    if(window.parent.activeSettings.showBasicSpectrum) {        
        spec.style.display="grid";
        initSpectrum();    
    } else {
        spec.style.display="none";
    }
}

function updateElementWidth() {
    const basicControls = document.getElementById("basicControls");       
    const canvas = document.getElementById("plotCanvas");           
    const ctx = document.getElementById('plotCanvas');    
    DSP = window.parent.DSP;            
    
    canvas.width = basicControls.getBoundingClientRect().width;
    plotConfig();
}

async function loadData() {
    const ctx = document.getElementById('plotCanvas');    
    DSP = window.parent.DSP;            

    // Load data from DSP
    DSP.sendDSPMessage("GetVolume").then(r=>{            
        let volMarker = r/3*10 + 181;
        vol.setVal(volMarker);            
    });

    // load crossfeed
    let crossfeedVal = await DSP.getCrossfeed() * 20 + 331;        
    crossfeed.knob.instance.setVal(crossfeedVal);

    // load balance
    let bal = await DSP.getBalance() * 10 +181;
    balance.knob.instance.setVal(bal)

    // Load filters
    await DSP.downloadConfig()
    // if (DSP.config.filters==undefined) DSP.config.filters={};
    
    if (DSP.config.filters["subBass"]==undefined) {        
        await DSP.setTone(0,0,0,0,0);        
        await DSP.downloadConfig();
        // console.log("Basic filters created at default values.")
    }            
    
    subBass.knob.instance.setVal(DSP.config.filters["subBass"].parameters.gain*10+181);
    bass.knob.instance.setVal(DSP.config.filters["bass"].parameters.gain*10+181);
    mids.knob.instance.setVal(DSP.config.filters["mids"].parameters.gain*10+181);
    upperMids.knob.instance.setVal(DSP.config.filters["upperMids"].parameters.gain*10+181);
    treble.knob.instance.setVal(DSP.config.filters["treble"].parameters.gain*10+181);
    
    plotConfig();
}

function plotConfig() {
    const canvas = document.getElementById("plotCanvas");        
    const context = canvas.getContext('2d');             
	context.clearRect(0, 0, canvas.width, canvas.height);        	
    
    if (window.parent.activeSettings.peqDualChannel) {
        let colors = ["#B55","#55B","#5B5","#F33","#33F","#3F3"]
        let channelCount = DSP.getChannelCount();
        for (let channelNo=0;channelNo<channelCount;channelNo++) {
            let channelFilters = {};
            filterList=DSP.getChannelFiltersList(channelNo)                
            for (let filter of filterList) {     
                channelFilters[filter]=DSP.config.filters[filter];
            }
            plot(channelFilters,canvas,DSP.config.title,colors[channelNo]);
        }

    } else {
        plot(DSP.config.filters,canvas,DSP.config.title);            
    }    
}

async function setTone() {
    const knobs = document.getElementsByClassName('knob');
    let subBassVal, bassVal, midsVal,upperMidsVal,trebleVal;            

    for (let knob of knobs) {
        if (knob.getAttribute("label")=="Sub-bass") subBassVal= knob.instance.getVal();
        if (knob.getAttribute("label")=="Bass") bassVal= knob.instance.getVal();
        if (knob.getAttribute("label")=="Mids") midsVal= knob.instance.getVal();
        if (knob.getAttribute("label")=="Upper Mids") upperMidsVal= knob.instance.getVal();
        if (knob.getAttribute("label")=="Treble") trebleVal= knob.instance.getVal();
    }

    subBassVal = (parseInt(subBassVal)-181)/10
    bassVal = (parseInt(bassVal)-181)/10
    midsVal = (parseInt(midsVal)-181)/10
    upperMidsVal = (parseInt(upperMidsVal)-181)/10
    trebleVal = (parseInt(trebleVal)-181)/10
    
    // console.log(subBassVal,bassVal,midsVal,upperMidsVal,trebleVal);
    let config = await DSP.setTone(subBassVal,bassVal,midsVal,upperMidsVal,trebleVal); 
    const canvas = document.getElementById('plotCanvas');        
    plotConfig();
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
        
        let hue=parseInt(window.parent.document.documentElement.style.getPropertyValue('--bck-hue'));
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
