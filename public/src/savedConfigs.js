
class savedConfigs {    
    
    configs;    
    
    ///////////////////////////////////////////////// Local Implementations ////////////////////////////////////

    loadConfigsLocal(type, sorted) {
        if (sorted==undefined) sorted=false;

        this.configs= window.localStorage.getItem("savedConfigs");        
        if (this.configs==null) {this.configs=[]};
        if (this.configs.length==0 ) this.configs=[]; else this.configs=JSON.parse(this.configs);

        try {
            if (type!=undefined && type!=null) this.configs= this.configs.filter(e=>e.type==type);          
        }
        catch {
            return [];
        }

        if (sorted) {this.configs.sort((a,b)=>{if (a.name>b.name) return 1; else return -1;})}
        return this.configs;
    }   
    
    getConfigLocal(name,type) {
        if (this.configs==undefined) this.loadConfigs();

        if (type==undefined) {
            let filteredList =  this.configs.filter(e=>e.name==name);
            if (filteredList.length==0) return {"success":false,"elementCount":0};
            if (filteredList.length>1) return {"success":false,"elementCount":filteredList.length};
            return {"success":true,"elementIndex":this.configs.indexOf(filteredList)};
        } else {
            let filteredList =  this.configs.filter(e=>e.name==name && e.type==type);

            if (filteredList.length==0) return {"success":false,"elementCount":filteredList.length};
            console.log("FilterList ID:",filteredList[0].id);
            return {"success":true,"elementId":filteredList[0].id};
        }
    }

    getConfigByIdLocal(id) {
        if (this.configs==undefined) this.loadConfigs();
        return this.configs.filter(e=>e.id==id)[0];        
    }

    saveConfigLocal(config,overwrite) {
        // {"type":activePage,"name":configName,"createdDate":date,"data":data}
        
        if (this.configs==undefined) this.loadConfigsLocal();
        
        let getConfig = this.getConfigLocal(config.name,config.type);
        
        if ( getConfig.success && overwrite) { this.deleteLocal(getConfig.elementId); this.addLocal(config); return [true,config]; }
        if ( getConfig.success && !overwrite) { return [false,"exists"];}        
        if ( getConfig.success && getConfig.elementCount>1) { return[false,"multiple"] }

        if (getConfig.elementCount==0) { this.addLocal(config); return [true,config]; }        
        return getConfig;
    }

    addLocal(config) {
        // This is the *private* version with no checks. Use saveConfig to save instead
        if (this.configs==undefined) this.loadConfigs();
        config.id = parseInt(new Date().getTime());
        this.configs.push(config);
        window.localStorage.setItem("savedConfigs",JSON.stringify(this.configs));        
    }   
    
    deleteLocal(id) {
        if (this.configs==undefined) this.loadConfigs();    
        let element = this.configs.filter((e)=>e.id==id)[0];                
        let index = this.configs.indexOf(element);
        if (index==-1) return false; 
        this.configs.splice(index,1);         
        window.localStorage.setItem("savedConfigs",JSON.stringify(this.configs));        
        return true;
    }
    
    saveLastConfigLocal(configName) {
        window.localStorage.setItem("lastConfigName",configName);
        return true;
    }

    getLastConfigLocal() {
        return window.localStorage.getItem("lastConfigName");        
    }
    
    //////////////////////////////////////////////////// Remote Implementations //////////////////////////////////////////////

    async loadConfigsRemote(type, sorted) {
        if (sorted==undefined) sorted=false;

        return new Promise((resolve,reject)=>{
            fetch('/getConfigFile').then((res)=>res.text().then(data=>{
                // let config =JSON.parse(JSON.parse(data));                                   
                if (data.length==0) this.configs=[]; else this.configs=JSON.parse(data);            
                // console.log(this.configs);
    
                if (this.configs==null) {this.configs=[]};
                if (this.configs.length==0 ) this.configs=[]; 
    
                try {
                    if (type!=undefined && type!=null) this.configs= this.configs.filter(e=>e.type==type);          
                }
                catch {
                    resolve([]);
                }
    
                if (sorted) {this.configs.sort((a,b)=>{if (a.name>b.name) return 1; else return -1;})}
    
                resolve(this.configs);
            }))
        })        
    }

    async getConfigRemote(name,type) {
        if (this.configs==undefined) await this.loadConfigsRemote();

        console.log(this.configs)

        if (type==undefined) {
            let filteredList =  this.configs.filter(e=>e.name==name);
            if (filteredList.length==0) return {"success":false,"elementCount":0};
            if (filteredList.length>1) return {"success":false,"elementCount":filteredList.length};
            return {"success":true,"elementIndex":this.configs.indexOf(filteredList)};
        } else {
            let filteredList =  this.configs.filter(e=>e.name==name && e.type==type);

            if (filteredList.length==0) return {"success":false,"elementCount":filteredList.length};
            console.log("FilterList ID:",filteredList[0].id);
            return {"success":true,"elementId":filteredList[0].id};
        }
    }

    async getConfigByIdRemote(id) {
        if (this.configs==undefined) await this.loadConfigsRemote();
        return this.configs.filter(e=>e.id==id)[0];      
    }

    async saveConfigRemote(config,overwrite) { 
        return new Promise(async (resolve,reject)=>{
            if (this.configs==undefined) await this.loadConfigsRemote();
            
            let getConfig = await this.getConfigRemote(config.name,config.type);
            
            if ( getConfig.success && overwrite) { await this.deleteRemote(getConfig.elementId); await this.addRemote(config); resolve([true,config]); }
            if ( getConfig.success && !overwrite) reject([false,"exists"]);         
            if ( getConfig.success && getConfig.elementCount>1) reject([false,"multiple"]);

            if (getConfig.elementCount==0) { await this.addRemote(config); resolve([true,config])}                    
        })
    }

    async addRemote(config) {
        // This is the *private* version with no checks. Use saveConfig to save instead
        return new Promise(async (resolve,reject)=>{
            await this.loadConfigsRemote();        
            config.id = parseInt(new Date().getTime());
            this.configs.push(config);
            // console.log("Saving ",this.configs);
            fetch('/saveConfigFile',{
                method: "POST",
                headers: {
                    'Accept' : 'application/text',
                    'content-type' : 'application/text'
                },
                body: JSON.stringify(this.configs)
            });    
            resolve(true);

        })
        
    }   
    
    async deleteRemote(id) {
        return new Promise(async (resolve,reject)=>{
            if (this.configs==undefined) await this.loadConfigs();    
            let element = this.configs.filter((e)=>e.id==id)[0];                
            let index = this.configs.indexOf(element);
            if (index==-1) return false; 
            this.configs.splice(index,1);         
            fetch('/saveConfigFile',{
                method: "POST",
                headers: {
                    'Accept' : 'application/text',
                    'content-type' : 'application/text'
                },
                body: JSON.stringify(this.configs)
            });    
            resolve(true);
        });
    }

}

export default savedConfigs;