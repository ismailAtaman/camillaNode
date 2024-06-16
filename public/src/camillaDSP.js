import filter from "/src/filter.js"

const debugLevel = 'low';

class camillaDSP {
    ws;    
    ws_spectrum;
    server;
    port;
    spectrumPort;
    config;
    connected=false;
    spectrum_connected=false;
    
    subBassFreq=50;
    bassFreq=200;
    midsFreq=1000;
    upperMidsFreq=3000;
    trebleFreq=8000;

    DCProtectionFilter = {"__DCProFilter":{"type":"Biquad","description":"DC Protection Filter","parameters":{"type":"Highpass","freq":5,"q":1}}};
    Limiter = {"__Limiter":{"type":"Limiter","parameters":{"clip_limit":-3}}};
    defaultMixer = {"recombine":{
        "description":"CamillaNode Default Mixer",
        "channels":{"in":2,"out":2},
        "mapping":[
            {"dest":0,"sources":[{"channel":0,"gain":0,"inverted":false,"mute":false,"scale":"dB"},{"channel":1,"gain":0,"inverted":false,"mute":true,"scale":"dB"}],"mute":false},
            {"dest":1,"sources":[{"channel":1,"gain":0,"inverted":false,"mute":false,"scale":"dB"},{"channel":0,"gain":0,"inverted":false,"mute":true,"scale":"dB"}],"mute":false}
            ]
        }
    };     
     
    defaultPipeline = [
        {          
            "type": "Mixer",
            "name": "recombine",
            "description": "CamillaNode Default Mixer",
            "bypassed": false
        },
        {
            "type": "Filter",
            "channel": 0,
            "names": [],
            "description": "Channel 0 Filters",
            "bypassed": false
        },
        {
            "type": "Filter",
            "channel": 1,
            "names": [],
            "description": "Channel 1 Filters",
            "bypassed": false
        }
    ]

    constructor() { 
        return this;        
    }

    async connect(server,port, spectrumPort) {
        if (server==undefined) {
            server = window.localStorage.getItem("server");
            port = window.localStorage.getItem("port");
            spectrumPort= window.localStorage.getItem("spectrumPort");
        }

        if (server==undefined) return false;

        let connect = false;

        await this.connectToDSP(server,port).then((r)=>{ 
            this.ws = r[1];                                    
            this.server=server;
            this.port=port;           
            console.log("Connected to DSP. Trying spectrum now..") 
            this.connected=true;        
            connect=true;

        }).catch((e)=>{
            console.error("Connection error");
            console.error(e);                        
            connect=false;
        });        

        if (connect) {
            connect = await this.connectToDSP(server,spectrumPort).then(p=>{                
                this.ws_spectrum=p[1];
                this.spectrumPort=spectrumPort;
                console.log("Connected to spectrum.") 
                this.spectrum_connected=true;                
                return true;
            }).catch(f=>{
                console.error("Error connecting to spectrum error");
                console.error(f);                
                return false;
            })            
        }

        let initSuccess = await this.initAfterConnection();
        if (initSuccess==undefined || initSuccess==false) { console.log("Configuration initialization failed!"); return false}
        
        this.connected=connect;
        return connect;

    }

    async initAfterConnection() {
        // Download and initialize configuration                
        await this.downloadConfig();
        this.config = this.getDefaultConfig(this.config);                                 
        return true;
    }

    connectToDSP(server,port) {        
             
        
        return new Promise((resolve,reject)=>{        
            if (server==undefined) {
                console.error("No server string specified")
                reject();
                return;
            }   
            let WS = new WebSocket("ws://"+server+":"+port);
            WS.addEventListener('open',function(){                            
                resolve([true,WS]);
            })
            let errorListener = WS.addEventListener('error',function(m){
                WS.removeEventListener('error',errorListener);
                reject([false,m]);
            })
        })
    }

