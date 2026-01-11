/**
 * Represents an equalizer knob component.
 */
class EQKnob {    
    #knobHeadDot; 

    knob;
    callback;
    defaultVal;
    offAtDefault=false;

    /**
     * Create an EQKnob.
     * @param {string} label - The label for the knob.
     * @param {number|string} val - The initial value of the knob.
     * If '181', sets offset to -15.
     * Sets knob's label attribute to the specified label.
     */    
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

        // Observe changes to knobHeadDot's attributes and update knob UI accordingly
        const observer = new MutationObserver(function(muts){
            muts.forEach(function(mut){                
                if (mut.type=="attributes" && mut.attributeName=="val") {                    
                    const dot = mut.target;
                    const knob = dot.parentElement.parentElement;

                    const change = new Event("change");
                    knob.dispatchEvent(change);

                    const val = dot.getAttribute(mut.attributeName);
                    let offset = parseInt(dot.getAttribute("offset"));
                    if (Number.isNaN(offset)) offset=0;      

                    dot.style = 'transform: rotate('+val+'deg);'
                    const hue= 170-val/2;                    
                    knob.style= '--bck:'+hue;

                    // make the ring invisible if knob is at defailt value and offAtDefault is set to true
                    if (knob.instance.offAtDefault && val == knob.instance.defaultVal) {                        
                        knob.style="background: transparent; box-shadow: none;"                        
                    }              

                    const valElement = knob.children[1];
                    const displayValue = ((val-31)/10)+offset;
                    valElement.innerText = Number(displayValue.toFixed(1));
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

    /**
     * Get the current value of the knob.
     * @returns {string} The current value set on the knobHeadDot attribute.
     */
    getVal() {
        return this.knobHeadDot.getAttribute("val");        
    }

    /**
     * Set the value of the knob.
     * @param {number|string} v - The value to be set on the knob. 
     * Rounds and applies if numeric, otherwise direct set.
     * @returns {number|string} The processed value being set.
     */
    setVal(v) {
        const num = Number(v);
        const clean = Number.isFinite(num) ? Math.round(num) : v;
        this.knobHeadDot.setAttribute("val", clean);
        return clean;
    }

}

export default EQKnob;
