

const QUADLEN = 2048;

const textMargin=40;
const leftMargin=35;

const verticalDBRange= 30;      

function calculateFilterDataMatrix(type, freq, gain, qfact) {	
	let sampleRate=40000;
	let a0,a1,a2,b1,b2,norm;	
	
	let V = Math.pow(10, Math.abs(gain) / 20);
	let K = Math.tan(Math.PI * freq /sampleRate);
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

		case "Lowpass":
			norm = 1 / (1 + K /qfact + K * K);
			a0 = K * K * norm;
			a1 = 2 * a0;
			a2 = a0;
			b1 = 2 * (K * K - 1) * norm;
			b2 = (1 - K /qfact + K * K) * norm;
			break;
		
		case "Highpass":
			norm = 1 / (1 + K /qfact + K * K);
			a0 = 1 * norm;
			a1 = -2 * a0;
			a2 = a0;
			b1 = 2 * (K * K - 1) * norm;
			b2 = (1 - K /qfact + K * K) * norm;
			break;
		
		case "Bandpass":
			norm = 1 / (1 + K /qfact + K * K);
			a0 = K /qfact * norm;
			a1 = 0;
			a2 = -a0;
			b1 = 2 * (K * K - 1) * norm;
			b2 = (1 - K /qfact + K * K) * norm;
			break;
		
		case "Notch":
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

	let len = QUADLEN;
	let magPlot = [];
	for (let idx = 0; idx < len; idx++) {
		let w;
		w = Math.exp(Math.log(1 / 0.001) * idx / (len - 1)) * 0.001 * Math.PI;	// 0.001 to 1, times pi, log scale
		let phi = Math.pow(Math.sin(w/2), 2);
		let y = Math.log(Math.pow(a0+a1+a2, 2) - 4*(a0*a1 + 4*a0*a2 + a1*a2)*phi + 16*a0*a2*phi*phi) - Math.log(Math.pow(1+b1+b2, 2) - 4*(b1 + 4*b2 + b1*b2)*phi + 16*b2*phi*phi);
		y = y * 10 / Math.LN10
		if (y == -Infinity) y = -200;		
		magPlot.push([ idx / (len - 1) / 2, y]);		
	}
	return magPlot;
	
}

function plotArray(canvas, array, col, lineWidth){       
	let ctx = canvas.getContext("2d");
	let h = canvas.height;    
	let w = canvas.width;    
	let ch = h / 2; 
	let x,y;


	ctx.beginPath();			
	ctx.strokeStyle = col;        
	ctx.lineWidth = lineWidth;
	ctx.setLineDash([]);

	let stepSize = (w - textMargin) / (array.length + 1 );
	const heightScale= 16.5; 
	
	for (let i=0;i<array.length;i++) {            		
		x=  textMargin + i * stepSize;								
		y = ch-(heightScale* array[i][1]);
		ctx.lineTo(x,y);				
	}        
	ctx.stroke();               
	return {"color":col,"lineWidth":lineWidth};	
}