    static handleDSPMessage(m) {        
        const res = JSON.parse(m.data);                           
           
        const responseCommand = Object.keys(res)[0];
        const result = res[responseCommand].result;
        const value =  res[responseCommand].value;        
    
        switch (responseCommand) {
            case 'GetVersion':
                if (result=='Ok') return [true,value]; else return[false,value];            
                break;
            case 'GetConfigJson':
                if (result=='Ok') return [true,JSON.parse(value)]; else return[false,value];          
                break;                    
            case 'SetConfigJson':                
                if (result=='Ok') return [true,true]; else return[false,value];          
                break;
            case 'GetState':
                if (result=='Ok') return [true,value]; else return[false,value];          
                break;
            case "GetPlaybackSignalPeak":
                if (result=='Ok') return [true,value]; else return[false,value];          
                break;
            case "GetPlaybackSignalRms":
                if (result=='Ok') return [true,value]; else return[false,value];           
                break; 
            case "GetPlaybackSignalPeakSinceLast":
                if (result=='Ok') return [true,value]; else return[false,value];           
                break; 
                              
            case "SetUpdateInterval":
                if (result=='Ok') return [true,value]; else return[false,value];           
                break;                
            case "GetClippedSamples":
                if (result=='Ok') return [true,value]; else return[false,value];           
                break;                
            case "GetVolume":            
                if (result=='Ok') return [true,value]; else return[false,value];           
                break;         
            case "SetVolume":            
                if (result=='Ok') return [true,value]; else return[false,value];           
                break;     
            case "GetCaptureRate":            
                if (result=='Ok') return [true,value]; else return[false,value];           
                break;      
            case "GetProcessingLoad":            
                if (result=='Ok') return [true,value]; else return[false,value];           
                break;           
            case "ResetClippedSamples":            
                if (result=='Ok') return [true,value]; else return[false,value];           
                break;                           
            default:
                console.log("Unhandled message received from DSP : "+responseCommand);
                if (result=='Ok') return [true,value]; else return[false,value];                        
        }
    
    }
    
    sendDSPMessage(message) {        
        return new Promise((resolve,reject)=>{            
            this.ws.addEventListener('message',function(m){                           
                const res = JSON.parse(m.data);
                const responseCommand = Object.keys(res)[0];
                if (typeof message == 'object') message=Object.keys(message)[0];
                // console.log("Response: ",res,"Response Command",responseCommand, " Message :" , message, "Correct Event :",message==responseCommand);
                       
                if (message!=responseCommand) return;    
                let handleResult = camillaDSP.handleDSPMessage(m);                
                if (handleResult[0]) resolve(handleResult[1]); else reject(handleResult[1]);                
                // this.removeEventListener('message',eventListener);                
            });            

            this.ws.send(JSON.stringify(message));             
        })     
    }   

    sendSpectrumMessage(message) {        
        return new Promise((resolve,reject)=>{            
            let eventListener = this.ws_spectrum.addEventListener('message',function(m){
                const res = JSON.parse(m.data);
                const responseCommand = Object.keys(res)[0];
                if (message!=responseCommand) return;
    
                let handleResult = camillaDSP.handleDSPMessage(m);
                if (handleResult[0]) resolve(handleResult[1]); else reject(handleResult[1]);

                this.removeEventListener('message',eventListener);
            });

            this.ws_spectrum.send(JSON.stringify(message));             
        })     
    }   

/******************************************* End of WS message exchange  **********************************************************/

    uploadConfig() {         
        let validConfig = this.validateConfig()        
        if (!validConfig) {
            console.error(">>>>>>>>>>>>>>>>>>>>>>> Invalid configuration! <<<<<<<<<<<<<<<<<<<<<<<<<<<<")
            return false;
        }
        if (debugLevel=='high') console.log("Upload >>> ",this.config);

        this.cleanFilters();

        return new Promise((res,rej)=>{
            this.sendDSPMessage({"SetConfigJson":JSON.stringify(this.config)}).then(r=>{
                res(true);                
            }).catch(e=>{
                console.error("Error in upload config. >> ",this.config);
                rej(false);
            });
        })
    }

    downloadConfig() {
        return new Promise((res,rej)=>{
            this.sendDSPMessage("GetConfigJson").then(r=>{                
                this.config=r;    
                res(true);
            }).catch(e=>{
                console.error("Error in config download from DSP >> ", e);
                rej(false);
            });
        })        
    }

    validateConfig() {
        // check if mixers in pipeline are defined
        let mixers =  this.config.pipeline.filter(e=>e.type=="Mixer")
        for (let i=0;i<mixers.length;i++) {
            let exists = this.config.mixers[mixers[i].name];
            // console.log("Mixer <",mixers[i].name,"> exists?",exists);
            if (!exists) {
                console.log("Validation Error : Mixer  <",mixers[i].name,"> exists >>",exists);
                return false;

            }
        }

        // Check if filters in pipeline exists in filters
        let filters =  this.config.pipeline.filter(e=>e.type=="Filter")        
        for (let i=0;i<filters.length;i++) {
            // console.log(filters[i].names)
            for (let filter of filters[i].names) {
                let exists = this.config.filters[filter]!=undefined;
                // console.log("Filter  <",filter,"> exists?",exists);
                if (!exists) {
                    console.log("Validation error : Filter  <",filter,"> exists >>",exists);
                    return false;
                }
            }            
        }
        
        return true;
        
    }

