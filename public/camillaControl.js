
// load config from local storage
// if no config, ask for server and port
// attempt to connect to server
// if successful display status and version

let server, port;
let connected = false;
let ws;

let DSPConfig;
let DSPDevices;

let selectedKnob = null;
let mouseDownY = 0;

function init() {
    const config = window.localStorage.getItem("Config")
    if (config==null) {
        console.log("No configuration found.");        
        
        sConfig = {
            "server":"192.168.50.74",
            "port" : 1234,
        };
        window.localStorage.setItem("Config",JSON.stringify(sConfig));

    } else {
        
        const sConfig = JSON.parse(config);
        console.log(sConfig);
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
        console.log("connected");
        message="GetConfigJson";
        ws.send(JSON.stringify(message));        
    });

    ws.addEventListener("message", (m) => {

        const res = JSON.parse(m.data);     
        console.log("WS Message Received")
        console.log(res);
        const responseCommand = Object.keys(res);

        if (responseCommand=='GetConfigJson') {      
            
            DSPConfig=JSON.parse(res[Object.keys(res)[0]].value);            
            console.log(DSPConfig)
 
           // message={'SetConfigJson':JSON.stringify(DSPConfig)};
           // ws.send(JSON.stringify(message));       
        }               

    });

    
    ////////////////////////////////////////////////////////////////////////////////////////////

    

    const sliders = document.getElementsByClassName('slider-container');

    for (i=0;i<sliders.length;i++) {
        console.log("Doing slider "+ i);             

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
            console.log(sliderJSON)
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
            updatePipeline()
        })
    }

}


function sendCommand(WSObject,messageObject) {
    ws.send(JSON.stringify(message));
}

function sendCommand() {
    const cmd = document.getElementById('cmd').value;
    ws.send(JSON.stringify(cmd));
}

function updatePipeline() {    
    let pipeline = new Array();

    const sliderList = document.getElementsByClassName('slider-container')
    let filterNames = new Array();
    for (i=0;i<sliderList.length;i++) {
        filterNames.push("Filter_"+i);
    }
    
    channel0 = {
          "type": "Filter",
          "channel": 0,
          "names": filterNames
        }

    channel1 = {
        "type": "Filter",
        "channel": 1,
        "names": filterNames
        }
    pipeline.push(channel0);
    pipeline.push(channel1);    

    console.log(pipeline);
    return pipeline;
        
}

function updateFilters() {
    let filters = new Object();

    const sliderList = document.getElementsByClassName('slider-container')
    for (i=0;i<sliderList.length;i++) {          
        let filterName = "Filter_"+i;                
        filters[filterName] = {
            "type": "Biquad",
            "parameters": {
            "type": "Peaking",
            "freq": parseFloat(sliderList[i].children['freq'].value),
            "q": parseFloat(sliderList[i].children['qfact'].value),
            "gain": parseFloat(sliderList[i].children['gain'].value),
            }
        }            
    }
    console.log(filters)
    return filters;
}

function uploadConfig() {
    //let devices = JSON.parse(DSPConfig[0].value).devices;
    
    let pipeline = updatePipeline();
    let filters = updateFilters();
    DSPConfig.filters=filters;
    DSPConfig.pipeline=pipeline;
    
    console.log(DSPConfig)

    let message={'SetConfigJson':JSON.stringify(DSPConfig)};
    ws.send(JSON.stringify(message));      

}
