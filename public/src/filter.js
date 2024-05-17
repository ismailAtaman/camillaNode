const Types = {
    Gain : "Gain",
    Volume: "Volume",
    Loudness: "Loudness",
    Delay:"Delay",
    Conv:"Conv",
    Biquad:"Biquad",
    Dither:"Dither",
    Limiter:"Limiter"
}


class filter {
    name;
    description;
    type;    
    parameters={}    
    channel;
    DSP;
    filterElement;
    elementCollection={};
    

    constructor(name,filter) {                
        this.name=name;
        this.description=filter.description;        
        this.type=filter.type;
        this.parameters=filter.parameters;         
        this.createElement()
    }

    createElement(basic) {
        if (basic==undefined) basic=false;

        const filterName = document.createElement('input');        
        filterName.className="filterName"; filterName.value=this.name; filterName.id="filterName";
        filterName.addEventListener("change",this.updateEventHandler);
        this.elementCollection.filterName=filterName;        

        const filterDesc = document.createElement('input');
        filterDesc.className="filterDesc"; filterDesc.value=this.description; 
        filterDesc.addEventListener("change",this.updateEventHandler);
        this.elementCollection.filterDesc=filterDesc;        

        const filterType = document.createElement('select');
        filterType.className="filterType"; filterType.setAttribute("id","filterType");       
        for (let type of Object.keys(Types)) {
            if (basic && (type!="Biquad")) continue;
            let opt = document.createElement("option");
            opt.setAttribute("value",type); opt.innerText=type;
            filterType.appendChild(opt);
        }

        filterType.value=this.type;
        filterType.addEventListener("change",this.updateEventHandler);

        this.updateSubTypes(basic);
        this.updateParams();        

        this.elementCollection.filterType=filterType;
    }

    updateSubTypes(basic) {
        if (basic==undefined) basic=false;

        let basicTypes = ["Highshelf","Lowshelf","Peaking"]

        const filterSubType = document.createElement("select");
        filterSubType.className="filterType"; filterSubType.setAttribute("id","filterSubType");
        for (let subType of this.getFilterSubTypes(this.type)) {                        
            if (basic && !basicTypes.includes(subType)) continue;
            let opt = document.createElement("option");
            opt.setAttribute("value",subType); opt.innerText=subType;
            filterSubType.appendChild(opt);
        }
        filterSubType.addEventListener("change",this.updateEventHandler);
        if (this.parameters.type!=undefined) filterSubType.value=this.parameters.type;
        // console.log("Filter Sub Type :",filterSubType)
        this.elementCollection.filterSubType=filterSubType;        
    }

    updateParams() {

        const peqParams=document.createElement('div');
        peqParams.setAttribute("id","peqParams"); peqParams.className="peqParams";
        let elem;
        
        for (let param of filter.filterParamsTemplate(this.type,this.parameters.type)) { 
            let title=document.createElement("span"); title.innerText=Object.keys(param)[0]+" :";
            peqParams.appendChild(title);
            switch (Object.values(param)[0]) {
                case "num":
                    elem = document.createElement("input"); elem.setAttribute("type","text");elem.value=0; elem.id=Object.keys(param)[0].toLowerCase();
                    elem.addEventListener("wheel",function(e){
                        let dir = e.deltaY> 0 ? 1:-1;
                        let val = parseFloat(this.value) * 0.1;
                        if (val<1) val=1;
                        val = Math.round(val);                        
                        this.value = parseFloat(this.value) + dir * val;
                        e.preventDefault();
                        this.dispatchEvent(new Event("change"));
                    })
                    elem.addEventListener("dblclick",e=>{e.target.value=0;e.target.dispatchEvent(new Event("change"));});
                    break;
                case "bool":
                    elem = document.createElement("input"); elem.setAttribute("type","checkbox");elem.id=Object.keys(param)[0].toLowerCase();
                    break;
                case "text":
                    elem = document.createElement("input"); elem.setAttribute("type","text");elem.value="";elem.id=Object.keys(param)[0].toLowerCase();
                    break;
                case "array":
                    elem = document.createElement("input"); elem.setAttribute("type","text");elem.value=0;elem.id=Object.keys(param)[0].toLowerCase();
                    break;
                default:
                    elem = document.createElement("select"); 
                    elem.id = Object.keys(param)[0];
                    for (let opt of Object.values(param)[0]) {                            
                        let o = document.createElement("option");
                        o.innerText=opt;o.setAttribute("value",opt);    
                        elem.appendChild(o);
                    }
            }
            // Fix name from clean text to param name 
            
            let paramText = Object.keys(param)[0].toLowerCase().replace(" ","_");

            if (paramText=="frequency") paramText="freq";
            if (paramText=="filtersubtype") paramText="type";
            elem.value=this.parameters[paramText];            
            elem.addEventListener("change",this.updateEventHandler);

            peqParams.appendChild(elem);
        }
        // console.log("Filter Params :",filterParams)
        this.elementCollection.peqParams=peqParams;
    }

