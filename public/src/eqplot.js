const QUADLEN = 1024;

function calculateFilterDataMatrix(type, freq, gain, qfact) {
	
	let sampleRate=48000;
	var a0,a1,a2,b1,b2,norm;
	var ymin, ymax, minVal, maxVal;
	
	var V = Math.pow(10, Math.abs(gain) / 20);
	var K = Math.tan(Math.PI * freq /sampleRate);
	switch (type) {
		case "one-pole lp":
			b1 = Math.exp(-2.0 * Math.PI * (freq /sampleRate));
            a0 = 1.0 - b1;
            b1 = -b1;
			a1 = a2 = b2 = 0;
			break;

		case "one-pole hp":
			b1 = -Math.exp(-2.0 * Math.PI * (0.5 - freq /sampleRate));
            a0 = 1.0 + b1;
            b1 = -b1;
			a1 = a2 = b2 = 0;
			break;            

		case "lowpass":
			norm = 1 / (1 + K /qfact + K * K);
			a0 = K * K * norm;
			a1 = 2 * a0;
			a2 = a0;
			b1 = 2 * (K * K - 1) * norm;
			b2 = (1 - K /qfact + K * K) * norm;
			break;
		
		case "highpass":
			norm = 1 / (1 + K /qfact + K * K);
			a0 = 1 * norm;
			a1 = -2 * a0;
			a2 = a0;
			b1 = 2 * (K * K - 1) * norm;
			b2 = (1 - K /qfact + K * K) * norm;
			break;
		
		case "bandpass":
			norm = 1 / (1 + K /qfact + K * K);
			a0 = K /qfact * norm;
			a1 = 0;
			a2 = -a0;
			b1 = 2 * (K * K - 1) * norm;
			b2 = (1 - K /qfact + K * K) * norm;
			break;
		
		case "notch":
			norm = 1 / (1 + K /qfact + K * K);
			a0 = (1 + K * K) * norm;
			a1 = 2 * (K * K - 1) * norm;
			a2 = a0;
			b1 = a1;
			b2 = (1 - K /qfact + K * K) * norm;
			break;
		
		case "peaking":
			if (gain >= 0) {
				norm = 1 / (1 + 1/qfact * K + K * K);
				a0 = (1 + V/qfact * K + K * K) * norm;
				a1 = 2 * (K * K - 1) * norm;
				a2 = (1 - V/qfact * K + K * K) * norm;
				b1 = a1;
				b2 = (1 - 1/qfact * K + K * K) * norm;
			}
			else {	
				norm = 1 / (1 + V/qfact * K + K * K);
				a0 = (1 + 1/qfact * K + K * K) * norm;
				a1 = 2 * (K * K - 1) * norm;
				a2 = (1 - 1/qfact * K + K * K) * norm;
				b1 = a1;
				b2 = (1 - V/qfact * K + K * K) * norm;
			}
			break;

		case "Lowshelf":
			if (gain >= 0) {
				norm = 1 / (1 + Math.SQRT2 * K + K * K);
				a0 = (1 + Math.sqrt(2*V) * K + V * K * K) * norm;
				a1 = 2 * (V * K * K - 1) * norm;
				a2 = (1 - Math.sqrt(2*V) * K + V * K * K) * norm;
				b1 = 2 * (K * K - 1) * norm;
				b2 = (1 - Math.SQRT2 * K + K * K) * norm;
			}
			else {	
				norm = 1 / (1 + Math.sqrt(2*V) * K + V * K * K);
				a0 = (1 + Math.SQRT2 * K + K * K) * norm;
				a1 = 2 * (K * K - 1) * norm;
				a2 = (1 - Math.SQRT2 * K + K * K) * norm;
				b1 = 2 * (V * K * K - 1) * norm;
				b2 = (1 - Math.sqrt(2*V) * K + V * K * K) * norm;
			}
			break;

		case "Highshelf":
            if (gain >= 0) {
                norm = 1 / (1 + Math.SQRT2 * K + K * K);
                a0 = (V + Math.sqrt(2*V) * K + K * K) * norm;
                a1 = 2 * (K * K - V) * norm;
                a2 = (V - Math.sqrt(2*V) * K + K * K) * norm;
                b1 = 2 * (K * K - 1) * norm;
                b2 = (1 - Math.SQRT2 * K + K * K) * norm;
            }
            else {	
                norm = 1 / (V + Math.sqrt(2*V) * K + K * K);
                a0 = (1 + Math.SQRT2 * K + K * K) * norm;
                a1 = 2 * (K * K - 1) * norm;
                a2 = (1 - Math.SQRT2 * K + K * K) * norm;
                b1 = 2 * (K * K - V) * norm;
                b2 = (V - Math.sqrt(2*V) * K + K * K) * norm;
			}
			break;
	}

	var len = QUADLEN;
	var magPlot = [];
	for (var idx = 0; idx < len; idx++) {
		var w;
		w = Math.exp(Math.log(1 / 0.001) * idx / (len - 1)) * 0.001 * Math.PI;	// 0.001 to 1, times pi, log scale

		var phi = Math.pow(Math.sin(w/2), 2);
		var y = Math.log(Math.pow(a0+a1+a2, 2) - 4*(a0*a1 + 4*a0*a2 + a1*a2)*phi + 16*a0*a2*phi*phi) - Math.log(Math.pow(1+b1+b2, 2) - 4*(b1 + 4*b2 + b1*b2)*phi + 16*b2*phi*phi);
		y = y * 10 / Math.LN10
		if (y == -Infinity)
			y = -200;

		// magPlot.push([idx / (len - 1) / 2, y]);
		magPlot.push([ idx / (len - 1) / 2, y]);		

		if (idx == 0)
			minVal = maxVal = y;
		else if (y < minVal)
			minVal = y;
		else if (y > maxVal)
			maxVal = y;
	}

	// configure y-axis
	switch (type) {
		default:
		case "lowpass":
		case "highpass":
		case "bandpass":
		case "notch":
			ymin = -100;
			ymax = 0;
			if (maxVal > ymax)
				ymax = maxVal;
			break;
		case "Peaking":
		case "Lowshelf":
		case "Highshelf":
			ymin = -10;
			ymax = 10;
			if (maxVal > ymax)
				ymax = maxVal;
			else if (minVal < ymin)
				ymin = minVal;
			break;
        case "one-pole lp":
        case "one-pole hp":
			ymin = -40;
			ymax = 0;
            break;
	}
		
    //console.log(magPlot);
	return magPlot;
}

