
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
    loading=false;
    basic=false;    

    constructor(name,filter) {        
        if (name==undefined) name=new Date().getTime().toString().substring(8);
        this.name = name;
        this.description=filter.description;        
        this.type=filter.type;
        this.parameters=filter.parameters;                 
        this.createElement();
        return this;
    }

    createElement(basic) {
        if (basic==undefined) basic=false;
        this.loading=true;
        this.basic=basic;
        this.elementCollection={};

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
            if (this.basic && (type!="Biquad")) continue;
            let opt = document.createElement("option");
            opt.setAttribute("value",type); opt.innerText=type;
            filterType.appendChild(opt);
        }

        filterType.value=this.type;
        filterType.addEventListener("change",this.updateEventHandler);
        this.elementCollection.filterType=filterType;        

        this.createSubTypesElement();
        this.createParamsElement();

        
        

        // Add buttons 
        const addButton = document.createElement('div'); 
        addButton.className="peqNavigate"; addButton.setAttribute("target","");
        addButton.style = "width: max-content; margin-left: 20px;";

        const addButtonImg = document.createElement('img');
        addButtonImg.src = "/img/icon/add.png"; addButtonImg .className='icon';        
        
        addButton.appendChild(addButtonImg)
        addButton.addEventListener('click',function(e){ 
            let peqElement;
            if (e.target.className=='peqElement') peqElement=e.target;
            if (e.target.parentElement.className=='peqElement') peqElement=e.target.parentElement;
            if (e.target.parentElement.parentElement.className=='peqElement') peqElement=e.target.parentElement.parentElement;
            if (e.target.parentElement.parentElement.parentElement.className=='peqElement') peqElement=e.target.parentElement.parentElement.parentElement;
            peqElement.dispatchEvent(new Event("addNewFilter"));
        })
        this.elementCollection.addButton = addButton;


        const removeButton = document.createElement('div'); 
        removeButton.className="peqNavigate"; removeButton.setAttribute("target","");
        removeButton.style = "width: max-content;"

        const removeButtonImg = document.createElement('img');
        removeButtonImg.src = "/img/icon/remove.png"; removeButtonImg .className='icon';        
        
        removeButton.appendChild(removeButtonImg)
        removeButton.addEventListener('click',function(e){ 
            let peqElement;
            if (e.target.className=='peqElement') peqElement=e.target;
            if (e.target.parentElement.className=='peqElement') peqElement=e.target.parentElement;
            if (e.target.parentElement.parentElement.className=='peqElement') peqElement=e.target.parentElement.parentElement;
            if (e.target.parentElement.parentElement.parentElement.className=='peqElement') peqElement=e.target.parentElement.parentElement.parentElement;
            peqElement.dispatchEvent(new Event("removeFilter"));
        })

        this.elementCollection.removeButton = removeButton;
        this.loading=false;
        
    }

    createSubTypesElement() {
        let basicTypes = ["Highshelf","Lowshelf","Peaking"]        

        const filterSubType = document.createElement("select");
        filterSubType.className="filterType"; filterSubType.setAttribute("id","filterSubType");

        for (let subType of this.getFilterSubTypes(this.type)) {                        
            if (this.basic && !basicTypes.includes(subType)) continue;
            let opt = document.createElement("option");
            opt.setAttribute("value",subType); opt.innerText=subType;
            filterSubType.appendChild(opt);
        }
        
        filterSubType.addEventListener("change",this.updateEventHandler);
        if (this.parameters.type!=undefined) filterSubType.value=this.parameters.type;
        this.elementCollection.filterSubType=filterSubType;        
    }

    createParamsElement() {        
        // this.elementCollection.peqParams={}
        const peqParams=document.createElement('div');
        peqParams.setAttribute("id","peqParams"); peqParams.className="peqParams";
        let elem;

        // console.log("Type ",this.type,"Subtype ",this.parameters.type)
        for (let param of filter.filterParamsTemplate(this.type,this.parameters.type)) { 
            let title=document.createElement("span"); title.innerText=Object.keys(param)[0]+" :";
            peqParams.appendChild(title);
            switch (Object.values(param)[0]) {
                case "num":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","text");                    
                    elem.id=Object.keys(param)[0].toLowerCase();

                    elem.addEventListener("wheel",function(e){                        
                        if (this.getAttribute("wheel")=="disabled") return;
                        let dir = e.deltaY> 0 ? 1:-1;
                        let val; 
                        if (dir>0) val = parseFloat(this.value) * 0.1; else val = Math.round(10*parseFloat(this.value) / 11)/10;
                        if (val<1) val=1;
                        val = Math.round(val);                        
                        this.value = parseFloat(this.value) + dir * val;

                        // Q can not be zero - so change it to min 0.2 if it is
                        if (this.id=="q" && this.value<=0) this.value=0.1;

                        // Freq can not be less than 3 - so change it to min 3 if it is
                        if (this.id=="frequency" && this.value<=3) this.value=3;
                        
                        e.preventDefault();
                        this.dispatchEvent(new Event("change"));
                    })

                    elem.addEventListener("dblclick",e=>{e.target.value=0;e.target.dispatchEvent(new Event("change"));});
                    elem.value=1;
                    break;
                case "bool":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","checkbox");
                    elem.id=Object.keys(param)[0].toLowerCase();                                        
                    elem.checked=false;                                
                    break;
                case "text":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","text");                    
                    elem.id=Object.keys(param)[0].toLowerCase();
                    elem.value="";
                    break;
                case "array":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","text");                    
                    elem.id=Object.keys(param)[0].toLowerCase();
                    elem.value="";
                    break;
                default:
                    elem = document.createElement("select"); 
                    elem.id = Object.keys(param)[0];
                    let i=0;
                    for (let opt of Object.values(param)[0]) {                            
                        let o = document.createElement("option");
                        o.innerText=opt;o.setAttribute("value",opt);                            
                        elem.appendChild(o);
                        if (i==0) elem.value=opt;
                        i++;
                    }
                    
            }            

            let paramName = Object.keys(param)[0].toLowerCase().replace(" ","_");                        
            if (paramName=="frequency") paramName="freq";
            if (paramName=="filtersubtype") paramName="type";         
            // console.log("Param :", paramName,"Filter val : ",this.parameters[paramName]," Element Val : ",elem.value," Type :",typeof(elem.value))
            
            if (this.parameters[paramName]!=undefined) {                
                if (elem.type=="checkbox") elem.checked = this.parameters[paramName]; else elem.value=this.parameters[paramName]; 
            } else {                                
                if (elem.value!=undefined) this.parameters[paramName]=elem.value;                                
            }

            elem.addEventListener("change",this.updateEventHandler);
            peqParams.appendChild(elem);
        }
                
        // console.log("peqParams :",this.parameters)
        this.elementCollection.peqParams=peqParams;
    }

    setType(type) {
        this.type=type;
        let subType;
        if (this.basic) subType = "Peaking"; else this.getFilterSubTypes(type)[0];                
        this.setSubType(subType);        
    }

    setSubType(subType) {        
        if (this.parameters.type==subType) return;

        if (this.elementCollection.filterSubType!=undefined) this.elementCollection.filterSubType.value = subType;        

        let type = this.type;        
        let oldParameters = this.parameters;
        this.parameters={};
        this.parameters.type=subType;

        let params =  filter.filterParamsTemplate(type,subType);
        for (let param of params) {
            let paramName = Object.keys(param)[0].toLowerCase().replace(" ","_");                        
            if (paramName=="frequency") paramName="freq";
            if (paramName=="filtersubtype") paramName="type";         
            let paramType = Object.values(param)[0];

            // If old value exists, use it, if not set to default
            if (oldParameters[paramName]!=undefined) 
                this.parameters[paramName]=oldParameters[paramName];
            else {
                switch (paramType) {
                    case "num":
                        let val;
                        if (paramName=="freq") val=3146;
                        if (paramName=="gain") val=0;
                        if (paramName=="q") val=1.41;
                        this.parameters[paramName]=val;
                        break;
                    case "bool":
                        this.parameters[paramName]=false;
                        break;
                    case "text":
                        this.parameters[paramName]="";
                        break;
                    case "array":
                        this.parameters[paramName]="";                    
                        break;
                    default:
                        this.parameters[paramName]=paramType[0];                    
                        break;
                }     
            }       
        }
        // console.log("setSubType parameters ",this.parameters);
    }



    async updateEventHandler(e) {
        // console.log(e.target,e.target.parentElement,e.target.parentElement.parentElement)
        let peqElement;
        if (e.target.classList.contains('peqElement')) peqElement=e.target;
        if (e.target.parentElement.classList.contains('peqElement')) peqElement=e.target.parentElement;
        if (e.target.parentElement.parentElement.classList.contains('peqElement')) peqElement=e.target.parentElement.parentElement;

        
        let id = e.target.id.toLowerCase();
        let value = e.target.value;

        if (value.length==0) { 
            value=0;
            e.target.value=0;
        }

        if (peqElement.filter.loading) return;        

        console.log("peqUpdate : ",id, value)
        switch (id) {
            case "filterName":                               
                break;
            case "filterDesc":
                peqElement.filter.description = value;
                break;
            case "filterType":                
                peqElement.filter.setType(value);
                peqElement.filter.createElement();
                break;
            case "filterSubType":                
                peqElement.filter.setSubType(value);
                peqElement.filter.createElement();
                break;
            default:
                
                let val;
                if (id=="frequency") id="freq";
                if (id=="filtersubtype") id="type";                
                if (!isNaN(parseFloat(value))) val = parseFloat(value); else val = value;
                if (isBoolean(value)) val = Boolean(value);                        
                peqElement.filter.parameters[id]= val;
        }             


        function isBoolean(valueToCheck) {
            return valueToCheck==true?true:valueToCheck==false?true:valueToCheck=="true"?true:valueToCheck=="false"?true:false;
        }


        // Update config 
        
        DSP.config.filters[peqElement.filter.name].description=peqElement.filter.description;
        DSP.config.filters[peqElement.filter.name].type=peqElement.filter.type;
        DSP.config.filters[peqElement.filter.name].parameters=peqElement.filter.parameters

        console.log("peqElement filter config :",DSP.config.filters[peqElement.filter.name])

        peqElement.dispatchEvent(new Event("updated"));

        await DSP.uploadConfig();
    }

    async updateDSP() {                
        DSP.config.filters[this.name].description=this.description;
        DSP.config.filters[this.name].type=this.type;
        DSP.config.filters[this.name].parameters=this.parameters
        await DSP.uploadConfig();        
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
        
        // console.log(filterParams);
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

    getFilterTypes() {
        return ["Gain","Biquad","Conv","Delay"];
    }

    getFilterSubTypes(filterType) {        
        switch (filterType) {
            case Types.Biquad:
                // return ["Free", "Highpass", "Lowpass", "Peaking", "Highshelf", "Lowshelf", "HighpassFO", "LowpassFO", "HighshelfFO", "LowshelfFO", "Notch", "Allpass", "Bandpass", "AllpassFO", "Tilt", "LinkwitzTransform"]                  
                return ["Free", "Highpass", "Lowpass", "Peaking", "Highshelf", "Lowshelf", "Allpass", "Bandpass", "Tilt", "LinkwitzTransform"]                  
            case Types.Conv:
                return ["Raw","Wav","Values"];
            default:
                return [];
        }        
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
                if (filterSubType=="Tilt") return [{"Gain":"num"}]

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

