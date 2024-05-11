

async function basicLoad() {       
    
    const basicControls = document.getElementById('basicControls');
    const ctx = document.getElementById('plotCanvas');    
    DSP = window.parent.DSP;            
    DSP.subBassFreq= parseInt(window.parent.activeSettings.subBassFreq)
    DSP.bassFreq= parseInt(window.parent.activeSettings.bassFreq)
    DSP.midsFreq= parseInt(window.parent.activeSettings.midsFreq)
    DSP.upperMidsFreq= parseInt(window.parent.activeSettings.upperMidsFreq)
    DSP.trebleFreq= parseInt(window.parent.activeSettings.trebleFreq)

    console.log(DSP.bassFreq,window.parent.activeSettings.bassFreq);

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
    })

    crossfeed.knob.addEventListener("change",function(e){
        let crossfeedVal = (this.instance.getVal()-331)/20;
        // console.log(crossfeedVal)
        DSP.setCrossfeed(crossfeedVal);
    })

    subBass.knob.addEventListener("change",setTone);
    bass.knob.addEventListener("change",setTone);
    mids.knob.addEventListener("change",setTone);
    upperMids.knob.addEventListener("change",setTone);
    treble.knob.addEventListener("change",setTone);

    updateElementWidth();

    window.addEventListener("resize",updateElementWidth);
}

function updateElementWidth() {
    const basicControls = document.getElementById("basicControls");       
    const canvas = document.getElementById("plotCanvas");           
    const ctx = document.getElementById('plotCanvas');    
    DSP = window.parent.DSP;            
    
    canvas.width = basicControls.getBoundingClientRect().width;
    plot(DSP.config.filters,ctx,DSP.config.title);
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
    if (DSP.config.filters==undefined) DSP.config.filters={};
    
    if (DSP.config.filters["subBass"]==undefined) {        
        await DSP.setTone(0,0,0,0,0);        
        await DSP.downloadConfig();
    }            
    
    subBass.knob.instance.setVal(DSP.config.filters["subBass"].parameters.gain*10+181);
    bass.knob.instance.setVal(DSP.config.filters["bass"].parameters.gain*10+181);
    mids.knob.instance.setVal(DSP.config.filters["mids"].parameters.gain*10+181);
    upperMids.knob.instance.setVal(DSP.config.filters["upperMids"].parameters.gain*10+181);
    treble.knob.instance.setVal(DSP.config.filters["treble"].parameters.gain*10+181);
    
    plot(DSP.config.filters,ctx,DSP.config.title);
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
    plot(config.filters,canvas,config.title);  
}
