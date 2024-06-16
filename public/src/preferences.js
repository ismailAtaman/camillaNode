
class preferences {
    defaultSettings;

    
    preferenceObject;
    

    constructor() {
        this.loadSettings();
        return this;    
    }

    getDefaults() {
        let tmpPref =  new Object();
        tmpPref["sections"] = {"general":"Generel Preferences","ui":"User Interface Preferences","basic":"Basic Section Preferences","equalizer":"Equalizer Section Preferences"}
        tmpPref["general"] = [
            {"id":"DCProtection",
            "name":"Enable DC Protection",        
            "value":true,
            "type":"boolean",
            "enabled":true,
            },

            {"id":"enableSpectrum",
            "name":"Enable Spectrum Analyzer",        
            "value":true,
            "type":"boolean",
            "enabled":true,
            },       

            {"id":"loadLastOnStartup",
            "name":"Load last config on startup",        
            "value":true,
            "type":"boolean",
            "enabled":true,
            },       

            
        ]

        tmpPref["ui"] = [
            {"id":"defaultPage",            
            "name":"Default page on load",            
            "value":"Equalizer",
            "type":"select",
            "options":{"Connections":"connections","Basic":"basic","Equalizer":"equalizer","Advanced":"advanced","Room EQ":"room","Preferences":"preferences"},            
            "enabled":true,
            },

            {"id":"backgroundHue",
            "name":"Backround hue",
            "value":180,
            "type":"range",        
            "options":{"min":0,"max":330,"step":1},
            "enabled":true,
            "callback":"backgroundHueChange",                                
            },        
        ]

        tmpPref["basic"] = [
            
            {"id":"showBasicSpectrum",
            "name":"Show spectrum analyzer in Basic section",
            "value":false,
            "type":"boolean",                
            "dependsOn":"enableSpectrum",
            "enabled":false,
            },        

            {"id":"subBassFreq",
            "name":"Sub bass knob frequency",
            "value":70,
            "type":"text",                            
            "enabled":true,
            },        

            {"id":"bassFreq",
            "name":"Bass knob frequency",
            "value":200,
            "type":"text",                            
            "enabled":true,
            },        

            {"id":"midsFreq",
            "name":"Mids knob frequency",
            "value":1000,
            "type":"text",                            
            "enabled":true,
            },        

            {"id":"upperMidsFreq",
            "name":"Upper mids knob frequency",
            "value":3000,
            "type":"text",                            
            "enabled":true,
            },        

            {"id":"trebleFreq",
            "name":"Treble frequency",
            "value":8000,
            "type":"text",                            
            "enabled":true,
            },        

            
        ]

        tmpPref["equalizer"] = [
            {"id":"showEqualizerSpectrum",
            "name":"Show spectrum analyzer in Equalizer section",
            "value":true,
            "type":"boolean",            
            "dependsOn":"enableSpectrum",    
            "enabled":false,
            },        

            {"id":"autoPreampGain",
            "name":"Set preamp gain automatically based on filters",
            "value":false,
            "type":"boolean",                        
            "enabled":true,
            },        

            {"id":"peqDualChannel",
            "name":"Seperate filters for Right and Left channels",
            "value":false,
            "type":"boolean",                        
            "enabled":true,
            },        

            {"id":"peqSingleLine",
            "name":"Show PEQ filters in a single line in single channel mode",
            "value":true,
            "type":"boolean",                        
            "enabled":true,
            },        

        ]  
        return tmpPref;
    }


