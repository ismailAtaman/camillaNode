

class EQKnob {    
    #knobHeadDot; 

    knob;
    callback;
    defaultVal;

    constructor(label,val) {
        this.knob = document.createElement('div');
        const knobHead = document.createElement('div');
        this.knobHeadDot = document.createElement('div');
        const knobVal = document.createElement('div');

        this.knob.className='knob';
        knobHead.className='knobHead';
        this.knobHeadDot.className='knobHeadDot';
        knobVal.className='knobVal';

        this.knob.appendChild(knobHead);
        this.knob.appendChild(knobVal);
        knobHead.appendChild(this.knobHeadDot);

        this.knobHeadDot.setAttribute("val",val);
        this.defaultVal=val;
        if (val=="181") this.knobHeadDot.setAttribute("offset",-15);
        this.knob.setAttribute("label",label);

        const observer = new MutationObserver(function(muts){
            muts.forEach(function(mut){                
                if (mut.type=="attributes" && mut.attributeName=="val") {                    
                    const dot = mut.target;

                    const change = new Event("change");
                    dot.parentElement.parentElement.dispatchEvent(change);

                    const val = dot.getAttribute(mut.attributeName);
                    let offset = parseInt(dot.getAttribute("offset"));
                    if (Number.isNaN(offset)) offset=0;
                    
                    dot.style = 'transform: rotate('+val+'deg);'
                    const hue=170-val/2;
                    dot.parentElement.parentElement.style= '--bck:'+hue;
                    const valElement = dot.parentElement.parentElement.children[1];
                    valElement.innerText=((val-31)/10)+offset;
                    valElement.style.opacity='1';
                    setTimeout(function(e){e.style.opacity='0';},1000,valElement);     
                }
            })
        })        
            
        observer.observe(this.knobHeadDot, {attributes:true});
        this.knobHeadDot.setAttribute('val',this.knobHeadDot.getAttribute("val"));
    

        knobHead.addEventListener('wheel',function(e){            
            const direction = e.deltaY>0?1:-1;  
            const dot=knobHead.children[0];      
            let val=parseInt(dot.getAttribute("val"));
            if (direction<0 && val==31) return;
            if (direction>0 && val==331) return;
            dot.setAttribute("val",val+10*direction);
            e.preventDefault();
        })

        // reset on double click
        knobHead.addEventListener('dblclick',function(e){
            const dot=this.children[0];
            dot.setAttribute('val',this.parentElement.instance.defaultVal);      
        })

        this.knob.instance = this;

        return this;
    }

    getVal() {
        return this.knobHeadDot.getAttribute("val");        
    }

    setVal(v) {
        this.knobHeadDot.setAttribute("val",v);
        return v;
    }





}


export default EQKnob; 
