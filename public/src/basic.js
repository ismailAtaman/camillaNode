
/**
 * Initialize and load the basic equalizer interface with controls and tone settings
 * Sets up knobs, loads DSP configuration, attaches event listeners, and enables interactive plot markers
 * @returns {Promise<void>} Promise that resolves when initialization is complete
 */
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
    
    // Enable interactive marker dragging and selection
    setupPlotInteraction();
    
    // Enable knob selection highlighting
    setupKnobSelection();

    const spec = document.getElementById("spectrum");

    if(window.parent.activeSettings.showBasicSpectrum) {        
        spec.style.display="grid";
        initSpectrum();    
    } else {
        spec.style.display="none";
    }
}

/**
 * Update canvas width to match control container and redraw the plot
 * Ensures canvas visual width aligns properly by accounting for CSS padding
 * @returns {void}
 */
function updateElementWidth() {
    const basicControls = document.getElementById("basicControls");
    const canvas = document.getElementById("plotCanvas");           
    const ctx = document.getElementById('plotCanvas');    
    DSP = window.parent.DSP;            
    
    // Compute canvas horizontal padding from CSS to ensure visual width alignment
    const canvasStyle = getComputedStyle(canvas);
    const paddingX = parseFloat(canvasStyle.paddingLeft) + parseFloat(canvasStyle.paddingRight);
    
    canvas.width = basicControls.getBoundingClientRect().width - paddingX;
    plotConfig();
}

/**
 * Load volume, balance, crossfeed, and tone control data from DSP config
 * Initializes tone filters if they don't exist and updates UI knobs to reflect current values
 * @returns {Promise<void>} Promise that resolves when data loading and plotting is complete
 */
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

/**
 * Plot the EQ frequency response curve with tone control markers on the canvas
 * Handles both single and dual-channel modes with appropriate marker filtering for basic tone controls
 * @returns {void}
 */
function plotConfig() {
    const canvas = document.getElementById("plotCanvas");
    const context = canvas.getContext('2d');             
	context.clearRect(0, 0, canvas.width, canvas.height);        	
    
    // Define which filters are tone controls (should have markers)
    const BASIC_TONE_FILTERS = new Set([
        '__subBass', '__bass', '__mids', '__upperMids', '__treble'
    ]);
    
    // Filter functions to scope markers to tone controls only
    const markerFilter = (filterName, filterDef) => BASIC_TONE_FILTERS.has(filterName);
    const interactiveFilter = (filterName, filterDef) => BASIC_TONE_FILTERS.has(filterName);
    
    // Get current selection state
    const selectedFilterBases = window.__eqSelectedBase ? new Set([window.__eqSelectedBase]) : null;
    
    if (window.parent.activeSettings.peqDualChannel) {
        let colors = ["#B55","#55B","#5B5","#F33","#33F","#3F3"]
        let channelCount = DSP.getChannelCount();
        for (let channelNo=0;channelNo<channelCount;channelNo++) {
            let channelFilters = {};
            filterList=DSP.getChannelFiltersList(channelNo)                
            for (let filter of filterList) {     
                channelFilters[filter]=DSP.config.filters[filter];
            }
            // Only show markers for first channel to avoid duplication
            plot(channelFilters, canvas, DSP.config.title, colors[channelNo], channelNo, {
                markerFilter: channelNo === 0 ? markerFilter : () => false,
                interactiveFilter: channelNo === 0 ? interactiveFilter : () => false,
                appendMarkers: channelNo > 0,
                drawGrid: channelNo === 0,
                selectedFilterBases: selectedFilterBases
            });
        }

    } else {
        let hue = (Math.abs((parseInt(window.parent.activeSettings.backgroundHue) + 10 )) % 360) /360;        
        let color = hslToRgb(hue, 0.3, 0.3);
        let colorNum = (color[0]+color[1]*255+color[2]*255*255);
        plot(DSP.config.filters, canvas, DSP.config.title, colorNum, undefined, {
            markerFilter: markerFilter,
            interactiveFilter: interactiveFilter,
            selectedFilterBases: selectedFilterBases
        });            
    }    
}

/**
 * Update tone control filter gains from knob values and upload to DSP
 * Skips execution during drag operations to avoid conflicts with interactive marker updates
 * @returns {Promise<void>} Promise that resolves when tone values are updated and uploaded
 */
