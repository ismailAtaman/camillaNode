

class PEQLine {

    peqline;
    
    constructor() {
        const peqline = document.createElement('div')
        const enabled = document.createElement('input')
        const type = document.createElement('select')
        const LS = document.createElement('option')
        const PK = document.createElement('option')
        const HS = document.createElement('option')
        const freq = document.createElement('input')
        const gain = document.createElement('input')
        const qfact = document.createElement('input')
        const addLineAfter = document.createElement('div')
        const removeLine = document.createElement('div')

        const spanType = document.createElement('span')
        const spanFreq = document.createElement('span')
        const spanGain = document.createElement('span')
        const spanQfact = document.createElement('span')

        peqline.className="peqline";enabled.type="checkbox";peqline.setAttribute("sequence","-1"); enabled.id="enabled";
        type.id="type";type.value="PK";
        LS.value="Lowshelf";LS.innerText="LS";
        PK.value="Peaking";PK.innerText="PK"
        HS.value="Highshelf";HS.innerText="HS";
        freq.type="text";freq.id="freq"; freq.setAttribute('value',1000);
        gain.type="text";gain.id="gain"; gain.setAttribute("value",0)
        qfact.type="text";qfact.id="qfact"; qfact.setAttribute("value",1.41)
        addLineAfter.className='button';removeLine.className='button';addLineAfter.classList.add('add');removeLine.classList.add('remove')        
        spanType.innerText="Type :"; spanFreq.innerText="Frequency :";spanGain.innerText="Gain :",spanQfact.innerText="Q :";

        type.appendChild(LS);type.appendChild(PK);type.append(HS);
        peqline.appendChild(enabled);
        peqline.appendChild(spanType); peqline.appendChild(type);
        peqline.appendChild(spanFreq); peqline.appendChild(freq);
        peqline.appendChild(spanGain); peqline.appendChild(gain);
        peqline.appendChild(spanQfact); peqline.appendChild(qfact);
        peqline.appendChild(addLineAfter);peqline.appendChild(removeLine);

        const observer = new MutationObserver(function(muts){
            muts.forEach(function(mut){                                                                                       
                if (mut.target.id=='type' || mut.target.id=='freq' || mut.target.id=='gain' || mut.target.id=='qfact') {
                    // console.log("Mutation detected!",mut.oldValue,mut.target.getAttribute(mut.attributeName));                    
                    // mut.target.parentElement.dispatchEvent(new Event('update'));                    
                    // if (mut.target.id=="freq") mut.target.parentElement.setAttribute('freq',mut.target.value);
                    mut.target.dispatchEvent(new Event('focusout'));                
                }
                
            })
        })                  


        observer.observe(peqline,{attributeFilter:["value","text","innerText"],attributes:true,subtree:true,childList:true, attributeOldValue:true});

        enabled.checked=true;
        freq.setAttribute("value",1000); freq.setAttribute("oldValue",1000);
        gain.setAttribute("value",0); gain.setAttribute("oldValue",0);
        qfact.setAttribute("value",1.41); qfact.setAttribute("oldValue",1.41);

        enabled.addEventListener("change", function(e){
            let oldValue = this.getAttribute("oldValue");              
            if (this.value!=oldValue) this.parentElement.dispatchEvent(new Event("update"));
        })

        type.addEventListener("focus",function(e){
            this.setAttribute("oldValue",this.value);  
        })       

        type.addEventListener("change", function(e){
            let oldValue = this.getAttribute("oldValue");              
            if (this.value!=oldValue) this.parentElement.dispatchEvent(new Event("update"));
        })   

        freq.addEventListener('focus',function(){                        
            this.value = this.value.replace(',','');                        
            this.value = this.value.replace('Hz','');
            this.setAttribute("oldValue",this.value);
        })

        freq.addEventListener('focusout',function(){                                                      
            let oldValue = this.getAttribute("oldValue");  
            if (isNaN(this.value)) this.value=oldValue;  
            if (this.value!=oldValue) this.parentElement.dispatchEvent(new Event("update"));
            this.value= new Intl.NumberFormat('en-US').format(this.value);
            this.value=this.value+'Hz';        
        })

        freq.addEventListener("wheel",function(e){            
            const direction = e.deltaY>0?-1:1;              
            let val = parseInt(this.value.replace('Hz','').replace(',',''));
            this.value= parseInt(val+direction*0.1*val);
            // this.oldValue=this.value;
            this.dispatchEvent(new Event("focusout"))
            e.preventDefault();
        })

        gain.addEventListener('focus',function(){            
            this.value = this.value.replace('dB','');
            this.setAttribute("oldValue",this.value);                 
        })

        gain.addEventListener('focusout',function(){                                    
            let oldValue = this.getAttribute("oldValue");
            if (isNaN(this.value)) this.value=oldValue;                        
            if (this.value!=oldValue || this.value==0) this.parentElement.dispatchEvent(new Event("update"));
            this.value=this.value+'dB';                                                
        })

        gain.addEventListener("wheel",function(e){            
            const direction = e.deltaY>0?-1:1;              
            let val = parseFloat(this.value.replace('dB',''))+direction*0.5;
            if (val<-14) val=-14;
            if (val>14) val=14;
            val = Math.round(val * 100)/100;
            this.value= val;            
            this.dispatchEvent(new Event("focusout"))
            e.preventDefault();
        })

        gain.addEventListener("dblclick",function(e){this.value=0; this.setAttribute("oldValue",0); this.dispatchEvent(new Event("focusout"))});       

        qfact.addEventListener('focus',function(){                     
            this.setAttribute("oldValue",this.value);
        })

        qfact.addEventListener('focusout',function(){                        
            let oldValue = this.getAttribute("oldValue");
            if (isNaN(this.value)) this.value=oldValue;                                    
            if (this.value!=oldValue) this.parentElement.dispatchEvent(new Event("update"));
        })

        qfact.addEventListener("wheel",function(e){            
            const direction = e.deltaY>0?-1:1;              
            let val = parseFloat(this.value)+direction*0.5
            if (val<0.2) val=0.2;
            this.value= Math.round(val * 100) /100;
            // this.oldValue=this.value;
            this.dispatchEvent(new Event("focusout"))
            e.preventDefault();
        })

        // peqline.addEventListener("update",function(){
        //     console.log("Update config")
        // })

        removeLine.addEventListener('click',function(){peqline.dispatchEvent(new Event("remove"))});  
        addLineAfter.addEventListener('click',function(){peqline.dispatchEvent(new Event("add"))});  

        peqline.instance=this;
        this.peqline=peqline;
        
        return peqline;
    }

