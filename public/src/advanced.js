

async function advancedOnLoad() {
    
    const advancedFilters = document.getElementById("advancedFilters");
    const pipelineManagement = document.getElementById("pipelineManagement");
    const channelMapping = document.getElementById("channelMapping");
    const visualContainer = document.getElementById("visualContainer");
    

    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));    

    // loadPipeline(pipelineManagement,window.config.pipeline)
    // loadMixers(channelMapping,window.config.mixers)    
    await visualizeConfig(visualContainer,window.parent.DSP)
    visualContainer.addEventListener("wheel",function(e){
        this.scrollLeft += e.deltaY/2;
        e.preventDefault();
    });

    await window.parent.DSP.downloadConfig();
    loadMixers(channelMapping,window.parent.DSP.config.mixers);


    const channelCount = await window.parent.DSP.getChannelCount();
    loadFilters(advancedFilters,window.parent.DSP.config,channelCount);   

    
}

function loadPipeline(element,pipeline) {
    
    for (let pipe of pipeline) {        
        let pipeElement = document.createElement("div"); pipeElement.className="pipe";
        
        let enabled = document.createElement("input"); enabled.type="checkbox"; enabled.checked=true;
        if (pipe.bypassed) enabled.checked=false;    
        // if (pipe.type=="Mixer") enabled.disabled=true;    
        pipeElement.appendChild(enabled);

        let pipeType= document.createElement("span"); pipeType.innerText=pipe.type;
        pipeElement.appendChild(pipeType);
        
        switch (pipe.type) {
            case "Filter":
                let channelName = document.createElement('span'); channelName.innerText='Channel :';
                pipeElement.appendChild(channelName);
                // Channels should come from a drop down that is driven by the mixer before
                let channel = document.createElement('div'); channel.innerText=pipe.channel;
                pipeElement.appendChild(channel);

                let filterNames = pipe.names.sort();
                // console.log(filterNames);
                break;
        }


        element.appendChild(pipeElement);
    }

}

function loadMixers(element, mixers) {
    //  console.log(mixers);
    
    element.replaceChildren();

    let inCount = Object.values(mixers)[0].channels.in;
    let outCount = Object.values(mixers)[0].channels.out;

    const mixerInOut = document.createElement('div'); 
    mixerInOut.id = 'mixerInOut'; 
    mixerInOut.innerHTML = "<span> Capture Channel Count :</span><span>"+inCount+"</span>"; 
    mixerInOut.innerHTML += "<span> Playback Channel Count :</span><span>"+outCount+"</span>"; 
    // element.appendChild(mixerInOut);

    const channels = window.channels;    
    for (let cNo =0;cNo<channels.length;cNo++) {
        let mixerSources = document.createElement('div'); 
        mixerSources.className="mixer";
        let mixerSourceSpan = document.createElement("span")
        mixerSourceSpan.innerText="Channel "+cNo+" Sources"; mixerSourceSpan.className='mixerTitle';

        mixerSources.appendChild(mixerSourceSpan);

        const sources = channels[cNo].filter(function(e){return e.type=="mixer"})[0].sources;
        console.log(cNo,sources);

        for (let source of sources) {
            let sourceElement = document.createElement("div"); sourceElement.className="mixerSource"
            let channelSpan = document.createElement("span");channelSpan.innerText="Channel "+source.channel; 
            let channelText = document.createElement("div");channelText.contentEditable=true;             
            sourceElement.appendChild(channelSpan); sourceElement.appendChild(channelText);

            let gainSpan = document.createElement("span"); gainSpan.innerText="Gain :";
            let gainText = document.createElement("input"); gainText.type = "text";
            gainText.value = source.gain+source.scale;
            sourceElement.appendChild(gainSpan); sourceElement.appendChild(gainText);

            let invertedSpan = document.createElement("span"); invertedSpan.innerText="Inverted :";
            let invertedCheckbox = document.createElement("input"); invertedCheckbox.type="checkbox"
            invertedCheckbox.checked = source.inverted;
            sourceElement.appendChild(invertedSpan); sourceElement.appendChild(invertedCheckbox);
            
            let mutedSpan = document.createElement("span"); mutedSpan.innerText="Muted :";
            let mutedCheckbox = document.createElement("input"); mutedCheckbox.type="checkbox"
            mutedCheckbox.checked = source.mute;
            sourceElement.appendChild(mutedSpan); sourceElement.appendChild(mutedCheckbox);

            
            mixerSources.appendChild(sourceElement)
        }  
        element.appendChild(mixerSources);              
        // console.log( sources);
    }
    return
    
}

