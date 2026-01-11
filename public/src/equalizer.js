
document.loading=false;        
        
// Run equalizerOnLoad function after DSP is connected.
let interval;
interval = setInterval(function(){            
    // console.log(window.parent.DSP);
    if (window.parent.DSP!=undefined) {                
        equalizerOnLoad();
        clearInterval(interval);
    }
},100);


/**
 * Initialize and load the parametric equalizer interface with all controls
 * Sets up knobs, loads filters from DSP config, creates filter UI elements, and enables interactive plot markers
 * @returns {Promise<void>} Promise that resolves when initialization is complete
 */
async function equalizerOnLoad() {            
    document.loading=true;
    const PEQ = document.getElementById('PEQ');                
    DSP=window.parent.DSP;            


    // Open a floating spectrum window on spectrum double click
    document.getElementById("spectrum").addEventListener("dblclick",()=>{        
        // console.log("W :",window.screen.availWidth)
        let w = Math.round(window.screen.availWidth/3.5);
        let h = 300; //Math.round(w/4);
        let params = "location=no,status=no,menubar=no,scrollbars=no,width="+w+",height="+h;
        let win = window.open("/spectrum","spectrumWindow",params);        
        win.DSP=window.parent.DSP;        
    })
    
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

    preamp.knob.addEventListener("change",async function(e){
        const preampGain = (this.instance.getVal() -181)/10*1; // 1db change per every tick       
        // console.log(preampGain);
        setPreamp(preampGain);        
        await DSP.uploadConfig();
    })

    updateElementWidth();

    window.addEventListener("resize",updateElementWidth);        

    /// Parametric EQ section    
    await loadFiltersFromConfig();   

    // Plot the config
    plotConfig();              
    
    // Enable interactive marker dragging and selection
    setupPlotInteraction();
    
    // Enable PEQ element selection highlighting
    setupPEQSelection();

    // change loading to false after 50ms to avoud update running multiple times during loading.            
    setInterval(function(){document.loading=false},50);            

    const spec = document.getElementById("spectrum");

    if(window.parent.activeSettings.showEqualizerSpectrum && window.parent.activeSettings.enableSpectrum) {        
        spec.style.display="grid";
        initSpectrum();    
    } else {
        spec.style.display="none";
    }

    
}

/**
 * Update canvas width and spectrum bar widths to match window dimensions
 * Ensures proper visual alignment by recalculating widths and accounting for CSS padding
 * @returns {void}
 */
function updateElementWidth() {
    const spec = document.getElementById("spectrum");
    const barCount=spec.childNodes.length-1;
    const barWidth= (spec.getBoundingClientRect().width - (barCount*6)) / barCount;
    document.documentElement.style.setProperty("--levelbar-width",barWidth+"px") 
    
    const canvas = document.getElementById("plotCanvas");
    
    // Compute canvas horizontal padding from CSS to ensure visual width alignment
    const canvasStyle = getComputedStyle(canvas);
    const paddingX = parseFloat(canvasStyle.paddingLeft) + parseFloat(canvasStyle.paddingRight);
    
    canvas.width = spec.getBoundingClientRect().width - paddingX;
    plotConfig();
}


/**
 * Load all biquad filters from DSP config and create UI elements for each
 * Handles single/dual channel modes by splitting or merging filters as needed and creates filter elements sorted by frequency
 * @returns {Promise<void>} Promise that resolves when filters are loaded and UI is built
 */
