



document.addEventListener('DOMContentLoaded',mainBodyOnLoad);


function mainBodyOnLoad() {
    const mainframe = document.getElementById('mainframe');    

    // Find all navigate items and add event handler to change them to links to their target attribute        
    const navigates = document.getElementsByClassName("navigate");    
    for (i=0;i<navigates.length;i++) {        
        navigates[i].addEventListener('click',function (){ 
            let target =this.getAttribute('target')
            if (target.length>0) mainframe.src=target;             
        })
    }    
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function saveToLocalStorage(val) {
    window.localStorage.setItem(val.key,val.value);
    
}


// Preamp: -4dB dB
// Filter 1: ON LSC Fc 70 Hz Gain 1 dB Q 0.7
// Filter 2: ON PK Fc 200 Hz Gain -1 dB Q 1.4
// Filter 3: ON HSC Fc 1000 Hz Gain -2 dB Q 0.7
// Filter 4: ON PK Fc 2800 Hz Gain -3 dB Q 1.21
// Filter 5: ON PK Fc 3000 Hz Gain -3 dB Q 3
// Filter 6: ON PK Fc 4000 Hz Gain -1 dB Q 3
// Filter 7: ON PK Fc 6000 Hz Gain -3 dB Q 3
// Filter 8: ON PK Fc 8000 Hz Gain -3 dB Q 3
