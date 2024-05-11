

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
    await window.parent.DSP.downloadConfig();
    
    await visualizeConfig(visualContainer,window.parent.DSP)
    loadFilters(advancedFilters,window.parent.DSP.config.filters)
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
    // console.log(mixers);

    for (let mixerNo =0;mixerNo<Object.keys(mixers).length;mixerNo++) {
        const mixerElement = document.createElement("div");
        const mixer = mixers[Object.keys(mixers)[mixerNo]];        

        let mixerNameSpan = document.createElement("span"); mixerNameSpan.innerText="Name :";element.appendChild(mixerNameSpan);
        let mixerName = document.createElement("div"); mixerName.innerText=Object.keys(mixers)[mixerNo]; mixerElement.appendChild(mixerName);
               
        let mixerDescSpan = document.createElement("span"); mixerDescSpan.innerText="Description :";element.appendChild(mixerDescSpan);
        let mixerDesc = document.createElement("div"); mixerDesc.innerText=mixer.description; mixerElement.appendChild(mixerDesc);
               


        
        let inChannels ; 
        let outChannels;
    
        let mapping; // element
        //loop mixers.mapping       

        element.appendChild(mixerElement)        
    }    
}

function loadFilters(element,filters) {
    element.innerHTML='';
    
    const filter = new filterClass();
    for (let filterName of Object.keys(filters)) {
        let filterElement = filter.createElement(filterName);        
        filterElement.children["filterType"].value=filters[filterName].type;
        filterElement.children["filterType"].dispatchEvent(new Event("change"));
        if (filterElement.children["filterSubType"]) {

            filterElement.children["filterSubType"].value=filters[filterName].parameters.type;
            filterElement.children["filterSubType"].dispatchEvent(new Event("change"));

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
        element.appendChild(filterElement);
    }
} 

async function visualizeConfig(element, DSP) {
    
    element.innerHTML='';   
    const channels = await DSP.linearizeConfig();
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
            console.log(component)
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

