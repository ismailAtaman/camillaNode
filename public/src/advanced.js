

let selectedNode = undefined;

async function advancedOnLoad() {
    
    const advancedFilters = document.getElementById("advancedFilters");
    const pipelineManagement = document.getElementById("pipelineManagement");
    const channelMapping = document.getElementById("channelMapping");
    const pipelineContainer = document.getElementById("pipelineContainer");
    

    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    // advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));    

    // loadPipeline(pipelineManagement,window.config.pipeline)
    // loadMixers(channelMapping,window.config.mixers)    
    await loadPipeline(pipelineContainer,window.parent.DSP)


    await window.parent.DSP.downloadConfig();
    loadMixers(channelMapping,window.parent.DSP.config.mixers);


    const channelCount = await window.parent.DSP.getChannelCount();
    loadFilters(advancedFilters,window.parent.DSP.config,channelCount);   

    // document.addEventListener('click',function() {
    //     document.getElementById('pipeContextMenu').style.display='none';        
    // })

    
}
async function loadPipeline(element, DSP) {    
    element.replaceChildren();
    const channels = await DSP.linearizeConfig();  
    window.channels = channels;  
    const channelCount = channels.length;
    const nodeWidth = 100;
    const nodeHeight = 110;    
    const channelDistance = 5;
    const margin = 10;
    
    // Resize element based on # of channels 
    // element.style.height = channelCount * (nodeHeight + 2 * margin ) + (channelCount - 1) * channelDistance+'px';    
    
    for (let channelNo=0;channelNo<channelCount;channelNo++) {
        let channelElement = document.createElement("div"); channelElement.className="pipelineChannel"; 
        channelElement.setAttribute("channel",channelNo); channelElement.setAttribute("label","Channel "+channelNo);
        channelElement.addEventListener("wheel",function(e){
            this.scrollLeft += e.deltaY/2;
            e.preventDefault();
        });
        element.appendChild(channelElement);

        for (let component of channels[channelNo]) {
            // console.log(component)
            let type = component.type;
            let node = addNode(channelElement,type);
            
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
                node.setAttribute("id",filterName);
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
                        // console.log("Filter left",filterChannel.children[filterName].getBoundingClientRect().left);
                        if (filterChannel.children[filterName]!=undefined) {
                            let target = filterChannel.children[filterName].getBoundingClientRect().left - 45 + filterChannel.scrollLeft;
                            filterChannel.children[filterName].classList.remove("selected")
                            // console.log(">>Target",target,"Left",filterChannel.scrollLeft);
                            let i = setInterval(()=>{
                                let stepSize = (target - filterChannel.scrollLeft)/4;

                                if (stepSize>50) stepSize = 50;
                                if (stepSize<-50) stepSize = -50;

                                // console.log("Target",target,"Left",filterChannel.scrollLeft,"Step Size",stepSize);
                                
                                if (Math.abs(stepSize)<1) {
                                    filterChannel.scrollLeft=target;
                                    filterChannel.children[filterName].classList.add("selected")
                                    clearInterval(i);
                                    

                                }
                                if (filterChannel.scrollLeft!=target) filterChannel.scrollLeft += stepSize;
                            },20)
                            // filterChannel.scrollLeft += filterChannel.children[filterName].getBoundingClientRect().left - 45;
                        }
                    }
                })


            }                                         
        }        
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
        // console.log(cNo,sources);

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
    const DSP = window.parent.DSP;


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
            let filterElement = loadFilter(filterName,channelNo)
            filterChannel.appendChild(filterElement);
        }
        element.appendChild(filterChannel);        
    }
}

function loadFilter(filterName, channelNo ) {
    let filter = window.parent.DSP.createFilter(filterName,channelNo);
    return createFilterElement(filter);    
}