async function setTone() {
    // Guard against running during drag to avoid conflicts
    if (window.__eqplotDragInProgress) {
        return;
    }
    
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


/**
 * Initialize and render the audio spectrum analyzer display with animated level bars
 * Creates DOM elements for frequency bands and starts a 100ms polling interval to fetch and visualize spectrum data
 * @returns {Promise<void>} Promise that resolves when spectrum UI is initialized and update loop is started
 */
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

/**
 * Set up knob selection highlighting
 * Listens for knob interactions and marker selections to maintain bidirectional highlighting
 * @returns {void}
 */
function setupKnobSelection() {
    const toneControls = document.getElementById('toneControls');
    
    // Map knob labels to filter names
    const labelToFilter = {
        'Sub-bass': '__subBass',
        'Bass': '__bass',
        'Mids': '__mids',
        'Upper Mids': '__upperMids',
        'Treble': '__treble'
    };
    
    // Helper to clear all knob selections
    function clearKnobSelections() {
        const knobs = toneControls.querySelectorAll('.knob');
        knobs.forEach(k => k.classList.remove('is-selected'));
    }
    
    // Helper to select a knob by filter name
    function selectKnobByFilter(filterName) {
        clearKnobSelections();
        const knobs = toneControls.querySelectorAll('.knob');
        knobs.forEach(knob => {
            const label = knob.getAttribute('label');
            if (labelToFilter[label] === filterName) {
                knob.classList.add('is-selected');
            }
        });
    }
    
    // Listen for knob pointerdown (user clicking a knob)
    toneControls.addEventListener('pointerdown', (evt) => {
        const knob = evt.target.closest('.knob');
        if (!knob) return;
        
        const label = knob.getAttribute('label');
        const filterName = labelToFilter[label];
        if (filterName) {
            window.__eqSelectedBase = filterName;
            selectKnobByFilter(filterName);
            plotConfig();
        }
    });
    
    // Listen for marker selections from the plot
    const canvas = document.getElementById('plotCanvas');
    canvas.addEventListener('eqplot:marker-select', (evt) => {
        const { filterName } = evt.detail;
        window.__eqSelectedBase = filterName;
        selectKnobByFilter(filterName);
        // Plot will already be updated by drag-start handler
    });
}

/**
 * Set up interactive marker dragging on the EQ plot canvas
 * Imports eqplot module, enables interaction, and wires up event handlers for marker drag with throttled plot updates and debounced DSP uploads
 * @returns {void}
 */
function setupPlotInteraction() {
    const canvas = document.getElementById("plotCanvas");
    
    // Import and enable the interaction controller
    import('/src/eqplot.js').then(module => {
        const { enableEqPlotInteraction } = module;
        enableEqPlotInteraction(canvas);
    });
    
    let uploadTimer = null;
    let plotTimer = null;
    
    // Mapping of filter names to knob instances
    const filterToKnob = {
        '__subBass': window.subBass,
        '__bass': window.bass,
        '__mids': window.mids,
        '__upperMids': window.upperMids,
        '__treble': window.treble
    };
    
    /**
     * Schedule a throttled plot update using requestAnimationFrame
     * Prevents redundant redraws by ensuring only one pending update at a time
     * @returns {void}
     */
    function scheduleThrottledPlot() {
        if (plotTimer) return;
        plotTimer = requestAnimationFrame(() => {
            plotConfig();
            plotTimer = null;
        });
    }
    
    /**
     * Schedule a debounced DSP config upload with 100ms delay
     * Prevents excessive uploads during continuous parameter changes by resetting the timer on each call
     * @returns {void}
     */
    function scheduleDSPUpload() {
        clearTimeout(uploadTimer);
        uploadTimer = setTimeout(() => {
            DSP.uploadConfig();
        }, 100);
    }
    
    // Handle marker drag events
    canvas.addEventListener('eqplot:marker-drag-start', (evt) => {
        // console.log('Drag start:', evt.detail);
    });
    
    canvas.addEventListener('eqplot:marker-drag', (evt) => {
        const { filterName, params } = evt.detail;
        
        if (!DSP.config.filters[filterName]) {
            console.warn(`Filter ${filterName} not found in config`);
            return;
        }
        
        // Update DSP config parameters
        if (params.freq !== undefined) {
            DSP.config.filters[filterName].parameters.freq = params.freq;
        }
        if (params.gain !== undefined) {
            DSP.config.filters[filterName].parameters.gain = params.gain;
            
            // Update corresponding knob (gain only, as knobs don't show freq/Q)
            const knob = filterToKnob[filterName];
            if (knob) {
                // Set knob value without triggering change event
                // The drag flag prevents the knob's change handler from running
                const knobValue = params.gain * 10 + 181;
                knob.setVal(knobValue);
            }
        }
        if (params.q !== undefined) {
            DSP.config.filters[filterName].parameters.q = params.q;
        }
        
        // Throttled plot update for visual feedback
        scheduleThrottledPlot();
        
        // Debounced DSP upload
        scheduleDSPUpload();
    });
    
    canvas.addEventListener('eqplot:marker-drag-end', async (evt) => {
        // console.log('Drag end:', evt.detail);
        
        // Force immediate upload on drag end
        clearTimeout(uploadTimer);
        await DSP.uploadConfig();
        
        // Final plot update
        plotConfig();
    });
}

const { abs, min, max, round } = Math;

/**
 * Convert HSL color values to RGB array
 * Handles both chromatic and achromatic color conversions for use in canvas plotting
 * @param {number} h - Hue value (0-1 normalized)
 * @param {number} s - Saturation value (0-1)
 * @param {number} l - Lightness value (0-1)
 * @returns {Array<number>} Array of [r, g, b] values (0-255)
 */
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
  
  /**
   * Helper function to convert hue to RGB component value
   * Implements the HSL-to-RGB conversion algorithm for a single color component
   * @param {number} p - Calculated p value from HSL conversion
   * @param {number} q - Calculated q value from HSL conversion
   * @param {number} t - Adjusted hue value for the specific color component
   * @returns {number} RGB component value (0-1)
   */
  function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1.0/6.0) return p + (q - p) * 6 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6;
    return p;
  }
