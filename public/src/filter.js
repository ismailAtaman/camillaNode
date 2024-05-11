class filter {
    type;
    paremeters={}
    name;

    constructor() {                
        return this;    
    }

    createElement(name) {
        this.name=name;
        const filterElement = document.createElement('div');
        filterElement.filter=this; filterElement.className="filterElement"


        let nameSpan = document.createElement('span');
        nameSpan.innerText='Name :'
        filterElement.appendChild(nameSpan);

        const filterName = document.createElement('div');
        filterName.contentEditable=true; filterName.className="filterName"; filterName.innerText=this.name;
        filterElement.appendChild(filterName);
        
        let typeSpan = document.createElement('span');
        typeSpan.innerText='Type :'
        filterElement.appendChild(typeSpan);

        const filterType = document.createElement('select');
        filterType.className="filterType"; filterType.setAttribute("id","filterType");       
        for (let type of this.getFilterTypes()) {
            let opt = document.createElement("option");
            opt.setAttribute("value",type); opt.innerText=type;
            filterType.appendChild(opt);
        }
        filterType.addEventListener("change",(e)=>{     
            let target = e.target;            
            updateSubTypes(target.parentElement.filter,target.parentElement,target);
            updateParams(target.parentElement.filter,target,target.parentElement.children["filterSubType"])
        })
        filterElement.appendChild(filterType);

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

        function updateParams(filter,type,subType) {
            console.log("Updating params");
            let typeVal = type.value;
            let subTypeVal;
            if (subType!=undefined) subTypeVal=subType.value;

            let existingElement = type.parentElement.children["filterParams"];
            if (existingElement!=undefined) existingElement.remove();
            
            const filterParams=document.createElement('div');
            filterParams.setAttribute("id","filterParams"); filterParams.className="filterParams";
            let elem;
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
            type.parentElement.appendChild(filterParams);

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
            case "Biquad":
                return ["Free", "Highpass", "Lowpass", "Peaking", "Highshelf", "Lowshelf", "Allpass", "Bandpass", "LinkwitzTransform"]                  
            case "Conv":
                return ["Raw","Wav","Values"];
            default:
                return [];
        }        
    }

    getFilterParams(filterType, filterSubType) {
        switch (filterType) {
            case "Gain":
                return [{"Gain":"num"},{"Inverted":"bool"},{"Mute":"bool"},{"Scale":["dB","linear"]}];
            case "Delay":
                return [{"Delay":"num"},{"Unit":["ms","mm","samples"]},{"Subsample":"bool"}];
            case "Conv":                
                if (filterSubType=="Raw") return [{"Filename":"text"},{"Skip bytes lines":"num"},{"Read bytes lines":"num"}];
                if (filterSubType=="Wav") return [{"Filename":"text"},{"channel":"num"}];
                if (filterSubType=="Values") return [{"values":"array"}];
            case "Biquad":
                if (filterSubType=="Free") return [{"a1":"num"},{"a2":"num"},{"b0":"num"},{"b1":"num"},{"b2":"num"}];
                if (filterSubType=="Highpass" || filterSubType=="Lowpass" || filterSubType=="Bandpass" || filterSubType=="Allpass") return [{"Frequency":"num"},{"Q":"num"}];
                if (filterSubType=="Peaking" || filterSubType=="Highshelf" || filterSubType=="Lowshelf") return [{"Frequency":"num"},{"Gain":"num"},{"Q":"num"}];
                if (filterSubType=="LinkwitzTransform") return [{"Frequency Actual":"num"},{"Q Actual":"num"},{"Frequency Target":"num"},{"Q Target":"num"}];
            
        }
    }
    
}
export default filter;