async function loadFiltersFromConfig() {                        
    PEQ.innerHTML='';
    
    await DSP.downloadConfig();

    let multiChannel = window.parent.activeSettings.peqDualChannel
    // console.log("Multi channel? ",multiChannel)
    
    if (multiChannel) {
        let singleChannel = DSP.isSingleChannel();        
        if (singleChannel) DSP.splitFiltersToChannels();

        window.document.documentElement.style.setProperty("--peq-columns","1fr 1fr");
        window.document.documentElement.style.setProperty("--peq-before-grid-column","1 / span 2;");    
        window.document.documentElement.style.setProperty("--peq-channel-before-display","block");
    } else {        
        let singleChannel = DSP.isSingleChannel();   
        // console.log("DSP config single channel?",singleChannel);     
        if (!singleChannel) DSP.mergeFilters();                       
    }        

    await DSP.uploadConfig();
    await DSP.downloadConfig();

    let channelCount = DSP.getChannelCount();    
    for (let channelNo=0;channelNo<channelCount;channelNo++) {
        let peqChannel = document.createElement('div');
        peqChannel.className="peqChannel"; peqChannel.id="peqChannel"+channelNo;
        peqChannel.setAttribute("channelNo",channelNo); peqChannel.setAttribute("label","Channel "+channelNo);   
        // peqChannel.addEventListener("dblclick",addNewFilter())     
        PEQ.appendChild(peqChannel);

        let filterList;        
        filterList=DSP.getChannelFiltersList(channelNo)
        // console.log("Filter list of channel No",channelNo," : " , filterList)        
        
        for (let filterName of filterList) {        
            let currentFilter = new window.filter(DSP);            
            currentFilter.loadFromDSP(filterName);

            // Don't show filters that are not Biquads or system generated in the EQ window
            if (currentFilter.getType()!="Biquad" || currentFilter.getName().startsWith("__")) continue;   

            if (currentFilter.getType()=="Gain") {
                let gain =Math.round(currentFilter.getParameters().gain);                           
                preamp.setVal(gain * 10 + 181);
            }
            
            currentFilter.createElementCollection(true);
            let peqElement = createFilterElement(currentFilter);
            peqChannel.appendChild(peqElement);            
        }        
        
        if (!window.parent.activeSettings.peqDualChannel) break;
    }

    sortAll();        
    document.loading=false;    
    await DSP.uploadConfig();
}

/**
 * Create a UI element for a given filter with controls for type, subtype, parameters, and add/remove buttons
 * Configures layout based on single-line or multi-line mode settings
 * @param {Object} currentFilter - The filter object for which to create the UI element
 * @returns {HTMLElement} The constructed filter UI element
 */
function createFilterElement(currentFilter) {
    // currentFilter.createElement(true);            

    let peqElement = document.createElement('div');
    peqElement.filter=currentFilter; peqElement.className="peqElement"; 
    peqElement.setAttribute("configName",currentFilter.getName());
    peqElement.setAttribute("id",currentFilter.getName());
    peqElement.setAttribute("basic",true);
        
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

    //let peqParams = document.createElement('div');             
    //peqParams.id = "peqParams"; peqParams.className='peqParams';          
    
    peqElement.appendChild(filterBasic);
    peqElement.appendChild(currentFilter.elementCollection.peqParams);
    
    
    peqElement.addEventListener("updated",plotConfig);
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

/** Plot the current DSP configuration on the canvas
 * Supports single and dual channel modes with distinct colors for each channel
 * Filters system filters and only displays parametric EQ (PEQ) filters
 * @returns {void}
 */
function plotConfig() {
    const canvas = document.getElementById("plotCanvas");        
    const context = canvas.getContext('2d');             
	context.clearRect(0, 0, canvas.width, canvas.height);        	
    
    // Filter function: only show markers for PEQ filters (exclude system filters starting with __)
    const isPEQFilter = (filterName, filterDef) => {
        return filterDef?.type === 'Biquad' && !filterName.startsWith('__');
    };
    
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
            // Accumulate markers across channels for multi-channel mode
            plot(channelFilters, canvas, DSP.config.title, colors[channelNo], channelNo, {
                markerFilter: isPEQFilter,
                interactiveFilter: isPEQFilter,
                appendMarkers: channelNo > 0,
                drawGrid: channelNo === 0,
                selectedFilterBases: selectedFilterBases
            });
        }

    } else {
        let hue = (Math.abs((parseInt(window.parent.activeSettings.backgroundHue) + 10 )) % 360) /360;
        // console.log("Start hue : ",window.parent.activeSettings.backgroundHue,hue*360,hue)
        let color = hslToRgb(hue, 0.3, 0.3);
        let colorNum = (color[0]+color[1]*255+color[2]*255*255);
        plot(DSP.config.filters, canvas, DSP.config.title, colorNum, undefined, {
            markerFilter: isPEQFilter,
            interactiveFilter: isPEQFilter,
            selectedFilterBases: selectedFilterBases
        });            
    }    
}

