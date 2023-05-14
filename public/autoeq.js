
// AutoEQ Results folder 
// https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/27c4591c3fc158d1bfc73a0710bde842261189f4
// oratory in-ear URL 
// https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/9127a8b6e8e3e84c22163bb4ad6bf49fc32a5e08



const AutoEQResults = {
    "Crinicle":{
        "IEM"                       :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/7e4de6a8936e7b43eb4d1f1679e679aac28f863b"},
        "Headphones - Gras 43AG-7"  :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/06b43dba9ab7b9b112f912ba1a54c84f65b19df8"},
        "Headphones - Ears 711"     :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/d998aa432cf36c2038214090f235ba524acbf537"},       
    },
    "headphones.com":{
        "IEM"                       :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/d4ac1c091ce178666b8a372ba594afa9386f3631"},
        "Headphones"                :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/2a83d7c0b570b7a1d485d769eb778bed888d939d"},
    },
    "InnerFidelity":{
        "IEM"                       :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/2dc464db989b334054b35da6019df41d067e2a5c"},
        "Headphones"                :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/ee14333aa5f44e1a846f57c48a108ee8139e820d"},
    },

    "Oratory1990":{
        "IEM"                       :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/5d06a2a922b3fc34792d0115a39739cf7cff53b0"},
        "Headphones"                :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/9127a8b6e8e3e84c22163bb4ad6bf49fc32a5e08"},
    },
    
    "Ratings.com":{
        "IEM"                       :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/357240e589d25076066c20dd4cc51eb025c45774"},
        "Headphones"                :{"url":"https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/3afb688cecf24697f5d0238830d3e0bebbb642ba"},
    },
}

let autoEQDB= [];

async function initAutoEQDB(source) {    
    loadAutoEQDB(source).then(ret=>{        
        console.log("AutoEQ Database initialized with "+autoEQDB.length+" records.");
        window.localStorage.setItem("autoEQDB",JSON.stringify(autoEQDB));
    });    
}

async function loadAutoEQDB(source) {    
    autoEQDB= [];      
    return promise = new Promise(async (resolve,reject)=>{        
        for ( let sourceName of Object.keys(AutoEQResults)) {     
            if (source!=undefined && source!=sourceName) continue;  
            for (let repoName of Object.keys(AutoEQResults[sourceName])) {        
                let repoURL = AutoEQResults[sourceName][repoName].url;
                let repoList = await downloadEQList(repoURL);
                repoObj = JSON.parse(repoList);
                for (let device of repoObj.tree) {                            
                    let autoEQRecord = {
                        "deviceName"    :device.path,
                        "repoName"      :repoName,
                        "sourceName"    :sourceName,
                        "url"           :device.url,
                    }
                    //console.log(autoEQRecord);
                    autoEQDB.push(autoEQRecord)                                                  
                }                    
            }                                        
        }                
        resolve(true);
    })  
    
}



function getCongifText(url) {
    fetch(url).then((res)=>res.text().then(data=>{
        return data;
    }))
}

async function downloadHeadphoneList() {
    url = 'https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/9127a8b6e8e3e84c22163bb4ad6bf49fc32a5e08';
    return new Promise((resolve)=>{;
        fetch(url).then((res)=>res.text().then(data=>{        
            resolve(data);
        }))
    })    
}

async function downloadIEMList() {    
    // Cirnicle > harman_in-ear_2019v2
    url = 'https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/7e4de6a8936e7b43eb4d1f1679e679aac28f863b';
    return new Promise((resolve)=>{;
        fetch(url).then((res)=>res.text().then(data=>{        
            resolve(data);
        }))
    })    
}

async function downloadEQList(url) {        
    return new Promise((resolve,reject)=>{
        try {
            fetch(url).then((res)=>res.text().then(data=>{        
                resolve(data);
            }))
        }
        catch(e) {
            reject(e)
        }
    })    
}


function parseAutoEQText(text) {    
    let lines = text.split('\n');
    let filterArray=new Array();        
    let i=0;
    console.log(lines)

    for (let line of lines) {
        if (line.length==0) continue;
        //console.log(line)
        let name = line.substring(0,line.indexOf(':'));
        let lineFragments = line.substring(line.indexOf(':')+1).split(' ');
        //console.log(lineFragments)

        let type,gain,freq,qfact;        

        if (name=='Preamp') { 
            //if (typeof lineFragments[1]!="number") return false;
            gain=lineFragments[1]; 
            freq=0;
            qfact=0; 
            filterType="Preamp"
        } else {
            //if (typeof lineFragments[2]!="number" || typeof lineFragments[4]!="number" || typeof lineFragments[7]!="number" || typeof lineFragments[10]!="number" ) return false;            
            i<10?name="Filter0"+i:name="Filter"+i;            
            filterType=lineFragments[2];
            freq=lineFragments[4];
            gain=lineFragments[7];
            qfact=lineFragments[10];
        }         
        //console.log(filterType)
        filterType=="PK"?filterType="Peaking":filterType=="LS"?filterType="Lowshelf":filterType="Highshelf";
        if (name!="Preamp" && parseInt(freq)===0) continue;

        let filter = new Object();

        filter[name] = {
            "type"  : filterType,
            "freq"  : parseInt(freq),
            "gain"  : parseFloat(gain),
            "q"     : parseFloat(qfact)
        }

        filterArray.push(filter);        
        i++;
    }

    //console.log(filterArray);
    return filterArray;

}