    async updateEventHandler(e) {
        let peqElement;
        if (e.target.className=='peqElement') peqElement=e.target;
        if (e.target.parentElement.className=='peqElement') peqElement=e.target.parentElement;
        if (e.target.parentElement.parentElement.className=='peqElement') peqElement=e.target.parentElement.parentElement;

        let id = e.target.id;
        let value = e.target.value;

        if (value.length==0) { 
            value=0;
            e.target.value=0;

        }

        console.log("peq element ",id,value,peqElement.filter.type)
        switch (id) {
            case "filterName":
                peqElement.filter.name = value;
                break;
            case "filterDesc":
                peqElement.filter.description = value;
                break;
            case "type":
                peqElement.filter.type = value
                break;
            default:
                let val;
                if (id=="frequency") id="freq";
                if (id=="filtersubtype") id="type";                
                if (!isNaN(parseFloat(value))) val = parseFloat(value); else val = value;
                peqElement.filter.parameters[id]= val;
        }

        let configName = peqElement.getAttribute("configName");
        let filterJson = peqElement.filter.createFilterJson(peqElement.filter.name,peqElement.filter.type,peqElement.filter.parameters);
        console.log(configName,filterJson)

        delete peqElement.filter.DSP.config.filters[configName];
        Object.assign(peqElement.filter.DSP.config.filters,filterJson);
        await peqElement.filter.DSP.uploadConfig()

        peqElement.setAttribute("configName",Object.keys(filterJson)[0]);
        peqElement.dispatchEvent(new Event("updated"));


    }

