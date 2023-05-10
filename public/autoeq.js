
// AutoEQ Results folder 
// https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/27c4591c3fc158d1bfc73a0710bde842261189f4
// oratory in-ear URL 
// https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/9127a8b6e8e3e84c22163bb4ad6bf49fc32a5e08


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

function parseAutoEQText(text) {    
    let lines = text.split('\n');
    let filterArray=new Array();        
    let i=0;
    //console.log(lines)

    for (let line of lines) {
        if (line.length==0) continue;
        //console.log(line)
        let name = line.substring(0,line.indexOf(':'));
        let lineFragments = line.substring(line.indexOf(':')+1).split(' ');
        //console.log(lineFragments)

        let type,gain,freq,qfact;
        
        if (name=='Preamp') { 
            gain=lineFragments[1]; 
            freq=0;
            qfact=0; 
            filterType="Preamp"
        } else {
            i<10?name="Filter0"+i:name="Filter"+i;
            filterType=lineFragments[2];
            freq=lineFragments[4];
            gain=lineFragments[7];
            qfact=lineFragments[10];
        }         
        //console.log(filterType)
        filterType=="PK"?filterType="Peaking":filterType=="LS"?filterType="Lowshelf":filterType="Highshelf";

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