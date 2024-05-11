

function advancedOnLoad() {
    window.parent.DSP.downloadConfig();
    window.config = window.parent.DSP.config;

    const filter = new filterClass();
    const advancedFilters = document.getElementById("advancedFilters");

    console.log("New filter "+advancedFilters.childNodes.length)

    advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));
    advancedFilters.appendChild(filter.createElement("New filter "+advancedFilters.childNodes.length));

    
}