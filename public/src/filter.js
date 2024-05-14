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

    type;
    paremeters={}
    name;
    description;
    DSP;
    

    constructor(DSPRef) {                
        this.DSP = DSPRef;
        return this;    
    }

    createElement(name) {
        this.name=name;
        const filterElement = document.createElement('div');
        filterElement.filter=this; filterElement.className="filterElement";

        const filterBasic = document.createElement('div'); 
        // filterBasic.style="grid-column : 1 / span 2;"; 
        filterBasic.id = "filterBasic"; filterBasic.className='filterBasic';


        let nameSpan = document.createElement('span');
        nameSpan.innerText='Name :'
        filterBasic.appendChild(nameSpan);

        const filterName = document.createElement('div');
        filterName.contentEditable=true; filterName.className="filterName"; filterName.innerText=this.name;
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
            console.log("Types ",typeVal,subTypeVal)
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

    static getFilterParams(filterType, filterSubType) {
        switch (filterType) {
            case Types.Gain:
                return [{"Gain":"num"},{"Inverted":"bool"},{"Mute":"bool"},{"Scale":["dB","linear"]}];

            case Types.Volume:
                return [{"Ramp Time (ms)":"num"},{"Fader":["Aux1","Aux2","Aux3","Aux4"]}];

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
}

export default filter;