

async function basicLoad() {       
    
    const basicControls = document.getElementById('basicControls');
    const ctx = document.getElementById('plotCanvas');    

    DSP = window.parent.DSP;            

    // Load default frequencies for tone controls
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
        DSP.sendSpectrumMessage({"SetVolume":volume})
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
    

    // Load v from DSP
    DSP.sendDSPMessage("GetVolume").then(r=>{            
        let volMarker = r/3*10 + 181;
        vol.setVal(volMarker);            
    });

    await DSP.downloadConfig();

    // Load crossfeed
    let crossfeedVal = DSP.getCrossfeed() * 20 + 331;        
    crossfeed.knob.instance.setVal(crossfeedVal);

    // Load balance
    let bal = DSP.getBalance() * 10 +181;
    balance.knob.instance.setVal(bal)

    // Load filters if they don't exist
    if (DSP.config.filters["__subBass"]==undefined) {        
        DSP.setTone(0,0,0,0,0);                
        await DSP.uploadConfig();
        console.log("Basic filters created at default values.")
    } else {
        // If gain is zero, change the freq setting to the latest freq set in preferences
        if (DSP.config.filters["__subBass"].parameters.gain==0) DSP.config.filters["__subBass"].parameters.freq=parseInt(window.parent.activeSettings.subBassFreq)
        if (DSP.config.filters["__bass"].parameters.gain==0)    DSP.config.filters["__bass"].parameters.freq=parseInt(window.parent.activeSettings.bassFreq)
        if (DSP.config.filters["__mids"].parameters.gain==0)    DSP.config.filters["__mids"].parameters.freq=parseInt(window.parent.activeSettings.midsFreq)
        if (DSP.config.filters["__upperMids"].parameters.gain==0) DSP.config.filters["__upperMids"].parameters.freq=parseInt(window.parent.activeSettings.upperMidsFreq)
        if (DSP.config.filters["__treble"].parameters.gain==0)  DSP.config.filters["__treble"].parameters.freq=parseInt(window.parent.activeSettings.trebleFreq)
    }
    
    // console.log("Subbass:",DSP.config.filters["__subBass"].parameters.gain);

    subBass.knob.instance.setVal(DSP.config.filters["__subBass"].parameters.gain*10+181);
    bass.knob.instance.setVal(DSP.config.filters["__bass"].parameters.gain*10+181);
    mids.knob.instance.setVal(DSP.config.filters["__mids"].parameters.gain*10+181);
    upperMids.knob.instance.setVal(DSP.config.filters["__upperMids"].parameters.gain*10+181);
    treble.knob.instance.setVal(DSP.config.filters["__treble"].parameters.gain*10+181);
    
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
        let hue = (Math.abs((parseInt(window.parent.activeSettings.backgroundHue) + 10 )) % 360) /360;        
        let color = hslToRgb(hue, 0.3, 0.3);
        let colorNum = (color[0]+color[1]*255+color[2]*255*255);
        plot(DSP.config.filters,canvas,DSP.config.title,colorNum);            
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
    let config = DSP.setTone(subBassVal,bassVal,midsVal,upperMidsVal,trebleVal); 
    await DSP.uploadConfig();
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

const { abs, min, max, round } = Math;

function hslToRgb(h, s, l) {
    let r, g, b;
  
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hueToRgb(p, q, h + 1.0/3.0);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1.0/3.0);
    }
  
    return [round(r * 255), round(g * 255), round(b * 255)];
  }
  
  function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1.0/6.0) return p + (q - p) * 6 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6;
    return p;
  }