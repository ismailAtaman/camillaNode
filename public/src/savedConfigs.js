
class savedConfigs {    
    
    configs;    
    

    loadConfigs(type) {
        this.configs= window.localStorage.getItem("savedConfigs");        
        if (this.configs==null) this.configs=[];
        if (this.configs.length==0 ) this.configs=[]; else this.configs=JSON.parse(this.configs);
        if (type!=undefined && type!=null) return this.configs.filter(e=>e.type==type); else return this.configs;
    }   
    
    getConfig(name,type) {
        if (this.configs==undefined) this.loadConfigs();

        if (type==undefined) {
            let filteredList =  this.configs.filter(e=>e.name==name);
            if (filteredList.length==0) return {"success":false,"elementCount":0};
            if (filteredList.length>1) return {"success":false,"elementCount":filteredList.length};
            return {"success":true,"elementIndex":this.configs.indexOf(filteredList)};
        } else {
            let r =  this.configs.filter(e=>e.name==name && e.type==type);
            if (r.length==0) return {"success":false,"elementCount":r.length};
            return {"success":true,"elementIndex":this.configs.indexOf(filteredList)};
        }
    }

    getConfigById(id) {
        if (this.configs==undefined) this.loadConfigs();
        return this.configs.filter(e=>e.id==id)[0];        
    }

    saveConfig(config,overwrite) {
        // {"type":activePage,"name":configName,"createdDate":date,"data":data}
        
        if (this.configs==undefined) this.loadConfigs();
        
        let getConfig = this.getConfig(config.name,config.type);
        
        if ( getConfig.success && overwrite) { this.add(config); return [true,config]; }
        if ( getConfig.success && !overwrite) { return [false,"exists"];}        
        if ( getConfig.success && getConfig.elementCount>1) { return[false,"multiple"] }

        if (getConfig.elementCount==0) { this.add(config); return [true,config]; }        
        return getConfig;
    }

    add(config) {
        // This is the *private* version with no checks. Use saveConfig to save instead
        if (this.configs==undefined) this.loadConfigs();
        config.id = parseInt(new Date().getTime());
        this.configs.push(config);
        window.localStorage.setItem("savedConfigs",JSON.stringify(this.configs));        
    }   
    
    delete(id) {
        if (this.configs==undefined) this.loadConfigs();    
        let element = this.configs.filter((e)=>e.id==id)[0];                
        let index = this.configs.indexOf(element);
        if (index==-1) return false; 
        this.configs.splice(index,1);         
        window.localStorage.setItem("savedConfigs",JSON.stringify(this.configs));        
        return true;
    }

    getNextId() {
        if (this.configs==undefined) this.loadConfigs();
        let tmpConfigs=this.configs; 
        tmpConfigs.sort((a,b)=>{return b.id - a.id});        
        return tmpConfigs[0]==undefined?0:parseInt(tmpConfigs[0].id)+1;        
    }

}

export default savedConfigs;