/** Set the preamp gain in the DSP configuration
 * Adds a Gain filter if not already present and updates its gain parameter
 * @param {number} gain - The desired preamp gain in dB
 * @returns {void}
 */
function setPreamp(gain) {    
    if (DSP.config.filters.Gain == undefined) {        
        let gainFilter = {}
        gainFilter["Gain"]={"type":"Gain","parameters":{"gain":0,"inverted":false,"scale":"dB"}};
        DSP.addFilterToAllChannels(gainFilter);
    }  
    DSP.config.filters.Gain.parameters.gain= Math.round(gain);                    
}

/** Sort all PEQ channel elements by filter frequency
 * @returns {void}
 */
function sortAll() {
    const PEQs=document.getElementsByClassName("peqChannel");                        
    for (let PEQ of PEQs) {
        sortByFreq(PEQ);
    }
}

/** Sort child PEQ elements of a parent container by their filter frequency
 * @param {HTMLElement} parent - The parent container whose child PEQ elements will be sorted
 * @returns {void}
 */
function sortByFreq(parent) {    
    let elementArray=[];
    parent.childNodes.forEach(element => {                        
            if (element.className=="peqElement") {                    
                elementArray.push(element);                                                    
            }                
        })
    parent.innerHTML='';    


    function compareLines(a,b) {    
        
        return parseInt(a.filter.getParameters().freq) - parseInt(b.filter.getParameters().freq);                
    }

    elementArray=elementArray.sort(compareLines);            
    for (let element of elementArray) {                                
        parent.appendChild(element);        
    }            
}

/** Clear all PEQ filters from DSP configuration and UI
 * Resets preamp gain to 0 dB and updates the plot
 * @returns {Promise<void>} Promise that resolves when clearing is complete
 */
async function clearPEQ() {        
    setPreamp(0);
    DSP.clearFilters();       
    await DSP.uploadConfig();    
    let channels = document.getElementsByClassName("peqChannel")
    for (let channel of channels) channel.innerHTML="";

    plotConfig(); 
}

/** Add a new filter to the specified channel at the appropriate frequency
 * Inserts the new filter UI element in sorted order and uploads to DSP
 * @param {Event} e - The event triggering the addition, contains context for insertion point
 * @returns {Promise<void>} Promise that resolves when the filter is added
 */
async function addNewFilter(e) {    
    // Create a filter object based on default filter 
    let newFilter = new window.filter(DSP);    
    let freq = 1000;
    let currentElementFreq = 1000;
    let peqChannel= undefined;
    let channel = 0;

    if (e==undefined) {        
        currentElementFreq=0;
        peqChannel= document.getElementById("peqChannel0")
    }  else {
        peqChannel= e.target.parentElement;
        channel = parseInt(peqChannel.getAttribute("channelno"));

        currentElementFreq = e.target.filter.getFilterParameter("freq");        
        if (e.target.nextSibling!=null) {
            freq = Math.round((currentElementFreq+e.target.nextSibling.filter.getFilterParameter("freq"))/2);
        } else {
            freq = Math.round((currentElementFreq+20000)/2);
        }
    }

    // Set frequency to average of where filter is being insterted
    newFilter.setFilterParameter("freq",freq);    
    
    // Create new DSP filter and upload
    // let newFilter = DSP.createNewFilter(filter,channel);    
    if (!window.parent.activeSettings.peqDualChannel) newFilter.loadToDSP(); else newFilter.loadToDSP(channel) // DSP.addFilterToAllChannels(filter);
    await newFilter.uploadToDSP();
    

    // Create and load the filter element to the channel element    
    newFilter.createElementCollection(true);
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

/** Remove a filter from DSP configuration and UI
 * Also removes from the other channel if dual channel mode is off
 * @param {Event} e - The event triggering the removal, contains context for which filter to remove
 * @returns {Promise<void>} Promise that resolves when the filter is removed
 */
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
}