    // loadFilters() {
    //     this.filters={};
    //     let channelCount=this.getChannelCount();
    //     for (let channelNo=0;channelNo<channelCount;channelNo++) {
    //         let filterList = this.getChannelFiltersList(channelNo);
    //         for (let filterName of filterList) this.createFilter(filterName,channelNo)                        
    //     }        

    //     this.pipeline=this.config.pipeline;
    // }

    createFilter(filterName,channelNo) {
        let newFilter = new filter(filterName,this.config.filters[filterName]);
        newFilter.DSP=this;
        newFilter.channel=channelNo;                
        // this.filters[filterName]=newFilter;          
        return newFilter;
    }

    createNewFilter(filterObject,channelNo) {        
        this.addFilter(filterObject,channelNo);
        let filterName = Object.keys(filterObject)[0];
        return this.createFilter(filterName,channelNo);
    }

    clearFilters() {                
        let channelCount=this.getChannelCount();
        for (let filterName of Object.keys(this.config.filters)) {                                                
            for (let channel=0;channel<channelCount;channel++) {                                                      
                // if (!clearAll && filterName.startsWith("__")) continue;
                this.removeFilterFromChannelPipeline(filterName,channel);  
            }               
        }
    }

    addFilters(filterList,channel) {        
        if (channel==undefined) {
            let channelCount=this.getChannelCount();
            for (let channel=0;channel<channelCount;channel++) {
                let filterNameList = Object.keys(filterList);
                for (let filterName of filterNameList) {
                    let filter = {}
                    filter[filterName]=filterList[filterName];
                    // console.log(" >> ",filter ,channel)                    
                    this.addFilter(filter,channel);
                }
            }
        } else {
            let filterNameList = Object.keys(filterList);
            for (let filterName of filterNameList) {
                let filter = {}
                filter[filterName]=filterList[filterName];                
                this.addFilter(filter,channel);                
            }
        }
    }

    addFilterToAllChannels(filterJSON) {    
        let channelCount=this.getChannelCount();
        for (let channel=0;channel<channelCount;channel++) {
            this.addFilter(filterJSON,channel)
        }
    }

    addFilter(filterJSON,channelNo) {            
        Object.assign(this.config.filters,filterJSON);        
        this.addFilterToChannelPipeline(filterJSON,channelNo)        
        return true;
    }

    addFilterToChannelPipeline(filter,channelNo) {
        let pipe  = this.config.pipeline.filter(function(e){ return (e.type=="Filter" && e.channel==channelNo)})[0];
        let pipeIndex = this.config.pipeline.indexOf(pipe);    
        let filterName = Object.keys(filter)[0]        
        if (!pipe.names.includes(filterName)) pipe.names.push(filterName);
        this.config.pipeline[pipeIndex] = pipe;        
        // console.log("Filter added to pipeline",filter,channelNo,pipe)
    }   
    
    removeFilterFromChannelPipeline(filterName,channelNo) {
        // removed FilterName filter from channelNo channel pipeline. If filter is no pipeline, removes filter
        let pipe  = this.config.pipeline.filter(function(e){ return (e.type=="Filter" && e.channel==channelNo)})[0];
        let pipeIndex = this.config.pipeline.indexOf(pipe);              
        
        let elementIndex = pipe.names.indexOf(filterName); 
        if (elementIndex==-1) {
            console.log("Filter to be removed not found in channel pipeline.",filterName,channelNo)
            return;
        }

        pipe.names.splice(elementIndex,1);        
        this.config.pipeline[pipeIndex] = pipe;        

        if (!this.isFilterInPipeline(filterName)) {
            if (debugLevel=='high') console.log(">>> Filter '", filterName,"' does not exists in any pipeline. Deleting filter.")
            delete this.config.filters[filterName];
        } 
    }

    removeFilter(filterName) {
        let channelCount = this.getChannelCount();
        for (let channel=0;channel<channelCount;channel++) {
            this.removeFilterFromChannelPipeline(filterName,channel);
        }

    }

