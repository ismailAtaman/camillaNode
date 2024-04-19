

class EQKnob {
    constructor(label,val) {
        const knob = document.createElement('div');
        const knobHead = document.createElement('div');
        const knobHeadDot = document.createElement('div');
        const knobVal = document.createElement('div');

        knob.className='knob';
        knobHead.className='knobHead';
        knobHeadDot.className='knobHeadDot';
        knobVal.className='knobVal';



        knob.appendChild(knobHead);
        knob.appendChild(knobVal);
        knobHead.appendChild(knobHeadDot);

        knobHeadDot.setAttribute("val",val);
        knob.setAttribute("label",label);

        const observer = new MutationObserver(function(muts){
            muts.forEach(function(mut){                
                if (mut.type=="attributes" && mut.attributeName=="val") {                    
                    const dot = mut.target;
                    const val = dot.getAttribute(mut.attributeName);
                    let offset = parseInt(dot.getAttribute("offset"));
                    if (Number.isNaN(offset)) offset=0;
                    
                    dot.style = 'transform: rotate('+val+'deg);'
                    const hue=180-val/2;
                    dot.parentElement.parentElement.style= '--bck:'+hue;
                    const valElement = dot.parentElement.parentElement.children[1];
                    valElement.innerText=((val-31)/10)+offset;
                    valElement.style.opacity='1';
                    setTimeout(function(e){e.style.opacity='0';},1000,valElement);                
                }
            })
        })        
            
        observer.observe(knobHeadDot, {attributes:true});
        knobHeadDot.setAttribute('val',knobHeadDot.getAttribute("val"));

        knobHead.addEventListener('wheel',function(e){            
            const direction = e.deltaY>0?1:-1;  
            const dot=knobHead.children[0];      
            let val=parseInt(dot.getAttribute("val"));
            if (direction<0 && val==31) return;
            if (direction>0 && val==331) return;
            dot.setAttribute("val",val+10*direction);             
            e.bubbles=false;
            e.preventDefault;                  
        })

        return knob;
    }

    static val;


}


export default EQKnob; 