/** Frequencies for spectrum analyzer bars
 * @type {string[]}
 */
const  freq = ['25', '30', '40', '50', '63', '80', '100', '125', '160', '200', '250',
'315', '400', '500', '630', '800', '1K', '1.2K', '1.6K', '2K', '2.5K',
'3.1K', '4K', '5K', '6.3K', '8K', '10K', '12K', '16K', '20K']

/** Initialize the spectrum analyzer display with bars and boxes
 * Sets up the visual elements and starts periodic updates to reflect audio spectrum data
 * @param {Window} [parentWindow=window] - The parent window context for accessing settings and DOM
 * @returns {Promise<void>} Promise that resolves when initialization is complete
 */
async function initSpectrum(parentWindow){         
    
    if (!window.parent.activeSettings.enableSpectrum) return;
    // Create bars and boxes
    if (parentWindow==undefined) parentWindow=window;    

    const spec = parentWindow.document.getElementById("spectrum");   
    const barCount=freq.length-1;
    const barWidth= ((spec.getBoundingClientRect().width - (barCount*6)) / barCount);
    parentWindow.document.documentElement.style.setProperty("--levelbar-width",barWidth+"px");
    
    let barHeight = spec.getBoundingClientRect().height;
    let boxHeight = 6+3;
    const boxCount =Math.round(barHeight/boxHeight);     

    // console.log("Count ",boxCount,"Spec ",spec.getBoundingClientRect().height);

    let bar,box;
    spec.innerHTML='';
    for (i=0;i<=barCount;i++){
        bar = document.createElement("div");
        bar.className='levelbar';        
        bar.setAttribute('freq',freq[i]);        
        
        let hue=parseInt(window.document.documentElement.style.getPropertyValue('--bck-hue'));
        for (j=1;j<boxCount;j++) {
            box = document.createElement('div');
            box.className='levelbox';                    
            hue=hue-(240/boxCount);
            box.style="background-color: hsl("+hue+", 30%, 50%);"                    
            bar.appendChild(box);
        }

        spec.appendChild(bar);
    }

    // Get the data and update the analyser
    

    const maxVal = 0;
    const minVal = -90;
    const scaler = 1;
    const levelPerBox = Math.round(10 * (maxVal-minVal)/boxCount * scaler)/10;

    // console.log("Level per box ",levelPerBox);
    // Get the data and update the analyser
    
    setInterval(async function(){
        const spec = document.getElementById("spectrum");                
        let r = await DSP.getSpectrumData();                                    
        if (r.length==0) return;                

        let i=0, height, pos, count, level;
        spec.childNodes.forEach(e=>{
            if (e.tagName=="DIV") {  
                level = -Math.round(r[i]);
                let pos = boxCount - (level/levelPerBox);                        
                count=0;
                e.childNodes.forEach(e=>{
                    if (e.tagName=="DIV") {
                        if (count>=pos) e.style.opacity=0; else e.style.opacity=1;
                        count++;
                    }
                })
                i=i+2;
            }                     
        }) 
    },100)

}

/** Converts camillaNode v1 configurations to v2 configurations
 * Fetches existing v1 configs, transforms them to v2 format, and saves them remotely
 * @returns {Promise<void>} Promise that resolves when all configurations have been converted
 */