    createPreferencesElements(parentElement) {
        let sectionElement, subElement, subTitleElement, optionElement, lineElement;
        for (let section of Object.keys(this.preferenceObject.sections)) {
            sectionElement=document.createElement("div");
            sectionElement.setAttribute("id",section);
            sectionElement.setAttribute("label",this.preferenceObject.sections[section]);
            sectionElement.className="preferenceSection";
            for (let item of this.preferenceObject[section]) {
                // console.log(section,item);

                // Preference line
                lineElement=document.createElement("div"); 
                lineElement.className = "preferenceItem";

                // Title of the item
                subTitleElement = document.createElement("div");
                subTitleElement.innerText=item.name;
                subTitleElement.className="preferenceName"
                lineElement.appendChild(subTitleElement);

                                
                switch (item.type) {
                    case "boolean":
                        subElement = document.createElement("input");
                        subElement.setAttribute("type","checkbox")
                        subElement.checked = item.value;
                        break;
                    case "select":
                        subElement = document.createElement("select");
                        for (let option of Object.keys(item.options)) {
                            optionElement = document.createElement("option");
                            optionElement.innerText=option;
                            optionElement.setAttribute("value",item.options[option]);
                            subElement.appendChild(optionElement);
                        }
                        break;
                    case "text":
                        subElement = document.createElement("input");
                        subElement.setAttribute("type","text")
                        subElement.value=item.value;
                        subElement.style.width="50px";
                        break;
                    case "range":
                        subElement = document.createElement("input");
                        subElement.setAttribute("type","range")
                        subElement.setAttribute("min",item.options.min);
                        subElement.setAttribute("max",item.options.max);
                        subElement.setAttribute("step",item.options.step);
                        subElement.setAttribute("value",item.value);
                        break;
                }

                subElement.disabled=!item.enabled;                
                subElement.setAttribute("id",item.id);                

                // Process dependency 
                if (item.dependsOn!=undefined) {
                    document.getElementById(item.dependsOn).addEventListener("change",function(){
                        const targetElement = document.getElementById(item.id);
                        if (this.checked==false) targetElement.checked=false;
                        targetElement.disabled = !this.checked;
                    })
                    subElement.disabled = !document.getElementById(item.dependsOn).checked;
                }

                // Process special callback event > calls the function named item.callback 
                if (item.callback!=undefined) subElement.addEventListener("callback",window[item.callback]);                                       
                
                subElement.preferences=this;
                subElement.section=section;
                subElement.addEventListener("change",function(){
                    // console.log("Event default.",item);
                    let value;
                    if (this.type=="checkbox") value=this.checked; else value=this.value;                    
                    this.preferences.applySetting(section,this.id,value)                                         
                    this.preferences.saveSettings();
                    this.dispatchEvent(new Event("callback"));
                    window.parent.activeSettings = window.preferences.getPreferences();
                });
                lineElement.appendChild(subElement);
                sectionElement.appendChild(lineElement);
            }

            parentElement.appendChild(sectionElement);
        }
        return true;
    }

    applySetting(section,setting,value) {       
        // console.log("Apply Setting",section,setting,value)
        this.preferenceObject[section].filter((e)=>e.id==setting)[0].value = value;
        // console.log(this.preferenceObject[section])
    }
    
    getSettingValue(section,setting) {
        this.loadSettings();        
        return this.preferenceObject[section].filter((e)=>e.id==setting)[0].value;
    }

    loadSettings() {
        this.preferenceObject = window.localStorage.getItem("preferences");
        if (this.preferenceObject==undefined || this.preferenceObject==null) this.preferenceObject=this.getDefaults(); else this.preferenceObject=JSON.parse(this.preferenceObject);
        // console.log(this.preferenceObject);
    }

    saveSettings() {
        window.localStorage.setItem("preferences",JSON.stringify(this.preferenceObject))
        return true;
    }

    setSettingValue(setting,value) {
        
    }

    
    reset () {
        this.preferenceObject=this.getDefaults();
        this.saveSettings();
    }

    applyBackgroundHue(document,hue) {
        if (document==null) return;
        document.documentElement.style.setProperty('--bck-hue',parseInt(hue));
        document.documentElement.style.setProperty('--hue-rotate',parseInt(hue)-230+"deg");                        
    }

    getPreferences() {
        let returnObject= new Object();
        
        if (this.preferenceObject.sections==undefined) this.reset()

        for (let section of Object.keys(this.preferenceObject.sections)) {
            for (let item of this.preferenceObject[section]) {                                
                returnObject[item.id]=item.value;
            }
        }
        // console.log("Preferences :",returnObject);
        return returnObject;
    }


}


export default preferences;