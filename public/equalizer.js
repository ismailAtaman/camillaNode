
const MAXDB= 16; // Max +/- db setting for individual filer
const defaultFreqList = [30,100,200,800,1000,2000,4000,6000,8000,12000]

let selectedKnob = null;
let mouseDownY = 0;

async function initEQ() {    

    
    let connectionResult = await connectToDsp();
    if (!connectionResult[0]) {
        displayMessage("Error connecting to server. Please configure server settings and make sure server is running.",{"type":"error"})
        return;
    }
    await updateConfigList();
    downloadConfigFromDSP().then((DSPConfig)=>{        
        let filters = DSPConfig.filters;
        applyFilters(filters);     
    }) 

    setInterval (function(){sendDSPMessage("GetPlaybackSignalRms").then(r=>{
            let levelL=isNaN(r[0])?-100:r[0];
            let levelR=isNaN(r[1])?-100:r[1];          
            
            levelL<-100?levelL=-100:a=1
            levelR<-100?levelR=-100:a=1

            levelL = 100 + levelL
            levelR = 100 + levelR

            // console.log(levelL+' : ' + levelR);
            document.getElementById('levelLBar').style.width=650-(4*levelL)+'px';
            document.getElementById('levelRBar').style.width=650-(4*levelR)+'px';


        })},50)

    sendDSPMessage("GetState").then(r=>{document.getElementById('state').innerText=r});        
    setInterval (function(){sendDSPMessage("GetState").then(r=>{document.getElementById('state').innerText=r} )},5000)      

    const equalizer = document.getElementById('equalizer');
    for (i=0;i<=9;i++) {
        let s = new EQSlider();
        equalizer.appendChild(s);
    }

}

function sliderUpdateVal(slider,val) {
    const sliderKnobHeight = document.getElementsByClassName('slider-container')[0].children[0].children[0].getBoundingClientRect().height;        
    const sliderMax = document.getElementsByClassName('slider-container')[0].getBoundingClientRect().height-sliderKnobHeight/2;

    const sliderKnob = slider.children[0].children[0];            
    const yPos = ((parseFloat(-val)+MAXDB)/(2*MAXDB))*sliderMax;
    
    sliderKnob.style.top=yPos+'px';
    
    let hueAngle = parseInt((sliderMax/2-yPos) * (sliderMax/180));    
    sliderKnob.parentElement.style.filter='hue-rotate('+hueAngle+'deg)';

    // console.log('Val : '+val)            
    // console.log('sliderMax : '+sliderMax)       
    // console.log("Move to : " + yPos);
    // console.log(sliderKnob)
    //slider.dispatchEvent(new Event('change'));    
}

function createFilterArray() {
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
    return filterArray;
}

function uploadClick() {
    let filterArray= createFilterArray()
    //console.log(filterArray);
    uploadConfigToDSP(filterArray).then(displayMessage("Upload successful",{"type":"success"}));
}

async function downloadClick() {
    downloadConfigFromDSP().then((DSPConfig)=>{        
        let filters = DSPConfig.filters;
        applyFilters(filters);        
        console.log("Config download successful.");        
        displayMessage("Download successful");
    }).catch((err)=>{
        console.log("Failed to download config.")
        console.log(err)
    })
}

function applyFilters(filters) {
    i=0;
    const sliders= document.getElementsByClassName('slider-container');
    for (const filterName of Object.keys(filters).sort()) {        
        //console.log(filterName);
        sliders[i].children['freq'].value=filters[filterName].parameters.freq+'hz';
        sliders[i].children['gain'].value=filters[filterName].parameters.gain+'db';
        sliders[i].children['qfact'].value=filters[filterName].parameters.q;            
        sliderUpdateVal(sliders[i],filters[filterName].parameters.gain);            
        i++;
    }
}


function flatten() {
    const sliders = document.getElementsByClassName('slider-container');
    for (i=0;i<sliders.length;i++) {
        sliders[i].children['gain'].value='0db';
        sliderUpdateVal(sliders[i],0);
    }
}

function reset() {
    const sliders = document.getElementsByClassName('slider-container');
    for (i=0;i<sliders.length;i++) {
        sliders[i].children['gain'].value='0db';
        sliders[i].children['qfact'].value='1.4';
        sliders[i].children['freq'].value=defaultFreqList[i % 10]+'hz';
        sliderUpdateVal(sliders[i],0);
    }
}

function compress() {
    const sliders = document.getElementsByClassName('slider-container');
    for (i=0;i<sliders.length;i++) {
        let gain=parseFloat(sliders[i].children['gain'].value.replace('db',''));
        gain==0?gain=0:gain<0?gain++:gain--; 
        if (Math.abs(gain)<1) gain=0;
        sliders[i].children['gain'].value=gain+'db';
        sliderUpdateVal(sliders[i],gain);
    }
}

function saveClick() {    
    let configNameObject = document.getElementById('configName');
    let configName = configNameObject.value.trim();    
    if (configName.length==0) return;
    if (configName.indexOf('/')>-1 || configName.indexOf('\\')>-1) {
        displayMessage("Invalid character in config name.",{"type":"error"})
        return;
    }

    fetch('/configExists?configName='+configName).then((res)=>res.text().then(data=>{
        if (data=='true' && !confirm('Configuration with a same name already exists. Would you like to overwrite?')) return;        

        let filterArray=createFilterArray();      
        saveConfig(({"configName":configName,"filterArray":filterArray}));
        configNameObject.value='';
        updateConfigList();
    }));   
}

