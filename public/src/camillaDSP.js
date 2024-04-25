

class camillaDSP {
    ws;    
    ws_spectrum;
    server;
    port;
    spectrumPort;
    config;

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
            console.log("Connected to DSP. Trying spectrum now..",this.ws) 
            return true;            
        }).catch((e)=>{
            console.error("Connection error");
            console.error(e);            
            return false;
        });        

        if (connect) {
            connect = await this.connectToDSP(server,spectrumPort).then(p=>{                
                this.ws_spectrum=p[1];
                this.spectrumPort=spectrumPort;
                console.log("Connected to spectrum.",this.ws_spectrum) 
                return true;
            }).catch(f=>{
                console.error("Error connecting to spectrum error");
                console.error(f);                
                return false;
            })            
        }
        return connect;
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
    
        // console.log("Command : "+responseCommand)
        // console.log("Result : "+result)
        // console.log("Value : "+value)    
    
        switch (responseCommand) {
            case 'GetVersion':
                if (result=='Ok') return [true,value]; else return[false,value];            
                break;
            case 'GetConfigJson':
                if (result=='Ok') return [true,JSON.parse(value)]; else return[false,value];          
                break;                    
            case 'SetConfigJson':
                if (result=='Ok') return [true,value]; else return[false,value];          
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
            let eventListener = this.ws.addEventListener('message',function(m){
                const res = JSON.parse(m.data);
                const responseCommand = Object.keys(res)[0];
                if (message!=responseCommand) return;
    
                let handleResult = camillaDSP.handleDSPMessage(m);
                if (handleResult[0]) resolve(handleResult[1]); else reject(handleResult[1]);

                this.removeEventListener('message',eventListener);
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

        const mixers = {"recombine":{
            "channels":{"in":2,"out":2},
            "mapping":[
                {"dest":0,"sources":[{"channel":0,"gain":0,"inverted":false,"mute":false},{"channel":1,"gain":0,"inverted":false,"mute":true,"scale":"dB"}],"mute":false},
                {"dest":1,"sources":[{"channel":1,"gain":0,"inverted":false,"mute":false},{"channel":0,"gain":0,"inverted":false,"mute":true,"scale":"dB"}],"mute":false}
                ]
            }
        };          

        if (config.mixers==null) config["mixers"]= mixers;                                
        if (config.filters==null) config["filters"]={};
        if (config.processors==null) config["processors"]=null;

        let pipeline=[{"type":"Mixer","name":"recombine"}];        

        if (config.pipeline==null) config["pipeline"]=pipeline;       

        if (override) {
            config.mixers=mixers;
            config.pipeline=pipeline;
        }

        return config;
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

        config.filters={};
        config.filters["subBass"]=subBassFilter;
        config.filters["bass"]=bassFilter;
        config.filters["mids"]=midsFilter;
        config.filters["upperMids"]=upperMidsFilter;
        config.filters["treble"]=trebleFilter;
        
        config.pipeline=[{"type":"Mixer","name":"recombine"}];
        config.pipeline.push({"type":"Filter","channel":0,"names":["subBass","bass","mids","upperMids","treble"]})
        config.pipeline.push({"type":"Filter","channel":1,"names":["subBass","bass","mids","upperMids","treble"]})
        
        return this.sendDSPMessage({'SetConfigJson':JSON.stringify(config)}).then(r=>console.log(r)).catch(e=>console.error(e));
    }

    async setCrossfeed(crossfeedVal) {
        let config = await this.sendDSPMessage("GetConfigJson");

        if (crossfeedVal<=-16.5) {
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
        console.log(config)
        if (config.mixers.recombine.mapping[0].sources[1].mute == true) return -16.5; else return config.mixers.recombine.mapping[0].sources[1].gain;
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


}

export default camillaDSP;
