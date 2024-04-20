

class camillaDSP {
    ws;    
    server;
    port;
    config;

    constructor() { 
        return this;        
    }

    async connect(server,port) {
        if (server==undefined) {
            server = window.localStorage.getItem("server");
            port = window.localStorage.getItem("port");
        }

        return await this.connectToDsp(server,port).then((r)=>{ 
            this.ws = r[1];                                    
            this.server=server;
            this.port=port;
            return true;
        }).catch((e)=>{
            console.error("Connection error");
            console.error(e);            
            return false;
        });        
    }

    async connectToDsp(server,port) {
        if (server==undefined) {
            let serverConfig = getDefaultServerConfig();
            server=serverConfig.serverIp;
            port=serverConfig.port;        
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


    defaultConfig() {
        let config = new Object;
        config["title"]="CamillaNode2";
        config["description"]="Config file created by CamillaNode 2";

        config["mixers"]={"recombine":{
                            "channels":{"in":2,"out":2},
                            "mapping":[
                                {"dest":0,"sources":[{"channel":0,"gain":0,"inverted":false,"mute":false},{"channel":1,"gain":0,"inverted":false,"mute":true,"scale":"linear"}],"mute":false},
                                {"dest":1,"sources":[{"channel":1,"gain":0,"inverted":false,"mute":false},{"channel":0,"gain":0,"inverted":false,"mute":true,"scale":"linear"}],"mute":false}
                                ]
                            }
                        };                                     
        config["filters"]={};
        config["processors"]={};
        config["pipeline"]=[{"type":"Mixer","name":"recombine"}];        
        return config;
    }

    async setBalance(bal) {
        let config = await this.sendDSPMessage("GetConfigJson");

        console.log(config.mixers.recombine.mapping[0].sources[0].gain,config.mixers.recombine.mapping[1].sources[0].gain);

        config.mixers.recombine.mapping[0].sources[0].gain = -bal
        config.mixers.recombine.mapping[1].sources[0].gain = bal

        await this.sendDSPMessage({'SetConfigJson':JSON.stringify(config)})
    }
}

export default camillaDSP;
