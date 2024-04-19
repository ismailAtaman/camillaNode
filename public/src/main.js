

document.addEventListener('DOMContentLoaded',mainBodyOnLoad);


function mainBodyOnLoad() {
    const mainframe = document.getElementById('mainframe');    

    // Find all navigate items and add event handler to change them to links to their target attribute        
    const navigates = document.getElementsByClassName("navigate");    
    for (i=0;i<navigates.length;i++) {        
        navigates[i].addEventListener('click',function (){ 
            mainframe.src=this.getAttribute('target'); 
        })
    }
    

}