    createElementEx(name) {
        this.name=name;
        const filterElement = document.createElement('div');
        filterElement.filter=this; filterElement.className="filterElement"; filterElement.setAttribute("configName",name);

        const filterBasic = document.createElement('div'); 
        filterBasic.id = "filterBasic"; filterBasic.className='filterBasic';


        let nameSpan = document.createElement('span');
        nameSpan.innerText='Name :'
        filterBasic.appendChild(nameSpan);

        const filterName = document.createElement('input');
        filterName.className="filterName"; filterName.value=this.name; filterName.id="filterName";
        filterBasic.appendChild(filterName);
        
        let typeSpan = document.createElement('span');
        typeSpan.innerText='Type :'
        filterBasic.appendChild(typeSpan);

        const filterType = document.createElement('select');
        filterType.className="filterType"; filterType.setAttribute("id","filterType");       
        for (let type of Object.keys(Types)) {
            let opt = document.createElement("option");
            opt.setAttribute("value",type); opt.innerText=type;
            filterType.appendChild(opt);
        }
        filterType.addEventListener("change",(e)=>{     
            let target = e.target;            
            updateSubTypes(this,target.parentElement,target);
            updateParams(this,target,target.parentElement.children["filterSubType"])
        })
        filterBasic.appendChild(filterType);        
        filterElement.appendChild(filterBasic);

        updateSubTypes(this,filterElement,filterType);

        function updateSubTypes(filter,element,type) {
            
            let existingElement = element.children["filterSubType"];                
            if (existingElement!=undefined) existingElement.remove();               

            existingElement = type.parentElement.children["filterParams"];
            if (existingElement!=undefined) existingElement.remove();

            const filterSubType = document.createElement("select");
            filterSubType.className="filterType"; filterSubType.setAttribute("id","filterSubType");
            for (let subType of filter.getFilterSubTypes(type.value)) {            
                let opt = document.createElement("option");
                opt.setAttribute("value",subType); opt.innerText=subType;
                filterSubType.appendChild(opt);
            }

            if (filterSubType.childNodes.length>0) {
                filterSubType.addEventListener("change",(e)=>{
                    updateParams(filter,filterType,e.target)
                })
                element.appendChild(filterSubType);
            }
        }

        const filterSubType = filterElement.children["filterSubType"]; 
        updateParams(this,filterType,filterSubType)

        function updateParams(filterA,type,subType) {            
            let typeVal = Types[type.value];            
            let subTypeVal;
            if (subType!=undefined) subTypeVal=subType.value;

            let existingElement = type.parentElement.parentElement.children["filterParams"];
            if (existingElement!=undefined) existingElement.remove();
            
            const filterParams=document.createElement('div');
            filterParams.setAttribute("id","filterParams"); filterParams.className="filterParams";
            let elem;
            // console.log("Types ",typeVal,subTypeVal)
            for (let param of filter.getFilterParams(typeVal,subTypeVal)) { 
                let title=document.createElement("span"); title.innerText=Object.keys(param)[0]+" :";
                filterParams.appendChild(title);
                switch (Object.values(param)[0]) {
                    case "num":
                        elem = document.createElement("input"); elem.setAttribute("type","text");elem.value=0; elem.id=Object.keys(param)[0].toLowerCase();
                        break;
                    case "bool":
                        elem = document.createElement("input"); elem.setAttribute("type","checkbox");elem.id=Object.keys(param)[0].toLowerCase();
                        break;
                    case "text":
                        elem = document.createElement("input"); elem.setAttribute("type","text");elem.value="";elem.id=Object.keys(param)[0].toLowerCase();
                        break;
                    case "array":
                        elem = document.createElement("input"); elem.setAttribute("type","text");elem.value=0;elem.id=Object.keys(param)[0].toLowerCase();
                        break;
                    default:
                        elem = document.createElement("select"); 
                        elem.id = Object.keys(param)[0];
                        for (let opt of Object.values(param)[0]) {                            
                            let o = document.createElement("option");
                            o.innerText=opt;o.setAttribute("value",opt);    
                            elem.appendChild(o);
                        }
                }
                filterParams.appendChild(elem);
            }
            
            type.parentElement.parentElement.appendChild(filterParams);
        }

        // const filterType = document.createElement('div');

        filterElement.filter=this;
        this.filterElement=filterElement;

        assignObserver(filterElement);

        async function eventListener(e) {                        
            // Below line ensures each event runs once (so far)
            if (e.currentTarget.className!='filterElement') return;

            let filterElement;
            if (e.target.className=='filterElement') filterElement=e.target;
            if (e.target.parentElement.className=='filterElement') filterElement=e.target.parentElement;
            if (e.target.parentElement.parentElement.className=='filterElement') filterElement=e.target.parentElement.parentElement;

            // console.log("Listener for ",e.target," : " ,filter.getParams(filterElement));
            
            let configName = filterElement.getAttribute("configName");
            let filterJson = filterElement.filter.createFilterJson(filter.getParams(filterElement));
            console.log(configName,filterJson)

            delete filterElement.filter.DSP.config.filters[configName];
            Object.assign(filterElement.filter.DSP.config.filters,filterJson);
            await filterElement.filter.DSP.uploadConfig()

            filterElement.setAttribute("configName",Object.keys(filterJson)[0]);


        }

        function assignObserver(element) {                               
            for (let e of element.children) {
                if (e.children.length>0) assignObserver(e); else e.addEventListener("change",eventListener);
            }
            element.addEventListener("change",eventListener);
        }

        return filterElement;
    }


    getFilterTypes() {
        return ["Gain","Biquad","Conv","Delay"];
    }

    getFilterSubTypes(filterType) {        
        switch (filterType) {
            case Types.Biquad:
                return ["Free", "Highpass", "Lowpass", "Peaking", "Highshelf", "Lowshelf", "HighpassFO", "LowpassFO", "HighshelfFO", "LowshelfFO", "Notch", "Allpass", "Bandpass", "AllpassFO", "Tilt", "LinkwitzTransform"]                  
            case Types.Conv:
                return ["Raw","Wav","Values"];
            default:
                return [];
        }        
    }