function createFilterElement(currentFilter) {
    currentFilter.createElement(false);            

    let peqElement = document.getElementById(currentFilter.name);    
    if (peqElement.className!="peqElement") peqElement=undefined;
    if (peqElement==undefined) peqElement = document.createElement('div');     

    peqElement.remove();

    peqElement.filter=currentFilter; peqElement.className="peqElement"; peqElement.setAttribute("configName",currentFilter.name);
    peqElement.setAttribute("id",currentFilter.name);
    peqElement.setAttribute("basic",false);
        
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
    
    // Disable updates with wheel as interferes with scrolling
    if (currentFilter.elementCollection.peqParams.children["frequency"]!=undefined) 
        currentFilter.elementCollection.peqParams.children["frequency"].setAttribute("wheel","disabled")
    if (currentFilter.elementCollection.peqParams.children["gain"]!=undefined) 
        currentFilter.elementCollection.peqParams.children["gain"].setAttribute("wheel","disabled")
    if (currentFilter.elementCollection.peqParams.children["q"]!=undefined) 
        currentFilter.elementCollection.peqParams.children["q"].setAttribute("wheel","disabled")

    peqElement.appendChild(currentFilter.elementCollection.peqParams);       
        
    peqElement.addEventListener("addNewFilter",e=>addNewFilter(e))
    peqElement.addEventListener("removeFilter",e=>removeFilter(e))    
    peqElement.addEventListener("updated",function(e){
        // console.log("Running updated for ",e.target.id);
        let filterName = e.target.getAttribute("configName");
        let channelNo = e.target.parentElement.getAttribute("label").split(" ")[1];
        let peqElement = loadFilter(filterName, channelNo);
        console.log(peqElement.children["peqParams"].children)        
    })   

    // if (window.parent.activeSettings.peqSingleLine) {        
    //     peqElement.style = "display:flex; height: 40px;"
    //     filterBasic.style = 'margin-right: 20px'
    //     window.document.documentElement.style.setProperty("--peq-param-border-radius","0px 7px 7px 0px");
        

    //     peqElement.appendChild(currentFilter.elementCollection.addButton);
    //     peqElement.appendChild(currentFilter.elementCollection.removeButton);
    // } else {
    //     window.document.documentElement.style.setProperty("--peq-param-border-radius","0px 0px 7px 7px");

    //     filterBasic.appendChild(currentFilter.elementCollection.addButton);
    //     filterBasic.appendChild(currentFilter.elementCollection.removeButton);
    // }
    peqElement.disabled=true;
    return peqElement;
}


function addNode(parent, type) {
    let node = document.createElement('div');
    node.className='pipelineElement';    
    node.classList.add(type+"Node");    
    node.setAttribute("nodeType",type)

    
    node.addEventListener('contextmenu',function(e){
        e.preventDefault();
        const contextMenu = document.getElementById("pipeContextMenu");        
        contextMenu.style="left: "+parseInt(e.clientX-5)+"px; top:"+parseInt(e.clientY-5)+"px; display: block;'";
        selectedNode=this;
    })
    parent.appendChild(node);
    return node;
}

function addLine(fromNode, toNode) {

}

async function deleteNode() {    
    let nodeType = selectedNode.getAttribute("nodeType");
    if (nodeType=="output" || nodeType=="input") {
        alert("Input and output nodes can not be deleted.");
        
    } else if (nodeType=="filter") {
        let filterName = selectedNode.id;
        if (confirm("Are you sure you would like like to delete filter '"+filterName+"'?")) {
            window.parent.DSP.removeFilter(filterName);
            await window.parent.DSP.uploadConfig();
            // document.getElementById(filterName).remove();
        };              
        
    }

    document.getElementById("pipeContextMenu").style.display='none';            
    const pipelineContainer = document.getElementById("pipelineContainer");
    loadPipeline(pipelineContainer,window.parent.DSP)
}

async function addNodeManual() {
    let filterName = "Filter_"+new Date().getTime().toString().substring(8);
    


    let channels = document.getElementsByClassName("pipelineChannel");
    for (let channel of channels) {
        
        let node = addNode(channel,"filter");
        node.innerText=filterName;

    }
    
    // window.location.reload();
}    

// ADCB : 30195 / 1250 EXPENSE  5.5%
// 30084 / 29971 