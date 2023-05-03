
let selectedKnob = null;
let mouseDownY = 0;

function initEQ() {

    const config = window.localStorage.getItem("Config")
    if (config==null) {
        console.log("No configuration found.");        
        window.location.href='/server';
        sConfig = {
            "server":"192.168.50.74",
            "port" : 1234,
        };
        window.localStorage.setItem("Config",JSON.stringify(sConfig));

    } else {
        
        const sConfig = JSON.parse(config);
        //console.log(sConfig);
        server = sConfig.server;
        port = sConfig.port;
    }

    ws = new WebSocket("ws://"+server+":"+port);
    
    ws.addEventListener("error", (e) => {
        if (!connected && e.type=='error') {
            console.log('Can not connect to server.')
        }    

    });

    ws.addEventListener("open", (event) => {
        connected=true;
        console.log("Connected");        
    });
    
    ////////////////////////////////////////////////////////////////////////////////////////////

    

    const sliders = document.getElementsByClassName('slider-container');

    for (i=0;i<sliders.length;i++) {
        //console.log("Doing slider "+ i);             

        const slider = sliders[i]
        const sliderBody = slider.children[0];
        const sliderKnob = sliderBody.children[0];

        const freq= slider.children[1]
        const gain= slider.children[2]
        const qfact= slider.children[3]


        const sliderTop = parseInt(sliderBody.getBoundingClientRect().top);
        const sliderHeight = sliderBody.getBoundingClientRect().bottom - sliderTop;
        const sliderKnobHeight = sliderKnob.getBoundingClientRect().bottom - sliderKnob.getBoundingClientRect().top;
        const sliderMax = sliderHeight-sliderKnobHeight/2;

        sliderKnob.style.top=(sliderMax)/2+'px';

        document.addEventListener('mouseup',function() {
            selectedKnob=null;
        })
        
        sliderKnob.addEventListener('mousedown',function() {
            selectedKnob=this;
        })

        sliderKnob.addEventListener('mouseup',function() {
            selectedKnob=null;
        })

        slider.addEventListener('mouseup',function() {
            selectedKnob=null;
        })
        
        slider.addEventListener('mousemove',function(event) {
            if (selectedKnob==null) return;
            sliderUpdatePos(slider,event.clientY);
        })

        slider.addEventListener('change',function(){
            const freq= this.children[1]
            const gain= this.children[2]
            const qfact= this.children[3]

            gain.innerText=this.value+'db';
            let filterIndex=-1;

            const sliderList = document.getElementsByClassName('slider-container')
            for (i=0;i<sliderList.length;i++) {
                if (sliderList[i]==this) filterIndex=i; 
            }            
            let filterName = "Filter_"+filterIndex;
            
            const sliderJSON = new Object();
             sliderJSON[filterName] = {
                "type": "Biquad",
                "parameters": {
                  "type": "Peaking",
                  "freq": parseFloat(freq.value),
                  "q": parseFloat(qfact.value),
                  "gain": parseFloat(gain.value),
                }
              }            
            //console.log(sliderJSON)
        })       

        function sliderUpdatePos(slider,mouseY) {
            const yPos = Math.min(sliderMax, Math.max(0,mouseY- sliderTop- sliderKnobHeight/2));
            selectedKnob.style.top = yPos+'px';
            const num = 12-(24*yPos/sliderMax);
            slider.value = Math.round((num + Number.EPSILON)*10)/10;            
            gain.value = slider.value+'db';
            slider.dispatchEvent(new Event('change'));     
        }

        function sliderUpdateVal(slider,val) {
            const sliderKnob = slider.children[0].children[0];            
            const yPos = ((parseFloat(-val)+12)/24)*sliderMax;
            // console.log('Val : '+val)            
            // console.log('sliderMax : '+sliderMax)       
            // console.log("Move to : " + yPos);
            sliderKnob.style.top=yPos+'px';
            slider.dispatchEvent(new Event('change'));    
        }

        let tempFreq;

        freq.addEventListener('click',function(){
            tempFreq=this.value;
            this.value= this.value.replace('hz','');            
            
        })

        freq.addEventListener('focus',function(){
            tempFreq=this.value;
            this.value= this.value.replace('hz','');                        
        })
        
        freq.addEventListener('focusout',function(){            
            let text = this.value;               
            if (isNaN(text)) text=tempFreq;
            this.value=text;
            this.value=text+'hz';            
            slider.dispatchEvent(new Event('change'));    
        })

        let tempgain;

        gain.addEventListener('click',function(){
            tempgain=this.value;
            this.value= this.value.replace('db','');            
        })

        gain.addEventListener('focus',function(){
            tempgain=this.value;
            this.value= this.value.replace('db','');            
            this.contentEditable='true';
        })
        
        gain.addEventListener('focusout',function(){            
            let text = this.value;               
            if (isNaN(text)) text=tempFreq;
            this.value=text;
            this.value=text+'db';            
            // console.log("Gain Value : " +this.value)
            sliderUpdateVal(this.parentElement,text);
            
        })

        let tempqfact;

        qfact.addEventListener('click',function(){
            tempqfact=this.value;     
            this.contentEditable='true';
        })

        qfact.addEventListener('focus',function(){
            tempqfact=this.value;
            this.value= this.value.replace('hz','');            
            this.contentEditable='true';
        })
        
        qfact.addEventListener('focusout',function(){            
            let text = this.value;   
            console.log(text);  
            if (isNaN(text)) text=tempFreq;
            this.value=text;               
            slider.dispatchEvent(new Event('change'));                       
        })
    }


}


function uploadClick() {
    let filterArray=new Array();
    const sliders = document.getElementsByClassName('slider-container');
    for (i=0;i<sliders.length;i++) {
        let filter = new Object()
        filter['Filter'+i] = {
            "freq"  : parseFloat(sliders[i].children['freq'].value.replace('hz','')),
            "gain"  : parseFloat(sliders[i].children['gain'].value.replace('db','')),
            "q"     : parseFloat(sliders[i].children['qfact'].value)
        }
        filterArray.push(filter);
    }
    //console.log(filterArray);
    uploadConfigToDSP(filterArray)
}

function downloadClick() {
    downloadConfigFromDSP().then((DSPConfig)=>{
        //console.log(DSPConfig)
        let filters = DSPConfig.filters;
        i=0;
        for (const filterName of Object.keys(filters).sort()) {
            const sliders= document.getElementsByClassName('slider-container');

            sliders[i].children['freq'].value=filters[filterName].parameters.freq+'hz';
            sliders[i].children['gain'].value=filters[filterName].parameters.gain+'db';
            sliders[i].children['qfact'].value=filters[filterName].parameters.q;
            
            const sliderKnob = sliders[i].children[0].children[0];            
            const yPos = ((parseFloat(filters[filterName].parameters.q)+12)/24)*190;       
            sliderKnob.style.top=yPos+'px';
            i++;
            
        }
        console.log("Config download successful.");        
    }).catch((err)=>{
        console.log("Failed to download config.")
        console.log(err)
    })
}