async function convertConfigs() {
    // Converts camillaNode v1 configurations to v2 configurations

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

/**
 * Set up PEQ element selection highlighting
 * Listens for PEQ element focus and marker selections to maintain bidirectional highlighting
 * Handles dual-channel mode by highlighting all matching filter bases
 * @returns {void}
 */
function setupPEQSelection() {
    const PEQ = document.getElementById('PEQ');
    
    // Helper to clear all PEQ selections
    function clearPEQSelections() {
        const peqElements = PEQ.querySelectorAll('.peqElement');
        peqElements.forEach(el => el.classList.remove('is-selected'));
    }
    
    // Helper to select PEQ element(s) by filter base name
    function selectPEQByFilterBase(filterBase) {
        clearPEQSelections();
        const peqElements = PEQ.querySelectorAll('.peqElement');
        peqElements.forEach(el => {
            const configName = el.getAttribute('configName');
            if (!configName) return;
            
            // Strip channel suffix for comparison
            const elBase = configName.replace(/__c\d+$/, '');
            if (elBase === filterBase) {
                el.classList.add('is-selected');
            }
        });
    }
    
    // Listen for focus on any input/select within PEQ
    PEQ.addEventListener('focusin', (evt) => {
        const peqElement = evt.target.closest('.peqElement');
        if (!peqElement) return;
        
        const configName = peqElement.getAttribute('configName');
        if (configName) {
            // Compute filter base (strip channel suffix)
            const filterBase = configName.replace(/__c\d+$/, '');
            window.__eqSelectedBase = filterBase;
            selectPEQByFilterBase(filterBase);
            plotConfig();
        }
    });
    
    // Listen for pointerdown on PEQ elements (clicking anywhere on the card)
    PEQ.addEventListener('pointerdown', (evt) => {
        const peqElement = evt.target.closest('.peqElement');
        if (!peqElement) return;
        
        const configName = peqElement.getAttribute('configName');
        if (configName) {
            const filterBase = configName.replace(/__c\d+$/, '');
            window.__eqSelectedBase = filterBase;
            selectPEQByFilterBase(filterBase);
            plotConfig();
        }
    });
    
    // Listen for marker selections from the plot
    const canvas = document.getElementById('plotCanvas');
    canvas.addEventListener('eqplot:marker-select', (evt) => {
        const { filterName } = evt.detail;
        const filterBase = filterName.replace(/__c\d+$/, '');
        window.__eqSelectedBase = filterBase;
        selectPEQByFilterBase(filterBase);
        // Plot will already be updated by drag-start handler
    });
}

/** Setup interactive plot marker dragging to adjust filter parameters
 * Updates DSP configuration and UI input fields in real-time during marker drags
 * Implements throttled plot updates and debounced DSP uploads for performance
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
    
    // Throttled plot update using requestAnimationFrame
    function scheduleThrottledPlot() {
        if (plotTimer) return;
        plotTimer = requestAnimationFrame(() => {
            plotConfig();
            plotTimer = null;
        });
    }
    
    // Debounced DSP upload
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
        }
        if (params.q !== undefined) {
            DSP.config.filters[filterName].parameters.q = params.q;
        }
        
        // Update DOM input fields (without triggering change events)
        const filterElement = document.getElementById(filterName);
        if (filterElement && filterElement.filter) {
            const peqParams = filterElement.filter.elementCollection.peqParams;
            if (peqParams) {
                if (params.freq !== undefined && peqParams.children['Frequency']) {
                    peqParams.children['Frequency'].value = params.freq;
                }
                if (params.gain !== undefined && peqParams.children['Gain']) {
                    peqParams.children['Gain'].value = params.gain;
                }
                if (params.q !== undefined && peqParams.children['Q']) {
                    peqParams.children['Q'].value = params.q;
                }
            }
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

/** Convert HSL color values to RGB
 * @param {number} h - Hue component (0 to 1)
 * @param {number} s - Saturation component (0 to 1)
 * @param {number} l - Lightness component (0 to 1)
 * @returns {number[]} Array containing RGB components [r, g, b] (0 to 255)
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
  
    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];
  }
  
  /** Helper function for HSL to RGB conversion
   * @param {number} p - Temporary value
   * @param {number} q - Temporary value
   * @param {number} t - Temporary value
   * @returns {number} RGB component value (0 to 1)
   */
  function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1.0/6.0) return p + (q - p) * 6 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6;
    return p;
  }
