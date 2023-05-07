

// https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results/oratory1990/harman_over-ear_2018/AKG%20K361/AKG%20K361%20ParametricEQ.txt
// https://api.github.com/repos/jaakkopasanen/AutoEq/git/trees/9127a8b6e8e3e84c22163bb4ad6bf49fc32a5e08

function getCongifText(url) {
    fetch(url).then((res)=>res.text().then(data=>{
        return data;
    }))
}