function createGridEx(canvas) {
	let ctx = canvas.getContext("2d");

	let h = canvas.height;	
	let w = canvas.width;    		

	let verticalLineCount= 30;        	
	let verticalStepSize = h /verticalLineCount -1

	ctx.font="14px Abel";
	ctx.fillStyle = "#EEE";  	
	ctx.strokeStyle = "#CCC";        
	ctx.lineWidth = 0.5;
	ctx.setLineDash([1,5])
	

	ctx.beginPath();
	for (let i=1;i<verticalLineCount;i+=2) {    		
		ctx.moveTo(60,verticalStepSize * i);
		ctx.lineTo(w-10,verticalStepSize * i) 
		let level = (i + verticalLineCount/2 - verticalLineCount)*-1;
		ctx.fillText(level+"dB", 10 ,verticalStepSize * i)		
	}   
	ctx.stroke();     	
			
	ctx.beginPath();
	let xPos;
	const freqList = [[30,28],[40, 71],[50, 104],[60, 131],[70, 154],[80, 174],[90, 191],[100, 207],[200, 309],[300, 369],[400, 412],[500, 445],[600, 472],[700, 495],[800, 515],[900, 532],[1000, 548],[2000, 650],[3000, 711],[4000, 753],[5000, 786],[6000, 814],[7000, 837],[8000, 857],[9000, 874],[10000, 890],[11000, 904],[12000, 918],[13000, 930],[14000, 941],[15000, 951],[16000, 961],[17000, 971],[18000, 979],[19000, 988],[20000, 996]]
	for (let i=0;i<freqList.length;i++) {		
	
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

function createGrid(canvas) {
	let ctx = canvas.getContext("2d");
	
	const height = canvas.height - textMargin;
	const width = canvas.width - textMargin;    		
	  	
	let verticalStepSize = (height + textMargin) /verticalDBRange;

	ctx.font="14px Abel";
	ctx.fillStyle = "#DDD";  	
	ctx.strokeStyle = "#CCC";        
	ctx.lineWidth = 0.5;
	ctx.setLineDash([1,5])
	
	// Vertical lines and level scale
	ctx.beginPath();
	for (let i=1;i<verticalDBRange;i+=2) {    		

		ctx.moveTo(textMargin,verticalStepSize * i);
		ctx.lineTo(width + textMargin,verticalStepSize * i) 
		let level = (i + verticalDBRange/2 - verticalDBRange)*-1;
		ctx.fillText(level+"dB", 0 ,verticalStepSize * i)		
	}   
	ctx.stroke();     	
			
	// Horizontal lines and frequency scale
	ctx.beginPath();
	let xPos;
	const freqList = [[20,4],[30,65],[40, 107],[50, 140],[60, 167],[70, 190],[80, 209],[90, 227],[100, 243]
					,[200, 345],[300, 406],[400, 448],[500, 482],[600, 509],[700, 531],[800, 551],[900, 569],[1000, 584]
					,[2000, 686],[3000, 746],[4000, 789],[5000, 822],[6000, 849],[7000, 872],[8000, 891],[9000, 909],[10000, 925]
					,[11000, 939],[12000, 952],[13000, 964],[14000, 974],[15000, 985],[16000, 994],[17000, 1003],[18000, 1012],[19000, 1020]]
	for (let i=0;i<freqList.length;i++) {				
		xPos= leftMargin+(freqList[i][1]/1024*width);
		// xPos= 35+freqList[i][1]

		switch(freqList[i][0]) {
			case 100:
			case 1000:
			case 10000:
				ctx.fillText(new Intl.NumberFormat("en-US").format(freqList[i][0]) +"Hz", xPos-20, height+textMargin);				
		}		
		ctx.moveTo(xPos,16);
		ctx.lineTo(xPos,height+24);						
	}
	ctx.stroke();
	
	// // Horizontal lines at 100, 1,000 and 10,000Hz
	ctx.strokeStyle = "#DDD";
	ctx.lineWidth = 0.8;
	ctx.setLineDash([3,5]);
	
	ctx.beginPath();
	ctx.moveTo(leftMargin + (243/1024*width),16);
	ctx.lineTo(leftMargin + (243/1024*width),height+24);		

	ctx.moveTo(leftMargin + (584/1024*width),16);
	ctx.lineTo(leftMargin + (584/1024*width),height+24);		

	ctx.moveTo(leftMargin + (925/1024*width),16);
	ctx.lineTo(leftMargin + (925/1024*width),height+24);		

	ctx.stroke();
	
}

function plot(filterObject, canvas, name, color) {
	const ctx = canvas;        
	const context = ctx.getContext('2d');             
	let newColor;
	if (color!=undefined) newColor = color.toString(16); else newColor="6688BB"
	console.log("Color ",newColor)

	// Clear the canvas	
	// context.clearRect(0, 0, ctx.width, ctx.height);        	
	

	// Create the grid
	createGrid(ctx); 
	
	canvas.totalArray = plotFilters(Object.keys(filterObject),ctx,color);

	function plotFilters(filters, ctx, color) {
		let totalArray = new Array(QUADLEN).fill(0).map(() => new Array(QUADLEN).fill(0));
		let dataMatrix=[];	
		let filterNum=0;
		for (let filter of filters) {  
			// if (filterObject[filter].type=="Gain") continue;
			
			if (filterObject[filter].type!="Biquad") continue;
			if (filterObject[filter].parameters.type!="Peaking" && filterObject[filter].parameters.type!="Highshelf" && filterObject[filter].parameters.type!="Lowshelf") continue;
	
			dataMatrix = calculateFilterDataMatrix(filterObject[filter].parameters.type, filterObject[filter].parameters.freq, filterObject[filter].parameters.gain, filterObject[filter].parameters.q);                        
			for (let i=0;i<dataMatrix.length;i++) {
				totalArray[i][0]=dataMatrix[i][0]
				totalArray[i][1]=dataMatrix[i][1]+totalArray[i][1];        
			}
			let newColor = colorChange(color,filterNum)						
			plotArray(ctx,dataMatrix,"#"+newColor,0.2);		
			filterNum++;
			
		}
		
		let t= plotArray(ctx, totalArray,"#FFF",2.5);					
		return totalArray;
	}


	// Centre and print the config name 
	if (name!=undefined) {
		context.font="15px Abel";            
		context.fillStyle="#FEC"
		const nameText = " "+name+" "
		const textWidth = context.measureText(nameText).width;
		const nameLeft = (canvas.width - textWidth)/2;
		context.fillText(nameText,nameLeft,40);            
	}

	let max = Math.round(Math.max(...canvas.totalArray[1]));
	// console.log("Max ",max);
	return max;
}

function colorChange(startColor,colorIndex) {
	let colorText;
	if (typeof(startColor)=="number") colorText = startColor.toString(16); else colorText=startColor;

	let red = parseInt(colorText.substring(0,2),16);
	let green = parseInt(colorText.substring(2,4),16);
	let blue = parseInt(colorText.substring(4),16);
	
    // console.log("Color Text :",colorText,"\tR:",red,"G:",green,"B:",blue);
	red  = (red + 1 * colorIndex) % 255;
	green = (green + 4 * colorIndex) % 255;
	blue = (blue + 2 * colorIndex) % 255;

	let changedColor = (red+green*255+blue*255*255).toString(16);
	// console.log("New color #",colorIndex,":",changedColor)
	return changedColor;
	
}

export default plot;