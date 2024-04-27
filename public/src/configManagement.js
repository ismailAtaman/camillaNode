
class savedConfigs {    
    
    configs;  
    loadConfigs() {
        this.configs= window.localStorage.getItem("savedConfigs")
        if (this.configs==null) this.configs={}; else  this.configs=JSON.parse(this.configs);
        return this.configs;
    }   
    
    
}
