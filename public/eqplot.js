const QUADLEN = 1024;

function calculateFilterDataMatrix(type, freq, gain, qfact, sampleRate) {
	let  plotType="log";
	if (sampleRate==undefined) sampleRate=48000;

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
		
		case "Peaking":
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
		if (plotType == "linear")
			w = idx / (len - 1) * Math.PI;	// 0 to pi, linear scale
		else
			w = Math.exp(Math.log(1 / 0.001) * idx / (len - 1)) * 0.001 * Math.PI;	// 0.001 to 1, times pi, log scale

		var phi = Math.pow(Math.sin(w/2), 2);
		var y = Math.log(Math.pow(a0+a1+a2, 2) - 4*(a0*a1 + 4*a0*a2 + a1*a2)*phi + 16*a0*a2*phi*phi) - Math.log(Math.pow(1+b1+b2, 2) - 4*(b1 + 4*b2 + b1*b2)*phi + 16*b2*phi*phi);
		y = y * 10 / Math.LN10
		if (y == -Infinity)
			y = -200;

		if (plotType == "linear")
			magPlot.push([idx / (len - 1) *sampleRate / 2, y]);
		else
			magPlot.push([idx / (len - 1) / 2, y]);

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
	heightScale= h / (2 * 10);      

	for (i=0;i<array.length;i++) {            		
		x=i*stepSize;
		y = ch-(heightScale* array[i][1]);
		ctx.lineTo(x,y);				
	}        
	ctx.stroke();               
	
}

function createGrid(canvas) {
	var ctx = canvas.getContext("2d");
    var h = canvas.height;    
    var w = canvas.width;    
	let verticalLineCount= 12;        	
	let verticalStepSize = h /verticalLineCount

	ctx.strokeStyle = "#555";        
	ctx.lineWidth = 1;
	ctx.setLineDash([3,5])        

	for (i=1;i<verticalLineCount;i++) {    	
		ctx.moveTo(0,verticalStepSize * i);
		ctx.lineTo(w,verticalStepSize * i)           
		// ctx.strokeText(i,0,verticalStepSize * i)
	}        	


	ctx.stroke();        
}


