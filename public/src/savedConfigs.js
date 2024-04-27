
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
            let r =  this.configs.filter(e=>e.name==name);

            if (r.length==0) return [false,r.length];
            if (r.length>1) return [false,r.length]
            return [true, this.configs.indexOf(r)];
        } else {
            let r =  this.configs.filter(e=>e.name==name && e.type==type);
            if (r.length==0) return [false,r.length];
            return [true,r];
        }
    }

    getConfigById(id) {
        if (this.configs==undefined) this.loadConfigs();
        return this.configs.filter(e=>e.id==id)[0];        
    }

    saveConfig(config,overwrite) {
        // {"type":activePage,"name":configName,"createdDate":date,"data":data}
        
        if (this.configs==undefined) this.loadConfigs();
        
        let r = this.getConfig(config.name,config.type);
        
        if (r[0] && overwrite) { this.add(config); return [true,config]; }
        if (r[0] && !overwrite) { return [false,"exists"];}        
        if (r[0] && r[1]>1) { return[false,"multiple"] }

        if (r[1]==0) { this.add(config); return [true,config]; }        
        return r;
    }

    add(config) {
        // This is the *private* version with no checks. Use saveConfig to save instead
        if (this.configs==undefined) this.loadConfigs();
        config.id = this.getNextId();
        this.configs.push(config);
        window.localStorage.setItem("savedConfigs",JSON.stringify(this.configs));        
    }   
    
    delete(id) {
        if (this.configs==undefined) this.loadConfigs();                
        let r = this.configs.find(e=>e.id=id);
        let index = this.configs.indexOf(r);
        this.configs.splice(index);         
        window.localStorage.setItem("savedConfigs",JSON.stringify(this.configs));        
        return true;
    }

    getNextId() {
        if (this.configs==undefined) this.loadConfigs();
        let tmpConfigs=this.configs; 
        tmpConfigs.sort((a,b)=>{return b.id - a.id});        
        return tmpConfigs[0]==undefined?0:tmpConfigs[0].id+1;        
    }

}

export default savedConfigs;