function deleteClick() {
    let configNameObject = document.getElementById('configName');
    let configName = configNameObject.value;
    if (configName.length==0) return;

    if (!confirm("Do you want to delete the configuration '"+configName+"'?")) return;
    fetch('/deleteConfig?configName='+configName).then((res)=>updateConfigList());
}

async function updateConfigList() {      
    fetch('/getConfigList').then((res)=>res.json().then(data=>{
        const configList = document.getElementById('configList');
        configList.replaceChildren();

        let savedConfigList = data;
        for (let config of savedConfigList) {
            const div = document.createElement('div');
            div.innerText=config;
            div.classList.add('config');
            
            div.addEventListener('click',function (){                
                document.getElementById('configName').value=this.innerText;
                getConfig(this.innerText).then((config)=>{
                let filterArrayJSON = convertFilterArayToJSON(config.filterArray);            
                applyFilters(filterArrayJSON.filters);
                });
            });
            configList.appendChild(div);
        }
    }))    
}


async function getConfig(configName) {     
    return new Promise ((resolve,reject)=>{
          fetch('/getConfig?configName='+configName).then((res)=>res.json()).then((data)=>{resolve(data)});        
    })    
}

function displayMessage(message,options) {
    if (options==undefined) options={};

    if (options.timeout==undefined) options.timeout=1500;
    if (options.persist==undefined) options.persist=false;
    if (options.type == undefined) options.type="default";

    let messageBox = document.getElementById('messageBox');    
    
    let timeout = options.timeout    
    if (options.type=="error") {
        messageBox.style.backgroundColor='var(--error-background)';
        messageBox.style.color='var(--error-color)';
    }

    if (options.type=="success") {
        messageBox.style.backgroundColor='var(--success-background)';
        messageBox.style.color='var(--success-color)';
    }

    if (options.type=="question") {        
        for (button of options.buttons) {            
            const div = document.createElement('div');
            
            div.className=button.className;
            div.innerText=button.text;
            // div.addEventListener('click',button.clickEvent);            


            messageBox.appendChild(div);         
        }
    }
    
    messageBox.innerText=message;
    messageBox.style.display='block';
    if (!options.persist) setTimeout(function(){messageBox.style.display='none'},timeout)
}

function addBand() {
    let s = new EQSlider();
    document.getElementById('equalizer').appendChild(s);
}


class EQSlider {    

    constructor() {
        let sliderContainer = document.createElement('div');
        let sliderBody = document.createElement('div');
        let sliderKnob = document.createElement('div');

        sliderContainer.className='slider-container';
        sliderBody.className='slider-body';
        sliderKnob.className='slider-knob';
        
        let freq = document.createElement('input');
        freq.type='text';
        freq.className='eqparam';
        freq.value='1000hz'
        freq.id='freq';


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
            this.value=text+'hz';                        
        })

        let gain = document.createElement('input');
        gain.type='text';
        gain.className='eqparam';
        gain.value='0db'
        gain.id='gain';

        let tempGain;

        gain.addEventListener('click',function(){
            tempGain=this.value;
            this.value= this.value.replace('db','');            
        })

        gain.addEventListener('focus',function(){
            tempGain=this.value;
            this.value= this.value.replace('db','');                        
        })
        
        gain.addEventListener('focusout',function(){            
            let text = this.value;               
            if (isNaN(text)) text=tempGain;
            this.value=text+'db';            
        })

        let qfact = document.createElement('input');
        qfact.type='text';
        qfact.className='eqparam';
        qfact.value='1.41';
        qfact.id='qfact';


        let tempqfact;
        
        qfact.addEventListener('focusout',function(){            
            let text = this.value;               
            if (isNaN(text)) text=tempqfact;
            this.value=text;                     
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
       })

       sliderContainer.addEventListener('mouseup',function() {
           selected=false;
       })
       
       sliderContainer.addEventListener('mousemove',function(event) {
            if (selected==false) return;          
            const pos = event.clientY-sliderBody.getBoundingClientRect().top;
            const sliderMax= sliderBody.clientHeight-sliderKnob.clientHeight;
            const yPos = Math.max(0,Math.min(pos,sliderBody.clientHeight-sliderKnob.clientHeight));
            sliderKnob.style.top = yPos+'px';            

            const num = MAXDB-(MAXDB*2*yPos/sliderMax);
            sliderContainer.value = Math.round((num + Number.EPSILON)*10)/10;            
            gain.value = sliderContainer.value+'db';            

            let hueAngle = parseInt((sliderMax/2-yPos) * (sliderMax/180));    
            sliderBody.style.filter='hue-rotate('+hueAngle+'deg)';
       })

       sliderBody.appendChild(sliderKnob);
       sliderContainer.appendChild(sliderBody);
       sliderContainer.appendChild(freq)
       sliderContainer.appendChild(gain)
       sliderContainer.appendChild(qfact)

       let sh = getComputedStyle(document.body).getPropertyValue('--slider-height').replace('rem','');
       sh *= getComputedStyle(document.body).fontSize.replace('px','')/2
       sliderKnob.style.top=sh+'px'
       
       
       return sliderContainer;
    }



}