    isFilterInPipeline(filter) {
        
        let channelCount = this.getChannelCount();
        let filterName=typeof(filter)=="Object"?Object.keys(filter)[0]:filter;
        for (let channel=0;channel<channelCount;channel++) {
            let pipe  = this.config.pipeline.filter(function(e){ return (e.type=="Filter" && e.channel==channel)})[0];
            if (pipe.names.includes(filterName)) return true;
        }

        return false;
    }

    getDefaultFilter() {
        let filterName ="F"+new Date().getTime().toString().substring(8)
        let filter = {}
        filter[filterName] = {"type":"Biquad","parameters":{"type":"Peaking","freq":3146,"gain":0,"q":1.41}};
        return filter;
    }

    getDefaultConfig(config) {        
        let defaultConfig={}
        defaultConfig.devices = config.devices;                        
        if (config.filters==null || config.filters==undefined) config.filters={};

        if (Object.keys(config.filters).length>0) {
            defaultConfig.filters = config.filters;
            defaultConfig.mixers = config.mixers;
            defaultConfig.pipeline=config.pipeline;
        } else {
            defaultConfig.filters={};            
            defaultConfig.mixers=this.defaultMixer;
            defaultConfig.pipeline=this.defaultPipeline;
        }
        
        defaultConfig.processors={};        
        return defaultConfig;
    }
    
    splitFiltersToChannels() {        
        let filters = this.config.filters;

        this.config.filters={};
        this.config.pipeline=this.defaultPipeline;

        let channelCount = this.getChannelCount();
        for (let filterName of Object.keys(filters)) {                                                
            for (let channel=0;channel<channelCount;channel++) {              
                let filterObject={};
                if (filterName.startsWith("__") || filterName=="Gain") {
                    filterObject[filterName]=filters[filterName]; 
                    this.addFilter(filterObject,channel);                                                 
                } else {                     
                    filterObject[filterName+"__c"+channel]=filters[filterName];                    
                    this.addFilter(filterObject,channel);                                    
                    this.removeFilterFromChannelPipeline(filterName,channel);  
                }

                // if (debugLevel=='high') console.log("Split filters : ",filterName," >>> ", Object.keys(filterObject)[0],channel);
                
                
            }               
        }
        
        if (debugLevel=="high") console.log("Split filters\t:",this.config.filters,"\nSplit pipeline\t:",this.config.pipeline);                     
    }

    mergeFilters() {                  
        // simple version : take common filters and add filters for channel_0 for all channels        
        let filters = this.config.filters;
        let pipeline =  this.config.pipeline;

        this.config.filters={};
        this.config.pipeline=this.defaultPipeline;

               
        let channelFilters = pipeline.filter(e=>e.type=="Filter" && e.channel==0)[0].names;
        // console.log("Merge channel filters :",channelFilters);

        let totalArray = channelFilters; //.concat(channelFilters)

        console.log("mergeFilters > Channel filters : ",totalArray)

        for (let f of totalArray) {                                    
            if (f.startsWith("__")) {                
                let tmpFilter={}            
                tmpFilter[f]=filters[f];
                this.addFilterToAllChannels(tmpFilter);   
                continue;
            } 
            let tmpFilter={}            
            let filterName= f.split("_")[0];
            // console.log("Merging >> ",f,filterName)
            tmpFilter[filterName]=filters[f];
            this.addFilterToAllChannels(tmpFilter);   
                             
            this.removeFilter(f);
            this.removeFilter(f.replace("_c0","_c1"));            
        }


        let validConfig = this.validateConfig()        
        // console.log("Valid after merge?", validConfig);

        if (debugLevel=="high") console.log("Merged filters >>> ",this.config," Valid? ",validConfig);          
        return validConfig;
    }

    isSingleChannel() {
        // console.log("Single check pipeline",this.config.pipeline);
        let channelCount = this.getChannelCount();        

        let ret = true;
        for (let channel=0;channel<channelCount-1;channel++) {
            let pipe = this.config.pipeline.filter(e=>e.type=="Filter" && e.channel==channel)[0];
            let nextPipe = this.config.pipeline.filter(e=>e.type=="Filter" && e.channel==channel+1)[0];
            if (pipe.names.length!=nextPipe.names.length) {
                // if (debugLevel=="high") console.log("Single channel check : pipeline length mismatch!");
                return false;
                break;
            }

            for (let i=0;i<pipe.names.length;i++) {
                if (!nextPipe.names.includes(pipe.names[i])) {
                    // if (debugLevel=="high")  console.log(pipe.names[i]," not found!");
                    ret= false;
                    return false;
                }
                // if (debugLevel=="high")  console.log(pipe.names[i]," : ", nextPipe.names.includes(pipe.names[i]))
            }
        }

        return true;
    }

