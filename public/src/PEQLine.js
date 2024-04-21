

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
        const addLineAfter = document.createElement('input')
        const removeLine = document.createElement('input')

        const spanType = document.createElement('span')
        const spanFreq = document.createElement('span')
        const spanGain = document.createElement('span')
        const spanQfact = document.createElement('span')

        peqline.className="peqline";enabled.type="checkbox";peqline.setAttribute("sequence","-1")
        type.id="type";type.value="PK";
        LS.value="Lowshelf";LS.innerText="LS";
        PK.value="Peaking";PK.innerText="PK"
        HS.value="Highshelf";HS.innerText="HS";
        freq.type="text";freq.id="freq"; freq.setAttribute('value',1000)
        gain.type="text";gain.id="gain"; gain.setAttribute("value",0)
        qfact.type="text";qfact.id="qfact"; qfact.setAttribute("value",1.41)
        addLineAfter.type="button";addLineAfter.value="+";
        removeLine.type="button";removeLine.value="x";        
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

        gain.addEventListener('focus',function(){            
            this.value = this.value.replace('dB','');
            this.setAttribute("oldValue",this.value);                 
        })
        
        gain.addEventListener('focusout',function(){                                    
            let oldValue = this.getAttribute("oldValue");
            if (isNaN(this.value)) this.value=oldValue;                        
            if (this.value!=oldValue) this.parentElement.dispatchEvent(new Event("update"));
            this.value=this.value+'dB';                                    
        })

        qfact.addEventListener('focus',function(){                     
            this.setAttribute("oldValue",this.value);
        })

        qfact.addEventListener('focusout',function(){            
            let oldValue = this.getAttribute("oldValue");
            if (isNaN(this.value)) this.value=oldValue;                                    
            if (this.value!=oldValue) this.parentElement.dispatchEvent(new Event("update"));
       })

        peqline.addEventListener("update",function(e){
            console.log("update graph and config")
        })

        peqline.instance=this;
        this.peqline=peqline;
        
        return peqline;
    }

    static addPEQLine(parent) {
        const tmpPEQLine = new PEQLine();
        const sequence = Array.from(PEQ.children).filter(child=>child.className=='peqline').length;
        tmpPEQLine.setAttribute("sequence",sequence);
        parent.appendChild(tmpPEQLine);
        return tmpPEQLine;
    }
}

export default PEQLine;