function loadFilters(element,config,channelCount) {
    element.replaceChildren();
    const filters = config.filters;
    const pipeline = config.pipeline;



    for (let channelNo=0;channelNo<channelCount;channelNo++) {
        let filterChannel = document.createElement("div"); 
        filterChannel.className='filterChannel'; 
        filterChannel.setAttribute("label","Channel "+channelNo)
        filterChannel.addEventListener("wheel",function(e){
            this.scrollLeft += e.deltaY/2;            
            e.preventDefault();
        })
        
        let channelPipeline = pipeline.filter(function(p){ return (p.type=="Filter" && p.channel==channelNo) });        
        for (let filterName of channelPipeline[0].names) {            
            let filterElement = createFilter(filterName);
            filterChannel.appendChild(filterElement);
            // console.log(filterElement.children["filterParams"])            
            
        }
        element.appendChild(filterChannel);
        
    }

    function createFilter(filterName) {
        const filter = new filterClass();
        let filterElement = filter.createElement(filterName);  
        
        
        filterElement.filter=filter;
        filterElement.id=filterName;
        filterElement.querySelector("#filterType").value =filters[filterName].type;

        // filterElement.children['filterBasic'].children["filterType"].value=filters[filterName].type;
        filterElement.children['filterBasic'].children["filterType"].dispatchEvent(new Event("change"));
        if (filterElement.children['filterBasic'].children["filterSubType"]) {

            filterElement.children['filterBasic'].children["filterSubType"].value=filters[filterName].parameters.type;
            filterElement.children['filterBasic'].children["filterSubType"].dispatchEvent(new Event("change"));

            let filterSubType = filters[filterName].parameters.type
            if (filterSubType=="Peaking" || filterSubType == "Lowshelf" || filterSubType == "Highshelf") {
                filterElement.children["filterParams"].children["frequency"].value=filters[filterName].parameters.freq;
                filterElement.children["filterParams"].children["gain"].value=filters[filterName].parameters.gain;
                filterElement.children["filterParams"].children["q"].value=filters[filterName].parameters.q;
            }
            if (filterSubType=="Highpass" || filterSubType == "Lowpass" || filterSubType == "Allpass" || filterSubType == "Bandpass") {
                filterElement.children["filterParams"].children["frequency"].value=filters[filterName].parameters.freq;                
                filterElement.children["filterParams"].children["q"].value=filters[filterName].parameters.q;
            }

        }
        
        return filterElement;
    }
} 


async function visualizeConfig(element, DSP) {
    
    element.replaceChildren();
    const channels = await DSP.linearizeConfig();
    window.channels = channels;
    const channelCount = channels.length;
    const nodeWidth = 100;
    const nodeHeight = 110;    
    const channelDistance = 20;
    const margin = 10;
    
    // Resize element based on # of channels 
    element.style.height = channelCount * (nodeHeight + 2 * margin ) + (channelCount - 1) * channelDistance+'px';    
    let position = {"left":margin,"top":margin}  
    
    for (let channelNo=0;channelNo<channelCount;channelNo++) {
        for (let component of channels[channelNo]) {
            // console.log(component)
            let type = component.type;
            let node = addNode(element,position,type);
            
            if (type=="input" || type=="output") {
                node.innerText = type.toUpperCase() +"\n"+ component.device.device+"\n"+ component.device.format;
            }

            if (type=="mixer") {
                node.innerText = type.toUpperCase()+"\n";
                let sources = component["sources"];
                for (let source of sources) {
                    node.innerText=node.innerText+" C:"+source.channel+" G:"+source.gain+ " Muted:"+ source.mute+"\n";
                }
            }

            if (type=="filter") {
                let filterName = Object.keys(component)[1];
                node.innerText =  filterName;                
                if (component[filterName].type=="Biquad") {                    
                    node.innerText = node.innerText + "\n"+component[filterName].type+"\n" + component[filterName].parameters.type+"\n"+ component[filterName].parameters.freq + "Hz"
                    if (component[filterName].parameters.gain!=undefined) node.innerText = node.innerText+ "\n"+component[filterName].parameters.gain+'dB';
                }
                if (component[filterName].type=="Gain") {
                    node.innerText = node.innerText + "\n"+component[filterName].type+"\n" + component[filterName].parameters.gain+"dB";
                }                            

                node.addEventListener('click',function(e){
                    let filterChannels = document.getElementsByClassName("filterChannel");
                    for (let filterChannel of filterChannels) {                        
                        // console.log(filterChannel.children[filterName].getBoundingClientRect().left);
                        if (filterChannel.children[filterName]!=undefined) filterChannel.scrollLeft += filterChannel.children[filterName].getBoundingClientRect().left;                        
                    }

                })
            }
            

            position.left = position.left + nodeWidth + margin * 2;                        
        }
        position.left=margin;
        position.top = position.top + nodeHeight + margin * 2;
    }
    
}

function addNode(parent, position, type) {
    let node = document.createElement('div');
    node.className='visualNode';
    node.style.left = position.left+'px';
    node.style.top = position.top+'px';
    node.classList.add(type+"Node");    
    parent.appendChild(node);
    return node;
}

function addLine(fromNode, toNode) {

}


async function splitFilterToAllChannels() {    
    const DSP = window.parent.DSP;
    let filters = DSP.splitFiltersToChannels(DSP.config.filters);
    DSP.config.filters= filters;
    DSP.config.pipeline = DSP.updatePipeline(DSP.config,true);
    await DSP.uploadConfig()
    advancedOnLoad();
    
}

async function mergeFilters() {
    const DSP = window.parent.DSP;
    let filters = DSP.mergeFilters(DSP.config.filters);
    DSP.config.filters= filters;
    DSP.config.pipeline = DSP.updatePipeline(DSP.config);
    await DSP.uploadConfig()
    advancedOnLoad();
}


// ADCB : 30195 / 1250 EXPENSE  5.5%
// 30084 / 29971 