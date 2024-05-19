import filter from "/src/filter.js"

const debugLevel = 'high';

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
    bassFre=200;
    midsFreq=1000;
    upperMidsFreq=3000;
    trebleFreq=8000;

    DCProtectionFilter = {"__DCProFilter":{"type":"Biquad","description":"DC Protection Filter","parameters":{"type":"Highpass","freq":7,"q":0.7}}};
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
        
        return connect;

    }

    async initAfterConnection() {
        // Download and initialize configuration                
        this.config = await this.sendDSPMessage("GetConfigJson");                
        this.config = this.getDefaultConfig(this.config,true);                                 
        return this.uploadConfig();
    }

    connectToDSP(server,port) {        
        if (server==undefined) {
            console.error("No server string specified")
            return false;
        }        
        let WS = new WebSocket("ws://"+server+":"+port);
        return new Promise((resolve,reject)=>{        
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
    
    async sendDSPMessage(message) {        
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

    async sendSpectrumMessage(message) {        
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

    async uploadConfig() {          
        // lola;              
        if (debugLevel=='high') console.log("Upload >>> ",this.config);
        return await this.sendDSPMessage({"SetConfigJson":JSON.stringify(this.config)});

        // return new Promise(async (res,rej)=>{
        //     let uploadResult = await this.sendDSPMessage({"SetConfigJson":JSON.stringify(this.config)});
        //     if (uploadResult) res(true); else rej(false);
        // })

        // return this.sendDSPMessage({"SetConfigJson":JSON.stringify(this.config)}).then(r=>{
        //     if (debugLevel=='high') console.log("Config uploaded successfully.",this.config);
        //     return true;
        // }).catch(e=>{
        //     console.error("Upload error",this.config);
        //     if (debugLevel=='high') console.log("Error while config being uploaded.",e,this.config);
        //     return false;
        // });        
    }

    async downloadConfig() {
        this.config = await this.sendDSPMessage("GetConfigJson");             
        // this.loadFilters();                
    }

    loadFilters() {
        this.filters={};
        let channelCount=this.getChannelCount();
        for (let channelNo=0;channelNo<channelCount;channelNo++) {
            let filterList = this.getChannelFiltersList(channelNo);
            for (let filterName of filterList) this.createFilter(filterName,channelNo)                        
        }        

        this.pipeline=this.config.pipeline;
    }

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

    clearFilters(clearAll) {                
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

    addFilterToAllChannels(filter) {    
        let channelCount=this.getChannelCount();
        for (let channel=0;channel<channelCount;channel++) {
            this.addFilter(filter,channel)
        }
    }

    addFilter(filter,channelNo) {            
        Object.assign(this.config.filters,filter);        
        this.addFilterToChannelPipeline(filter,channelNo)        
        return true;
    }

    addFilterToChannelPipeline(filter,channelNo) {
        let pipe  = this.config.pipeline.filter(function(e){ return (e.type=="Filter" && e.channel==channelNo)})[0];
        let pipeIndex = this.config.pipeline.indexOf(pipe);    
        let filterName = Object.keys(filter)[0]        
        pipe.names.push(filterName);
        this.config.pipeline[pipeIndex] = pipe;        
        // console.log("Filter added to pipeline",filter,channelNo,pipe)
    }   
    
    removeFilterFromChannelPipeline(filterName,channelNo) {
        // removed FilterName filter from channelNo channel pipeline. If filter is no pipeline, removes filter
        let pipe  = this.config.pipeline.filter(function(e){ return (e.type=="Filter" && e.channel==channelNo)})[0];
        let pipeIndex = this.config.pipeline.indexOf(pipe);              
        
        let elementIndex = pipe.names.indexOf(filterName); 
        if (elementIndex==-1) {
            console.error("Filter to be removed not found in channel pipeline.",filterName,channelNo)
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
            removeFilterFromChannelPipeline(filterName,channel);
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
        let filterName ="F_"+new Date().getTime().toString().substring(7)
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
        let channelCount = this.getChannelCount();
        for (let filterName of Object.keys(this.config.filters)) {                                                
            for (let channel=0;channel<channelCount;channel++) {              
                let filterObject={};
                if (filterName.startsWith("__") || filterName=="Gain") 
                    filterObject[filterName]=this.config.filters[filterName]; 
                    else filterObject[filterName+"__c"+channel]=this.config.filters[filterName];                    
                if (debugLevel=='high') console.log("Split filters : ",filterName," >>> ", Object.keys(filterObject)[0],channel);
                
                this.addFilter(filterObject,channel);                                    
                this.removeFilterFromChannelPipeline(filterName,channel);  
            }               
        }
        if (debugLevel=="high") console.log("Split filters\t:",this.config.filters,"\nSplit pipeline\t:",this.config.pipeline);             
        return channelCount;
    }

    mergeFilters(filters) {                
        // simple version : take common filters and add filters for channel_0 for all channels
        
        let tmpFilters={};
        let commonFilters = Object.keys(filters).filter(function(e){ return !e.includes("_channel_") });
        let channelFilters = Object.keys(filters).filter(function(e){ return e.includes("_channel_0") });
        for (let f of Object.keys(filters)) {                        
            if (commonFilters.includes(f)) tmpFilters[f]=filters[f];
            if (channelFilters.includes(f)) {
                let filterName = f.split("_c")[0];
                tmpFilters[filterName]=filters[f];
                // console.log(f,filterName)
            }
            // console.log("Common check > ",f,commonFilters.includes(f));
        }
        console.log(tmpFilters)
        return tmpFilters;
    }

    isSingleChannel() {
        console.log("Single check pipeline",this.config.pipeline);
        let channelCount = this.getChannelCount();        

        let ret = true;
        for (let channel=0;channel<channelCount-1;channel++) {
            let pipe = this.config.pipeline.filter(e=>e.type=="Filter" && e.channel==channel)[0];
            let nextPipe = this.config.pipeline.filter(e=>e.type=="Filter" && e.channel==channel+1)[0];
            if (pipe.names.length!=nextPipe.names.length) {
                if (debugLevel=="high") console.log("Single channel check : pipeline length mismatch!");
                return false;
                break;
            }

            for (let i=0;i<pipe.names.length;i++) {
                if (!nextPipe.names.includes(pipe.names[i])) {
                    if (debugLevel=="high")  console.log(pipe.names[i]," not found!");
                    ret= false;
                    return false;
                }
                if (debugLevel=="high")  console.log(pipe.names[i]," : ", nextPipe.names.includes(pipe.names[i]))
            }
        }

        return true;
    }


    async setBalance(bal) {
        let config = await this.sendDSPMessage("GetConfigJson");

        config.mixers.recombine.mapping[0].sources[0].gain = -bal
        config.mixers.recombine.mapping[1].sources[0].gain = bal

        await this.sendDSPMessage({'SetConfigJson':JSON.stringify(config)})
    }

    async getBalance() {
        let config = await this.sendDSPMessage("GetConfigJson");
        return config.mixers.recombine.mapping[1].sources[0].gain;
    }

    async setTone(subBass, bass, mids, upperMids, treble) {
        await this.downloadConfig();

        const subBassFilter = camillaDSP.createPeakFilterJSON(this.subBassFreq,subBass,1.41);
        const bassFilter = camillaDSP.createPeakFilterJSON(this.bassFreq,bass,1.41);
        const midsFilter = camillaDSP.createPeakFilterJSON(this.midsFreq,mids,1.41);
        const upperMidsFilter = camillaDSP.createPeakFilterJSON(this.upperMidsFreq,upperMids,1.41);
        const trebleFilter = camillaDSP.createPeakFilterJSON(this.trebleFreq,treble,1.41);
        
        // // Multi channel
        // const channelCount = this.getChannelCount();

        // for (let i=0;i<channelCount;i++) {
        //     this.config.filters["subBass_channel_"+i]=subBassFilter;
        //     this.config.filters["bass_channel_"+i]=bassFilter;
        //     this.config.filters["mids_channel_"+i]=midsFilter;
        //     this.config.filters["upperMids_channel_"+i]=upperMidsFilter;
        //     this.config.filters["treble_channel_"+i]=trebleFilter;                
        // }
        
        // this.config.pipeline=this.updatePipeline(this.config,true);        
        
        this.config.filters["subBass"]=subBassFilter;
        this.config.filters["bass"]=bassFilter;
        this.config.filters["mids"]=midsFilter;
        this.config.filters["upperMids"]=upperMidsFilter;
        this.config.filters["treble"]=trebleFilter;                
        this.config.pipeline=this.updatePipeline(this.config);        
        
        await this.uploadConfig();
        return this.config;
    }

    async setCrossfeed(crossfeedVal) {
        let config = await this.sendDSPMessage("GetConfigJson");

        if (crossfeedVal<=-15) {
            config.mixers.recombine.mapping[0].sources[1].mute = true;   
            config.mixers.recombine.mapping[1].sources[1].mute = true;
        } else {
            config.mixers.recombine.mapping[0].sources[1].mute = false;   
            config.mixers.recombine.mapping[1].sources[1].mute = false;

            config.mixers.recombine.mapping[0].sources[1].gain = crossfeedVal;   
            config.mixers.recombine.mapping[1].sources[1].gain = crossfeedVal;
        }

        // console.log(config.mixers.recombine.mapping)

        return this.sendDSPMessage({'SetConfigJson':JSON.stringify(config)})
    }

    async getCrossfeed() {
        let config = await this.sendDSPMessage("GetConfigJson");        
        if (config.mixers.recombine.mapping[0].sources[1].mute == true) return -15; else return config.mixers.recombine.mapping[0].sources[1].gain;
    }
    
    static createPeakFilterJSON(freq,gain,q) {         
        return {"type":"Biquad","parameters":{"type":"Peaking","freq":freq,"gain":gain,"q":q}};                
    }        
    
    // updatePipeline(config) {

    //     if (this.isSingleChannel==false) {
    //         console.error("Multi-channel mode can not use updatePipeline function.")
    //     }

    //     let pipeline=[];                

    //     for (let mixer in config.mixers) {
    //         pipeline.push({"type":"Mixer","name":mixer});
    //     }
                
    //     let inChannels = config.mixers[Object.keys(config.mixers)[0]].channels.in;
    //     let outChannels = config.mixers[Object.keys(config.mixers)[0]].channels.out;    
    //     const channelCount =  Math.max(config.devices.playback.channels,config.devices.capture.channels,inChannels,outChannels);

    //     for (let i=0;i<channelCount;i++) {
    //         if (config.filters!=undefined) pipeline.push({"type":"Filter","channel":i,"names":Object.keys(config.filters)})
    //     }                    

    //     // console.log(config.pipeline);
    //     return pipeline;
    // }

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

    async convertConfigToText() {        
        this.config = await this.sendDSPMessage("GetConfigJson");                
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



    async linearizeConfig() {    
        // Breakdown config into channel pipelines
        await this.downloadConfig();

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

    validateConfig() {
        // upload config 
        // convert to yaml at server
        // run validate
        // return result
    }
}



export default camillaDSP;



// if (filterName.startsWith("__")) {
//     filterObject[filterName]=this.config.filters[filterName];
// } else {
//     filterObject[filterName+"__c"+channel]=this.config.filters[filterName];
// }

// filterObject={};

// console.log("Split to channel ",channel,filterObject)
// this.addFilters(filterObject,channel);     