function plotArray(canvas, array, col, lineWidth){       
	var ctx = canvas.getContext("2d");
    var h = canvas.height;    
    var w = canvas.width;    
    var ch = h / 2; 
	let x,y;
	
	ctx.beginPath();			
	ctx.strokeStyle = col;        
	ctx.lineWidth = lineWidth;
	ctx.setLineDash([]);

	stepSize = w / array.length;
	heightScale= 19; //h / (5 * 10);      	
	let max=0;
	let rounded=[];
	for (i=0;i<array.length;i++) {            		
		x=30 + i * stepSize;		
		if (x<60) continue;
		rounded[0]=Math.round(array[i][1],2);
		if (rounded[0]>max) { max=rounded[0]; rounded[1]=i} 
		y = -16+ch-(heightScale* array[i][1]);
		ctx.lineTo(x,y);				
	}        
	ctx.stroke();               
	
	
}

function createGrid(canvas) {
	var ctx = canvas.getContext("2d");

    var h = canvas.height;	
	var w = canvas.width;    		

	let verticalLineCount= 30;        	
	let verticalStepSize = h /verticalLineCount -1

	ctx.font="14px Abel";
	ctx.fillStyle = "#EEE";  	
	ctx.strokeStyle = "#CCC";        
	ctx.lineWidth = 0.5;
	ctx.setLineDash([1,5])
	

	ctx.beginPath();
	for (i=1;i<verticalLineCount;i+=2) {    		
		ctx.moveTo(60,verticalStepSize * i);
		ctx.lineTo(w-10,verticalStepSize * i) 
		level = (i + verticalLineCount/2 - verticalLineCount)*-1;
		ctx.fillText(level+"dB", 10 ,verticalStepSize * i)		
	}   
	ctx.stroke();     	
			
	ctx.beginPath();
	const freqList = [[30,28],[40, 71],[50, 104],[60, 131],[70, 154],[80, 174],[90, 191],[100, 207],[200, 309],[300, 369],[400, 412],[500, 445],[600, 472],[700, 495],[800, 515],[900, 532],[1000, 548],[2000, 650],[3000, 711],[4000, 753],[5000, 786],[6000, 814],[7000, 837],[8000, 857],[9000, 874],[10000, 890],[11000, 904],[12000, 918],[13000, 930],[14000, 941],[15000, 951],[16000, 961],[17000, 971],[18000, 979],[19000, 988],[20000, 996]]
	for (i=0;i<freqList.length;i++) {		
	
		xPos= 35+freqList[i][1];
		switch(freqList[i][0]) {
			case 100:
			case 1000:
			case 10000:
				ctx.fillText(freqList[i][0]+"Hz", xPos-15, h-25);				
		}		
		ctx.moveTo(xPos,18);
		ctx.lineTo(xPos,h-50);						
	}
	ctx.stroke();
	
	ctx.strokeStyle = "#DDD";        
	ctx.lineWidth = 0.8;
	ctx.setLineDash([2,5]);
	
	ctx.beginPath();
	ctx.moveTo(35 + 207,18);
	ctx.lineTo(35 + 207,h-50);		

	ctx.moveTo(35 + 548,18);
	ctx.lineTo(35 + 548,h-50);		

	ctx.moveTo(35 + 890,18);
	ctx.lineTo(35 + 890,h-50);		

	ctx.stroke();
	
}