    setBalance(bal) {
        this.config.mixers.recombine.mapping[0].sources[0].gain = -bal
        this.config.mixers.recombine.mapping[1].sources[0].gain = bal        
    }

    getBalance() {        
        return this.config.mixers.recombine.mapping[1].sources[0].gain;
    }

    setTone(subBass, bass, mids, upperMids, treble) {        
        // Multi channel
        if (DSP.config.filters["__subBass"]==undefined) {
            const subBassFilter ={"__subBass":camillaDSP.createPeakFilterJSON(this.subBassFreq,subBass,0.7)};
            const bassFilter = {"__bass":camillaDSP.createPeakFilterJSON(this.bassFreq,bass,1.41)};
            const midsFilter = {"__mids":camillaDSP.createPeakFilterJSON(this.midsFreq,mids,1.41)};
            const upperMidsFilter = {"__upperMids":camillaDSP.createPeakFilterJSON(this.upperMidsFreq,upperMids,1.41)};
            const trebleFilter = {"__treble":camillaDSP.createPeakFilterJSON(this.trebleFreq,treble,0.7)};
            

            this.addFilterToAllChannels(subBassFilter)                          
            this.addFilterToAllChannels(bassFilter)       
            this.addFilterToAllChannels(midsFilter)       
            this.addFilterToAllChannels(upperMidsFilter)       
            this.addFilterToAllChannels(trebleFilter)        

            this.config.filters["__subBass"].parameters.type="Lowshelf";
            this.config.filters["__treble"].parameters.type="Highshelf";

            return;
        }
        
        this.config.filters["__subBass"].parameters.gain=subBass;
        this.config.filters["__bass"].parameters.gain=bass;
        this.config.filters["__mids"].parameters.gain=mids;
        this.config.filters["__upperMids"].parameters.gain=upperMids;
        this.config.filters["__treble"].parameters.gain=treble;  
        return this.config;
    }

    setCrossfeed(crossfeedVal) {
        if (crossfeedVal<=-15) {
            this.config.mixers.recombine.mapping[0].sources[1].mute = true;   
            this.config.mixers.recombine.mapping[1].sources[1].mute = true;
        } else {
            this.config.mixers.recombine.mapping[0].sources[1].mute = false;   
            this.config.mixers.recombine.mapping[1].sources[1].mute = false;

            this.config.mixers.recombine.mapping[0].sources[1].gain = crossfeedVal;   
            this.config.mixers.recombine.mapping[1].sources[1].gain = crossfeedVal;
        }

        // console.log(config.mixers.recombine.mapping)        
    }

    getCrossfeed() {        
        if (this.config.mixers.recombine.mapping[0].sources[1].mute == true) return -15; 
        else return this.config.mixers.recombine.mapping[0].sources[1].gain;
    }
    
    static createPeakFilterJSON(freq,gain,q) {         
        return {"type":"Biquad","parameters":{"type":"Peaking","freq":freq,"gain":gain,"q":q}};                
    }        

    async getSpectrumData() {
        return await this.sendSpectrumMessage("GetPlaybackSignalPeak");
    }

    // filterToJSON(filter) {                        
    //     let tmpObj = new Object();        
        
    //     if (filter.enabled) gain=0;

    //     if (filter.type=="Gain") {
    //          tmpObj={"type":"Gain","parameters":{"gain":filter.gain,"inverted":false,"scale":"dB"}};
    //      } else {
    //         tmpObj={"type":"Biquad","parameters":{"type":filter.type,"freq":filter.freq,"gain":filter.gain,"q":filter.q}};       
    //      }
    //     //  console.log("json",tmpObj)    
    //     return tmpObj;
    // }

    convertConfigToText() {        
               
        let configText=[], lastLine=1;        
        // let localFilters = [];
        // Object.keys(this.config.filters).forEach(f=>{localFilters.push(this.config.filters[f])})

        let filterKeys=this.getFilterListByFreq();                
        for (let filter of filterKeys) {
            console.log(this.config.filters[filter].type)
            if (this.config.filters[filter].type=="Gain") {
                configText[0]="Preamp: "+this.config.filters[filter].parameters.gain+" dB\n";
            } else {
                if (filter.startsWith("__")) continue;
                let gainText= this.config.filters[filter].parameters.gain;
                let qText = this.config.filters[filter].parameters.q;
                let freqText = this.config.filters[filter].parameters.freq;
                let onOffText = this.config.filters[filter].parameters.gain==0?"OFF":"ON";
                let typeText = this.config.filters[filter].parameters.type=="Peaking"?"PK":this.config.filters[filter].parameters.type=="Lowshelf"?"LSC":"HSC";
                configText[lastLine]="Filter "+lastLine+": "+onOffText+" "+typeText+" Fc "+freqText+" Hz Gain "+gainText+" dB Q "+qText+"\n";
                lastLine++;
            }            
        }
        return configText.toString().replaceAll(',','');
    }
 