    // Takes telement values and creates JSON config object
    valuesToJSON() {                
        let enabled,type,freq,gain,qfact;
        this.peqline.childNodes.forEach(element => {            
            if (element.id =="enabled") enabled= element.checked;
            if (element.id =="type") type=element.value;
            if (element.id =="freq") freq=parseInt(element.value.replace(',',''));
            if (element.id =="gain") gain=parseFloat(element.value);
            if (element.id =="qfact") qfact=parseFloat(element.value);
        });        
        let tmpObj = new Object();        
        if (!enabled) gain=0;
        
        // let filterName = this.peqline.getAttribute("filterName");
        // if (filterName==undefined) filterName="filter"+sequence;
        
        tmpObj={"type":"Biquad","parameters":{"type":type,"freq":freq,"gain":gain,"q":qfact}}        
        return tmpObj;
    }

    // Takes a JSON config filter object and updates values from it 
    JSONtoValues(filterObject) {
        // console.log(filterObject);

        let parameters=filterObject[Object.keys(filterObject)[0]].parameters;        
        if (parameters==undefined) parameters=filterObject["parameters"];
        //console.log(parameters);
        

        this.peqline.childNodes.forEach(element => {            
            if (element.id=="type")  {  element.value =parameters.type; }
            if (element.id=="freq")  { element.value = parameters.freq; element.oldValue=parameters.freq; }
            if (element.id=="gain")  { element.value = parameters.gain; element.oldValue=parameters.gain }
            if (element.id=="qfact") { element.value = parameters.q; element.oldValue=parameters.q }
        });
    }

    getParams() {
        let obj={}; 
        this.peqline.childNodes.forEach(e=>{               
            if (e.id.length>0) {                 
                let name = e.id;
                let val= e.value.replace("Hz","").replace("dB","").replace(",","");       
                if (!isNaN(parseFloat(val))) val=parseFloat(val);
                obj[name]=val;                
            } 
        })        
        return obj;
    }

    /**************************************************************************************************************************************/

    static addPEQLine(parent,insertBefore) {
        const tmpPEQLine = new PEQLine();
        const sequence = Array.from(PEQ.children).filter(child=>child.className=='peqline').length;
        tmpPEQLine.setAttribute("sequence",sequence);        
        if (insertBefore==undefined) parent.appendChild(tmpPEQLine); else if(insertBefore.nextSibling) parent.insertBefore(tmpPEQLine,insertBefore.nextSibling); else parent.appendChild(tmpPEQLine)
        return tmpPEQLine;
    }

    static plot(filterObject,canvas) {
        const ctx = canvas;        
        const context = ctx.getContext('2d');             
        context.clearRect(0, 0, ctx.width, ctx.height)        
        let color=parseInt("0F0",16);
        

        createGrid(ctx); 
        let totalArray = new Array(1024).fill(0).map(() => new Array(1024).fill(0));
        let dataMatrix;
        for (let filter of Object.keys(filterObject)) {  
            // console.log(filterObject)                        
            dataMatrix = calculateFilterDataMatrix(filterObject[filter].parameters.type, filterObject[filter].parameters.freq, filterObject[filter].parameters.gain, filterObject[filter].parameters.q);                        
            for (i=0;i<dataMatrix.length;i++) {
                totalArray[i][0]=dataMatrix[i][0]
                totalArray[i][1]=dataMatrix[i][1]+totalArray[i][1];        
            }    
            color = color + 60;
            plotArray(ctx,dataMatrix,"#"+color.toString(16),1.5);
        }
        plotArray(ctx, totalArray,"#EEE",3)
    }

    

}

export default PEQLine;