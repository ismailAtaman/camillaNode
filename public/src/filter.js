
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
    DSP = {}; 
    basic=false;       
    filterJSON ={"DefaultFilterName":{"type":"Biquad","description":"Default filter","parameters":{
        "type": "Peaking",
        "freq": 1000,
        "q": 1.41,
        "gain": 0
    }}}
    elementCollection={};


    constructor(dsp) {
        this.DSP=dsp;
        let filterName ="F"+new Date().getTime().toString().substring(6)
        this.setName(filterName);
        return this;
    }

    getName() {
        return Object.keys(this.filterJSON)[0];
    }

    setName(name) {
        let filterName = this.getName();
        let filterBody = this.filterJSON[filterName];
        this.filterJSON={};
        this.filterJSON[name]=filterBody;
    }

    getDescription() {
        let name = this.getName();
        return this.filterJSON[name].description;
    }

    getType() {
        let name = this.getName();
        return this.filterJSON[name].type;
    }

    getSubType() {
        let name = this.getName();
        return this.filterJSON[name].parameters.type;
    }

    setFilterParameter(parameter,value) {
        let filterName = this.getName();
        let paramName=parameter.toLowerCase().replace(" ","_");
        if (paramName=="frequency") paramName="freq";
        switch (paramName) {
            case "name":
                let filterBody = this.filterJSON[filterName];
                this.filterJSON={};
                this.filterJSON[value]=filterBody;                
                break;
            case "description":
                this.filterJSON[filterName].description=value;                
                break;
            case "type":
                this.filterJSON[filterName].type=value;
                let subTypes = this.getFilterSubTypes();                 
                this.setFilterParameter("subType",subTypes[0])                
                break;
            case "subtype":
                let oldParameters =this.filterJSON[filterName].parameters;
                this.filterJSON[filterName].parameters={};
                if (value!=undefined) if (value.length>0) this.filterJSON[filterName].parameters.type=value;                                
                let params = this.getFilterParams();                
                params.forEach(param=>{                                    
                    let paramName = Object.keys(param)[0];
                    let paramType = param[paramName]; 
                    paramName=paramName.toLowerCase().replace(" ","_");                    
                    if (paramName=="frequency") paramName="freq";
                    console.log("setFilterParams name and type :",paramName,paramType,value);
                    switch (paramType) {
                        case "num":                        
                            let val=0;                            
                            if (paramName.toLowerCase().includes("q")) val=1.41;
                            if (paramName.toLowerCase().includes("freq")) val=100;
                            // Parameter existed before, maintain the value
                            if (oldParameters[paramName]!=undefined) val = oldParameters[paramName];
                            this.filterJSON[filterName].parameters[paramName]=val; 
                            break;
                        case "bool":
                            // Parameter existed before, maintain the value
                            if (oldParameters[paramName]!=undefined)  this.filterJSON[filterName].parameters[paramName] = oldParameters[paramName]; else this.filterJSON[filterName].parameters[paramName]=false;
                            break;
                        case "text":
                            // Parameter existed before, maintain the value
                            if (oldParameters[paramName]!=undefined)  this.filterJSON[filterName].parameters[paramName] = oldParameters[paramName]; else this.filterJSON[filterName].parameters[paramName]="";
                            break;
                        case "array":
                            // Parameter existed before, maintain the value
                            if (oldParameters[paramName]!=undefined)  this.filterJSON[filterName].parameters[paramName] = oldParameters[paramName]; else this.filterJSON[filterName].parameters[paramName]=""
                            break;
                        default:
                            // Parameter existed before, maintain the value
                            if (oldParameters[paramName]!=undefined)  this.filterJSON[filterName].parameters[paramName] = oldParameters[paramName]; else this.filterJSON[filterName].parameters[paramName]=Object.values(paramType)[0];                            
                    }                         
                })                                
                break;                
            default:                
                if (value=="true") value=true;
                if (value=="false") value=false;
                this.filterJSON[filterName].parameters[paramName]=value;            
        }       
        // console.log(parameter,value) 
        // console.log(this.filterElement[filterName].parameters);
        
        this.loadToDSP();
    }

    getFilterParameter(parameter) {
        let filterName = this.getName();
        let paramName=parameter.toLowerCase().replace(" ","_");
        if (paramName=="frequency") paramName="freq";
        switch (paramName) {
            case "name":
                return this.getName()                
            case "description":
                return this.getDescription();                
            case "type":
                return this.getType();                
            case "subtype":
                return this.getSubType();                
            default:
                return this.filterJSON[filterName].parameters[paramName];
        }             
    }

    getParameters() {
        let name = this.getName();
        return this.filterJSON[name].parameters;
    }

    async loadFromDSP(filterName) {
        this.filterJSON={};
        this.filterJSON[filterName] = this.DSP.config.filters[filterName];
    }

    loadToDSP(channel) {
        if (channel==undefined) this.DSP.addFilterToAllChannels(this.filterJSON); else this.DSP.addFilter(this.filterJSON,channel)        
    }    

    async uploadToDSP() {
        await this.DSP.uploadConfig();
    }

    createElementCollection(basic) {
        if (basic==undefined) basic=false;
        this.loading=true;
        this.basic=basic;
        this.elementCollection={};

        this.elementCollection.filter=this;

        // Name
        this.createNameElement();  

        // Description
        this.createDescriptionElement();

        // Type
        this.createTypeElement();

        // Sub-type       
        this.createSubTypeElement();

        // Parameters
        this.createParamsElement();

        // Add button 
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

        // Remove button
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
              
    }


    createNameElement() {
        const filterName = document.createElement('input');        
        filterName.className="filterName"; filterName.value=this.getName(); filterName.id="name";        
        this.elementCollection.filterName=filterName;       
    }

    createDescriptionElement() {
        const filterDesc = document.createElement('input');
        filterDesc.className="filterDesc"; filterDesc.value=this.getDescription(); filterDesc.id = "description"
        //filterDesc.addEventListener("change",this.updateEventHandler);
        this.elementCollection.filterDesc=filterDesc;       
    }

    createTypeElement() {
        const filterType = document.createElement('select');
        filterType.className="filterType"; filterType.id= "type";
        for (let type of Object.keys(Types)) {
            if (this.basic && (type!="Biquad")) continue;
            let opt = document.createElement("option");
            opt.setAttribute("value",type); opt.innerText=type;
            filterType.appendChild(opt);
        }
        filterType.value=this.getType();        
        filterType.filter = this;
        filterType.addEventListener("change",async function(){            
            this.filter.setFilterParameter(this.id,this.value);
            this.filter.createSubTypeElement();            
            this.filter.elementCollection.filterSubType.dispatchEvent(new Event("change"));
            await this.filter.uploadToDSP();
        });

        filterType.addEventListener("change",async function(){                        
            this.filter.setFilterParameter(this.id,this.value);
            this.parentElement.parentElement.dispatchEvent(new Event("updated"));
            await this.filter.uploadToDSP();

        })
        this.elementCollection.filterType=filterType;
    }

    createSubTypeElement() {
        let basicTypes = ["Highshelf","Lowshelf","Peaking"]        

        const filterSubType = document.createElement("select");
        filterSubType.className="filterType"; filterSubType.id= "subType";

        for (let subType of this.getFilterSubTypes()) {                        
            if (this.basic && !basicTypes.includes(subType)) continue;
            let opt = document.createElement("option");
            opt.setAttribute("value",subType); opt.innerText=subType;
            filterSubType.appendChild(opt);
        }

        filterSubType.value=this.getSubType();
        filterSubType.filter = this;
        filterSubType.addEventListener("change",async function(){            
            this.filter.setFilterParameter(this.id,this.value);
            this.filter.createParamsElement();            
            await this.filter.uploadToDSP();
            
        });
        if (filterSubType.children.length==0) filterSubType.style.display="none"; else filterSubType.style.display="unset";
        filterSubType.addEventListener("change",async function(){                        
            this.filter.setFilterParameter(this.id,this.value);
            let parent = this.parentElement? this.parentElement.parentElement: this.parentElement;  
            if (parent==null) return;
            parent.dispatchEvent(new Event("updated"));
            await this.filter.uploadToDSP();

        })
        this.elementCollection.filterSubType=filterSubType;       
    }

    createParamsElement() {        
        const peqParams=document.createElement('div');
        peqParams.className="peqParams";
        peqParams.id = "peqParams";
        
        let params = this.getFilterParams();        
        0
        params.forEach(param=>{
            // console.log("Param",param)
            let paramName = Object.keys(param)[0];
            let paramType = param[paramName];            

            // Add the title 
            let titleElement = document.createElement("span"); titleElement.innerText= paramName;
            peqParams.appendChild(titleElement);
            let elem;
            // console.log("Name",paramName,"Type : ",paramType)

            switch (paramType) {
                case "num":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","text");                    
                    elem.id=paramName;

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
                    
                    break;
                case "bool":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","checkbox");
                    elem.id=paramName;                             
                    elem.checked=false;                                
                    break;
                case "text":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","text");                    
                    elem.id=paramName;
                    elem.value="";
                    break;
                case "array":
                    elem = document.createElement("input"); 
                    elem.setAttribute("type","text");                    
                    elem.id=paramName;
                    elem.value="";
                    break;
                default:
                    elem = document.createElement("select"); 
                    elem.id = paramName;
                    let i=0;
                    for (let opt of Object.values(paramType)) {                            
                        let o = document.createElement("option");
                        o.innerText=opt;o.setAttribute("value",opt);                            
                        elem.appendChild(o);
                        if (i==0) elem.value=opt;
                        i++;
                }                    
            }   

            elem.value=this.getFilterParameter(paramName);
            elem.filter=this;
            elem.addEventListener("change",async function(){
                let val = this.value;
                if (this.type=="checkbox") val = this.checked;
                this.filter.setFilterParameter(this.id,val);
                this.parentElement.parentElement.dispatchEvent(new Event("updated"));
                await this.filter.uploadToDSP();

            })
            peqParams.appendChild(elem);

        })
        this.elementCollection.peqParams=peqParams;       

    }

    getFilterSubTypes() {        
        let filterType = this.getType();
        switch (filterType) {
            case Types.Biquad:
                // return ["Free", "Highpass", "Lowpass", "Peaking", "Highshelf", "Lowshelf", "HighpassFO", "LowpassFO", "HighshelfFO", "LowshelfFO", "Notch", "Allpass", "Bandpass", "AllpassFO", "Tilt", "LinkwitzTransform"]                  
                return ["Free", "Highpass", "Lowpass", "Peaking", "Highshelf", "Lowshelf", "Allpass", "Bandpass", "LinkwitzTransform"]                  
            case Types.Conv:
                return ["Raw","Wav","Values"];
            default:
                return [];
        }        
    }

    getFilterParams() {
        let type = this.getType();
        let subType = this.getSubType();

        // console.log("GetFilterParams ",type,subType)

        switch (type) {
            case Types.Gain:
                return [{"Gain":"num"},{"Inverted":"bool"},{"Mute":"bool"},{"Scale":["dB","linear"]}];

            case Types.Volume:
                return [{"Ramp Time":"num"},{"Fader":["Aux1","Aux2","Aux3","Aux4"]}];

            case Types.Loudness:
                return [{"Fader":["Main","Aux1","Aux2","Aux3","Aux4"]},{"Reference Level":"num"},{"High Boost":"num"},{"Low Boost":"num"},{"Attenuate Mid":"bool"}];

            case Types.Delay:
                return [{"Delay":"num"},{"Unit":["ms","mm","samples"]},{"Subsample":"bool"}];

            case Types.Conv:         

                if (subType=="Raw") return [{"Filename":"text"},{"Skip bytes lines":"num"},{"Read bytes lines":"num"}];
                if (subType=="Wav") return [{"Filename":"text"},{"channel":"num"}];
                if (subType=="Values") return [{"values":"array"}];

            case Types.Biquad:
                if (subType=="Free") return [{"a1":"num"},{"a2":"num"},{"b0":"num"},{"b1":"num"},{"b2":"num"}];
                if (subType=="Highpass" || subType=="Lowpass" || subType=="Bandpass" || subType=="Allpass") return [{"Frequency":"num"},{"Q":"num"}];
                if (subType=="Peaking" || subType=="Highshelf" || subType=="Lowshelf") return [{"Frequency":"num"},{"Gain":"num"},{"Q":"num"}];
                if (subType=="LinkwitzTransform") return [{"Freq Act":"num"},{"Q Act":"num"},{"Freq Target":"num"},{"Q Target":"num"}];
                if (subType=="Tilt") return [{"Gain":"num"}]

            case Types.Dither:
                return [{"Type":["None","Flat","Highpass","Fweigthed441","Shibata48"]},{"Bits":["16"]}] ;

            case Types.Limiter:
                return [{"Soft Clip":"bool"},{"Clip Limit":"num"}];

            default:
                console.error("Undefined filter type : ",type)
                return [];        
        }
    }    
}

export default filter;