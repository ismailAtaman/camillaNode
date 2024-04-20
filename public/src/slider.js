

class EQSlider {

    constructor() {

        // <div class="sliderBody">
        //     <div class="bar">
        //         <div class="slider"></div>
        //     </div>
        //     <input class="peqParam" id="freq">
        //     <input class="peqParam" id="gain">
        //     <input class="peqParam" id="Q">
        // </div>

        const sliderBody = document.createElement('div');
        const bar = document.createElement('div');
        const slider = document.createElement('div');
        const freq=document.createElement('input');
        const gain=document.createElement('input');
        const q=document.createElement('input');
        const type=document.createElement('select');

        sliderBody.className='sliderBody';
        bar.className='bar';
        slider.className='slider';

        freq.className='peqParam';
        gain.className='peqParam';
        q.className='peqParam';
        type.className='peqParam';


        const LS=document.createElement('option')
        const PK=document.createElement('option')
        const HS=document.createElement('option')
        LS.value="Lowshelf";        
        LS.text="LS"
        type.options.add(LS)

        PK.value="Peaking";
        PK.text="PK"
        type.options.add(PK)

        HS.value="Highshelf";
        HS.text="HS"
        type.options.add(HS)

        type.options.selectedIndex=1;

        bar.appendChild(slider);
        sliderBody.appendChild(bar);
        sliderBody.appendChild(freq);
        sliderBody.appendChild(gain);
        sliderBody.appendChild(q);
        sliderBody.appendChild(type);
        sliderBody.setAttribute("value",0)


        const observer = new MutationObserver(function(muts){
            muts.forEach(function(mut){                                
                console.log(mut.target.className,mut.type);                
            })
        });

        observer.observe(sliderBody, {attributes:true});
        observer.observe(freq, {attributes:true});
        observer.observe(gain, {attributes:true});
        observer.observe(q, {attributes:true});
        observer.observe(type, {attributes:true});

        sliderBody.instance=this;
        return sliderBody;

    }
    
}


export default EQSlider;