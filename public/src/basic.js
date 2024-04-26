
async function basicOnLoad() {       
    
    const basicControls = document.getElementById('basicControls');
    const canvas = document.getElementById('plotCanvas');                

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

    // Load filters
    let config = await DSP.sendDSPMessage("GetConfigJson");            
    
    if (config.filters["subBass"]==undefined) {
        console.log("Basic load filters",config.filters);
        if (config.filter!={}) {
            
        }
        // let r = await DSP.setTone(0,0,0,0,0);
        // console.log(r)
        // let config = await DSP.sendDSPMessage("GetConfigJson");             
    }            
    
    subBass.knob.instance.setVal(config.filters["subBass"].parameters.gain*10+181);
    bass.knob.instance.setVal(config.filters["bass"].parameters.gain*10+181);
    mids.knob.instance.setVal(config.filters["mids"].parameters.gain*10+181);
    upperMids.knob.instance.setVal(config.filters["upperMids"].parameters.gain*10+181);
    treble.knob.instance.setVal(config.filters["treble"].parameters.gain*10+181);
    
    PEQLine.plot(config.filters,canvas);

}

function setTone() {
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
    // DSP.setTone(subBassVal,bassVal,midsVal,upperMidsVal,trebleVal);   
}
