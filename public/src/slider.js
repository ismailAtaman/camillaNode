

class EQSlider {


  mousePos;
    selectedGain; 
    constructor() {
        let sliderContainer = document.createElement('div');
        let sliderBody = document.createElement('div');
        let sliderKnob = document.createElement('div');

        sliderContainer.className='slider-container';
        sliderBody.className='slider-body';
        sliderKnob.className='slider-knob';
        
        let freq = document.createElement('input');
        freq.type='text';
        freq.className='eqparam freq';
        freq.value='1,000'
        freq.id='freq';


        let tempFreq;

        freq.addEventListener('click',function(){
            tempFreq=this.value;
            this.value= this.value.replace(',','');            
        })

        freq.addEventListener('focus',function(){
            tempFreq=this.value;
            this.value= this.value.replace(',','');                        
        })
        
        freq.addEventListener('focusout',function(){            
            let text = this.value;               
            if (isNaN(text) || text<0) text=tempFreq;                        
            this.value=  new Intl.NumberFormat('en-US').format(this.value);
            //this.value=text+'Hz';                   
            dispatchEvent(new Event('change'));     
        })

        let gain = document.createElement('input');
        gain.type='text';
        gain.className='eqparam';
        gain.value='0dB'
        gain.id='gain';

        let tempGain;

        gain.addEventListener('click',function(){
            tempGain=this.value;
            this.value= this.value.replace('dB','');            
        })

        gain.addEventListener('focus',function(){
            tempGain=this.value;
            this.value= this.value.replace('dB','');                        
        })
        
        gain.addEventListener('focusout',function(){            
            let text = this.value;               
            if (isNaN(text)) text=tempGain;
            this.value=text+'dB';            
            EQSlider.sliderUpdateVal(sliderContainer,text);
            dispatchEvent(new Event('change'));
        })

        let qfact = document.createElement('input');
        qfact.type='text';
        qfact.className='eqparam';
        qfact.value='1.41';
        qfact.id='qfact';


        let tempQfact;
        
        qfact.addEventListener('focus',function(){         
            tempQfact=this.value;
        })

        qfact.addEventListener('focusout',function(){            
            let text = this.value;               
            if (isNaN(text) || text<=0) text=tempQfact;
            this.value=text;       
            dispatchEvent(new Event('change'));              
       })


       let filterType = document.createElement('select');       
       filterType.className='eqparam';
       filterType.value='Peaking';
       filterType.id='filterType';
       
       let PK = document.createElement('option');
       PK.value="Peaking"; 
       PK.innerText="PK"
       filterType.appendChild(PK)

       let LS = document.createElement('option');
       LS.value="Lowshelf";
       LS.innerText="LS"
       filterType.appendChild(LS)

       let HS = document.createElement('option');
       HS.value="Highshelf";
       HS.innerText="HS"
       filterType.appendChild(HS)

       filterType.addEventListener('change',function(event){            
            this.dispatchEvent(new Event('change'));
       })
    
       const sliderTop = parseInt(sliderBody.getBoundingClientRect().top);
       const sliderHeight = sliderBody.getBoundingClientRect().bottom - sliderTop;
       const sliderKnobHeight = sliderKnob.getBoundingClientRect().bottom - sliderKnob.getBoundingClientRect().top;
       const sliderMax = sliderHeight-sliderKnobHeight/2;
       
       sliderKnob.style.top=(sliderMax)/2+'px';
       
       let selected=false;

       sliderKnob.addEventListener('mousedown',function() {
           selected=true;
       })

       sliderKnob.addEventListener('mouseup',function() {
           selected=false;           
           this.dispatchEvent(new Event('change'));
       })


       sliderContainer.addEventListener('mouseup',function() {
           selected=false;
           this.dispatchEvent(new Event('change'));
       })
       
       sliderContainer.addEventListener('mousemove',function(event) {
            if (selected==false) return;          
            const pos = event.clientY-sliderBody.getBoundingClientRect().top;
            const sliderMax= sliderBody.clientHeight-sliderKnob.clientHeight;
            const yPos = Math.max(0,Math.min(pos,sliderBody.clientHeight-sliderKnob.clientHeight));
            sliderKnob.style.top = yPos+'px';            

            const num = MaxDB-(MaxDB*2*yPos/sliderMax);
            sliderContainer.value = Math.round((num + Number.EPSILON)*10)/10;            
            gain.value = sliderContainer.value+'dB';            

            let hueAngle = parseInt((sliderMax/2-yPos) * (sliderMax/360));    
            if (hueRotate) sliderBody.style.filter='hue-rotate('+hueAngle+'deg)';
            this.dispatchEvent(new Event('change'));
       })

       sliderContainer.addEventListener('wheel',function(e) {
            let dif = e.deltaY<0?0.5:-0.5;                           
            let val=parseInt(10*(parseFloat(gain.value.replace('dB',''))+dif))/10;
            gain.value=val+'dB';
            e.preventDefault();
            EQSlider.sliderUpdateVal(sliderContainer,val);
            this.dispatchEvent(new Event('change'));
       })          

       sliderContainer.addEventListener('contextmenu',function(event){
            event.preventDefault();
            let contextMenu = document.getElementById('EQcontextMenu')
            contextMenu.style.left=event.clientX+ 'px';
            contextMenu.style.top=event.clientY+window.scrollY+'px';
            contextMenu.style.display='block';
            contextSlider=this;
       })

       sliderBody.appendChild(sliderKnob);
       sliderContainer.appendChild(sliderBody);
       sliderContainer.appendChild(freq)
       sliderContainer.appendChild(gain)
       sliderContainer.appendChild(qfact)
       sliderContainer.appendChild(filterType)

       let sh = getComputedStyle(document.body).getPropertyValue('--slider-height').replace('rem','');
       sh *= getComputedStyle(document.body).fontSize.replace('px','')/2
       sliderKnob.style.top=sh+'px';       
       
       return sliderContainer;
    }

}