    static getParams(element) {
        let filterObject = {};
        convertNodeToObject(element, filterObject)
        // console.log(filterObject);        
        
        function convertNodeToObject(node, returnObject) {            
            let val;       
            if (node.id==undefined) return;
            switch (node.tagName) {
                case "SPAN":
                    break;
                case "DIV":
                    val = node.innerText;                    
                case "INPUT":                                      
                    if (node.type=="checkbox") val = node.checked; else val = node.value;
                    break;
                case "SELECT":                    
                    val = node.value;
                    break;
                case "OPTION":
                    break;
                default:
                    console.error("filter.getParams error. Tag yype not defined. ",node.tagName);  
                    break;
            }            
            
            returnObject[node.id] = val;            
            if (val== undefined) delete returnObject[node.id];
            if (!isNaN(parseFloat(val))) returnObject[node.id]= parseFloat(val);            

            for (let child of node.children) convertNodeToObject(child,returnObject);            
        }
        return filterObject;
            
        
    }

    createFilterJson(filterName,filterType,filterParams) {
        let filterJson = {}       
        
        console.log(filterParams);
        let parameters={}
        for (let paramName of Object.keys(filterParams)) {                        
            if (paramName=="filterName" || paramName=="filterType") continue;
            
            let paramVal= filterParams[paramName];
            let paramText = paramName.toLowerCase().replace(" ","_");

            if (paramText=="frequency") paramText="freq";
            if (paramText=="filtersubtype") paramText="type";
            parameters[paramText]=paramVal;
        }


        filterJson[filterName]={"type":filterType,"parameters":parameters}
        return filterJson;
    }

    static filterParamsTemplate(filterType, filterSubType) {
        switch (filterType) {
            case Types.Gain:
                return [{"Gain":"num"},{"Inverted":"bool"},{"Mute":"bool"},{"Scale":["dB","linear"]}];

            case Types.Volume:
                return [{"Ramp Time":"num"},{"Fader":["Aux1","Aux2","Aux3","Aux4"]}];

            case Types.Loudness:
                return [{"Fader":["Main","Aux1","Aux2","Aux3","Aux4"]},{"Ref Level":"num"},{"High Boost":"num"},{"Low Boost":"num"},{"Attenuate Mid":"bool"}];

            case Types.Delay:
                return [{"Delay":"num"},{"Unit":["ms","mm","samples"]},{"Subsample":"bool"}];

            case Types.Conv:         

                if (filterSubType=="Raw") return [{"Filename":"text"},{"Skip bytes lines":"num"},{"Read bytes lines":"num"}];
                if (filterSubType=="Wav") return [{"Filename":"text"},{"channel":"num"}];
                if (filterSubType=="Values") return [{"values":"array"}];

            case Types.Biquad:
                if (filterSubType=="Free") return [{"a1":"num"},{"a2":"num"},{"b0":"num"},{"b1":"num"},{"b2":"num"}];
                if (filterSubType=="Highpass" || filterSubType=="Lowpass" || filterSubType=="Bandpass" || filterSubType=="Allpass") return [{"Frequency":"num"},{"Q":"num"}];
                if (filterSubType=="Peaking" || filterSubType=="Highshelf" || filterSubType=="Lowshelf") return [{"Frequency":"num"},{"Gain":"num"},{"Q":"num"}];
                if (filterSubType=="LinkwitzTransform") return [{"Actual F":"num"},{"Actual Q":"num"},{"Target F":"num"},{"Target Q":"num"}];
            
            case Types.Dither:
                return [{"Type":["None","Flat","Highpass","Fweigthed441","Shibata48"]},{"Bits":["16"]}] ;

            case Types.Limiter:
                return [{"Soft Clip":"bool"},{"Clip Limit":"num"}];

            default:
                console.error("Undefined filter type : ",filterType)
                return [];        
        }
    }    

    removeFilter(filterName) {
        delete this.DSP.config.filter[filterName];        
        this.DSP.createFilters();
    }


}

export default filter;