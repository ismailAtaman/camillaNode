

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

    constructor() { 
        return this;        
    }

    async connect(server,port, spectrumPort) {
        if (server==undefined) {
            server = window.localStorage.getItem("server");
            port = window.localStorage.getItem("port");
            spectrumPort= window.localStorage.getItem("spectrumPort");
        }

        let connect = await this.connectToDSP(server,port).then((r)=>{ 
            this.ws = r[1];                                    
            this.server=server;
            this.port=port;           
            console.log("Connected to DSP. Trying spectrum now..") 
            this.connected=true;        
            return true;            
        }).catch((e)=>{
            console.error("Connection error");
            console.error(e);                        
            return false;
        });        

        if (connect) {            
            let initSuccess = await this.initAfterConnection();
            console.log("InitSuccess",initSuccess);

            if (initSuccess==undefined || initSuccess==false) { console.log("Configuration initialization failed!"); return false}
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
        return connect;
    }

    async initAfterConnection() {
        // Download and initialize configuration        
        this.config = await this.sendDSPMessage("GetConfigJson");        
        this.config = camillaDSP.getDefaultConfig(this.config,true);    
        this.config.pipeline = this.updatePipeline(this.config);   
        return this.uploadConfig(this.config);
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

    static getDefaultConfig(config, override) {
        if (override==undefined) override=false;

        config.title="CamillaNode 2 Config";
        config.description="Config file is auto-generated by CamillaNode 2";

        if (config.filters==null) config.filters={};
        if (config.mixers==null) config.mixers={};
        if (config.pipeline==null) config.pipeline=[];
        // if (config.processors==null) config.processors={};        

        const mixers = {"recombine":{
            "channels":{"in":2,"out":2},
            "mapping":[
                {"dest":0,"sources":[{"channel":0,"gain":0,"inverted":false,"mute":false},{"channel":1,"gain":0,"inverted":false,"mute":true,"scale":"dB"}],"mute":false},
                {"dest":1,"sources":[{"channel":1,"gain":0,"inverted":false,"mute":false},{"channel":0,"gain":0,"inverted":false,"mute":true,"scale":"dB"}],"mute":false}
                ]
            }
        };          

        if (config.mixers=={}) config["mixers"]= mixers;
        
        if (override) config.mixers=mixers;                    
        return config;
    }

    async uploadConfig(config) {        
        return this.sendDSPMessage({"SetConfigJson":JSON.stringify(config)}).then(r=>{
            if (debugLevel=='high') console.log("Config uploaded successfully.",config);
            return true;
        }).catch(e=>{
            console.error("Upload error");
            if (debugLevel=='high') console.log("Config being uploaded",config);
            return false;
        });        
    }

    async downloadConfig() {
        return await this.sendDSPMessage("GetConfigJson");
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
        let config = await this.sendDSPMessage("GetConfigJson");

        const subBassFilter = camillaDSP.createPeakFilterJSON(70,subBass,1.41);
        const bassFilter = camillaDSP.createPeakFilterJSON(200,bass,1.41);
        const midsFilter = camillaDSP.createPeakFilterJSON(1000,mids,1.41);
        const upperMidsFilter = camillaDSP.createPeakFilterJSON(3000,upperMids,1.41);
        const trebleFilter = camillaDSP.createPeakFilterJSON(8000,treble,1.41);
        
        config.filters["subBass"]=subBassFilter;
        config.filters["bass"]=bassFilter;
        config.filters["mids"]=midsFilter;
        config.filters["upperMids"]=upperMidsFilter;
        config.filters["treble"]=trebleFilter;
        
        config.pipeline=this.updatePipeline(config);        
        
        await this.uploadConfig(config);
        return config;
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
    
    updatePipeline(config) {
        let pipeline=[];        
        for (let mixer in config.mixers) {
            pipeline.push({"type":"Mixer","name":mixer});
        }
        
        pipeline.push({"type":"Filter","channel":0,"names":Object.keys(config.filters)})
        pipeline.push({"type":"Filter","channel":1,"names":Object.keys(config.filters)})
        return pipeline;
    }

    async getSpectrumData() {
        return await this.sendSpectrumMessage("GetPlaybackSignalPeak");
    }

    async updateFilters(filters) {
        if (this.config==undefined) this.config = await this.sendDSPMessage("GetConfigJson");
        let name, obj, ret;
        filters.forEach(e => {
            name = Object.keys(e)[0];
            obj = this.filterToJSON(e[name]);
            this.config.filters[name] = obj;            
        });

        this.config.pipeline= this.updatePipeline(this.config);

        this.sendDSPMessage({"SetConfigJson":JSON.stringify(this.config)}).catch(e=>console.error("upload error",e));        

    }

    filterToJSON(filter) {                        
        // Filter Format 
        // filter[name] = {
        //     "enabled"   : enabled,
        //     "type"      : filterType,
        //     "freq"      : parseInt(freq),
        //     "gain"      : parseFloat(gain),
        //     "q"         : parseFloat(qfact)
        // }
        let gain;
        let obj = new Object();                
        if (!filter.enabled) gain=0;                  
        if (filter.type=="Gain") {
             obj={"type":"Gain","parameters":{"gain":filter.gain,"inverted":false,"scale":"dB"}};
         } else {
            obj={"type":"Biquad","parameters":{"type":filter.type,"freq":filter.freq,"gain":filter.gain,"q":filter.q}};       
         }
         //console.log("json",obj)    
        return obj;
    }

    async updateConfig(config) {
        await this.sendDSPMessage({'SetConfigJson':JSON.stringify(config)});
        this.config = await this.sendDSPMessage("GetConfigJson");        
        return true;

        let currentConfig= await this.sendDSPMessage("GetConfigJson");
        configsEqual(currentConfig,config);
        return true;

        return new Promise((resolve,reject)=>{
            this.sendDSPMessage({'SetConfigJson':JSON.stringify(config)}).then(r=>{
                this.sendDSPMessage("GetConfigJson").then(currentConfig=>{    
                    configsEqual(currentConfig,config);
                    resolve(true);
                    //resolve([true,"Config upload successful."]); //else reject([false,"Config validation failed!"])
                }).catch(e=>{reject([false,"Config validation failed."])})        
            }).catch(e=>reject([false,"Config upload failed."]));            
        })
        
    }

   async convertConfigToText() {        
        this.config = await this.sendDSPMessage("GetConfigJson");                
        let configText=[], lastLine=1;        
        // let localFilters = [];
        // Object.keys(this.config.filters).forEach(f=>{localFilters.push(this.config.filters[f])})

        let filterKeys=Object.keys(this.config.filters);
        for (let filter of filterKeys) {
            console.log(this.config.filters[filter].type)
            if (this.config.filters[filter].type=="Gain") {
                configText[0]="Preamp: "+this.config.filters[filter].parameters.gain+" dB\n";
            } else {
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
}


/****************************************************************************************************************** */

function configsEqual(configA, configB) {
    console.log("Equal logs");
    let equal = checkObjectsForEquality(configA,configB);
    console.log("Configs are equal :", equal)

}

function checkObjectsForEquality(objA, objB) {    
    let ret;
    for (let key of Object.keys(objA).sort((a,b)=>{return a-b})) {
        console.log("===>KEY : ",key, " of type ", typeof(objA[key]))
        if (typeof(objA[key])!='object') {            
            if (objB[key]==undefined ) { console.log("Miss  =>", key," does not exist in second object.",objA[key]); return false };
            if (objB[key]!=objA[key]) { console.log("Miss  =>",key," does not match between objects. A : ",objA[key]," B :",objB[key]);return false } ;            
            if (objB[key]==objA[key]) { console.log("Match =>",key," is '",objA[key],"' in both objects.") } ;            
        } else {      
            if (Array.isArray(objA[key])) {
                console.log(">>>>>>>>>>>>>>>>>>>>>>Array");
                return true;
            }            
            if (objA[key]==null && objB[key]==null) continue;
            if (objB[key]==undefined && objA[key]!=null) { console.log(key," does not exist in second object.",objA[key]); return false };
            ret = checkObjectsForEquality(objA[key],objB[key]);                        
            if (ret==false) return false;
        }    
    }    
    return true;
}


export default camillaDSP;