    getFilterListByFreq() {        
        // create an arry
        let filterArray =[];
        for (let filterName of Object.keys(this.config.filters)) filterArray.push({"name":filterName,"freq":this.config.filters[filterName].parameters.freq});        

        // sort
        filterArray = filterArray.sort((a,b)=>a.freq > b.freq).map(e=>e.name);        
        // console.log("Sorted filters ",filterArray)
        return filterArray;
        
        
    }

    linearizeConfig() {    
        // Breakdown config into channel pipelines
        

        let inChannels = this.config.mixers[Object.keys(this.config.mixers)[0]].channels.in;
        let outChannels = this.config.mixers[Object.keys(this.config.mixers)[0]].channels.out;    
        const channelCount = Math.max(this.config.devices.playback.channels,this.config.devices.capture.channels,inChannels,outChannels);

        let channels=[];

        for (let i=0;i<channelCount;i++) {
            channels[i]=new Array();
            channels[i].push({"type":"input","device":this.config.devices.capture});
        }

        let pipeCount=0;

        for (let pipe of this.config.pipeline) {
            

            if (pipe.type=="Mixer") {
                let mixer = this.config.mixers[pipe.name];
                for (let map of mixer.mapping) {                    
                    channels[map.dest].push({"type":"mixer","sources":map.sources});
                }
            }

            if (pipe.type=="Filter") {
                for (let filterName of pipe.names) {
                    let filter = this.config.filters[filterName];
                    let filterObject={}
                    filterObject["type"]  = "filter";
                    filterObject[filterName]=filter;
                    channels[pipe.channel].push(filterObject);
                }
            }
            pipeCount++;
        }

        for (let i=0;i<channelCount;i++) {         
            channels[i].push({"type":"output","device":this.config.devices.playback});
        }

        // console.log("Linearized channels : ",channels);
        return channels;        
    }

    getChannelCount() {
        // if (this.config.mixers == undefined) this.config.mixers=this.defaultMixer;

        let inChannels = this.config.mixers[Object.keys(this.config.mixers)[0]].channels.in;
        let outChannels = this.config.mixers[Object.keys(this.config.mixers)[0]].channels.out;    
        return Math.max(this.config.devices.playback.channels,this.config.devices.capture.channels,inChannels,outChannels);

    }

    getChannelFiltersList(channelNo) {
        let pipe =  this.config.pipeline.filter(function(e){ return (e.type=="Filter" && e.channel==channelNo)})[0];
        if (pipe!=undefined) return pipe.names; else return [];
    }

    _validateConfig() {
        // upload config 
        // convert to yaml at server
        // run validate
        // return result
    }

    cleanFilters() {
        // Changes to string booleans to boolean and string numbers to numbers
        let filterList = Object.keys(this.config.filters);
        // console.log("Filterlist ",filterList)
        for (let filterName of filterList) {
            // console.log("Filter name : ",filterName)
            let paramList = Object.keys(this.config.filters[filterName].parameters);
            // console.log("Param list : ",paramList)
            for (let paramName of paramList) {
                let val = this.config.filters[filterName].parameters[paramName];
                if (val==null) continue;
                if (isBoolean(val)) this.config.filters[filterName].parameters[paramName]=Boolean(val);
                if (isNumber(val)) this.config.filters[filterName].parameters[paramName]=parseFloat(val);
                if (val=="on") this.config.filters[filterName].parameters[paramName]=true;
                if (val=="off") this.config.filters[filterName].parameters[paramName]=false;

                // console.log("Name : ", paramName,"\tValue : ", val, "\tBool :",isBoolean(val),"\tNumber :",isNumber(val))
            }
        }

        function isBoolean(valueToCheck) {
            return valueToCheck==true?true:valueToCheck==false?true:valueToCheck=="true"?true:valueToCheck=="false"?true:false;
        }

        function isNumber(valueToCheck) {
            return !isNaN(parseFloat(valueToCheck));
        }

    }
}

export default camillaDSP;
