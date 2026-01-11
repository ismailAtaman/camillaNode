/**
 * Constant: QUADLEN
 * Description: This constant defines the number of points calculated in the frequency response calculation.
 * Usage: Used in functions like `calculateFilterDataMatrix` to determine the length of arrays that store frequency response data.
 */
const QUADLEN = 2048;

/**
 * Constant: textMargin
 * Description: Defines the margin used for text placement, particularly for labeling axes.
 * Usage: Applied in canvas drawing functions, such as `createGrid`, to offset text labels from the edges of the canvas for clarity.
 */
const textMargin = 40;

/**
 * Constant: leftMargin
 * Description: Margin space used as a buffer on the left side of the canvas to accommodate labels or axes.
 * Usage: Used in functions like `createGrid` and `freqToX`, helping to position elements correctly relative to the left edge of the canvas.
 */
const leftMargin = 35;

/**
 * Constant: verticalDBRange
 * Description: Number of vertical steps for drawing dB scale on the canvas.
 * Usage: Utilized in `createGrid` to determine the number of horizontal grid lines based on decibels, facilitating visual scaling of gain values.
 */
const verticalDBRange = 30;

/**
 * Constant: MIN_FREQ
 * Description: The minimum frequency (in Hz) considered in the logarithmic frequency mapping.
 * Usage: Used in functions like `freqToX` to set bounds for frequency mapping, ensuring calculations start from this base frequency.
 */
const MIN_FREQ = 20;

/**
 * Constant: MAX_FREQ
 * Description: The maximum frequency (in Hz) considered in the logarithmic frequency mapping.
 * Usage: Paired with MIN_FREQ in mapping functions (`freqToX` and `xToFreq`) for setting upper bounds on frequency calculations and drawings.
 */
const MAX_FREQ = 20000;

/**
 * Constant: HEIGHT_SCALE
 * Description: Multiplier for converting gain (in dB) to Y-coordinates on the canvas.
 * Usage: Applied in functions like `plotArray` and `drawFilterMarker` to translate dB gain values into corresponding vertical positions on the plot.
 */
const HEIGHT_SCALE = 16.5;

/**
 * Calculate the filter data matrix for different filter types with given frequency, gain, and Q factor.
 * @param {string} type - The type of filter (e.g., "Lowpass", "Highshelf").
 * @param {number} freq - The frequency at which the filter operates.
 * @param {number} gain - The gain value in decibels for the filter.
 * @param {number} qfact - The quality factor for the filter.
 * @returns {Array<Array<number>>} Magnitude plot array consisting of frequency and gain pairs.
 */
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

/**
 * Plot an array of frequency and gain values on the canvas.
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
 * @param {Array<Array<number>>} array - The array containing frequency and gain pairs.
 * @param {string} col - The color used for the plot line (hex or color name).
 * @param {number} lineWidth - The width of the plot line.
 * @returns {Object} The color and lineWidth used for plotting.
 */
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

	const heightScale= 16.5; 
	
	for (let i=0;i<array.length;i++) {
		// Convert array index to frequency, then frequency to X coordinate
		const freq = indexToFreq(i, array.length);
		x = freqToX(freq, w);
		y = ch-(heightScale* array[i][1]);
		ctx.lineTo(x,y);				
	}        
	ctx.stroke();               
	return {"color":col,"lineWidth":lineWidth};	
}

/**
 * Create a grid with horizontal and vertical lines for additional visual reference.
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
 * @returns {void}
 */
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

/**
 * Create a grid on the canvas for better visualization of frequency and gain scales.
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
 * @returns {void}
 */
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

/**
 * Generate a palette of visually distinct colors based on the number of filter types
 * @param {number} count - Number of colors needed
 * @returns {Array<string>} Array of color hex strings
 */
function generateColorPalette(count) {
	const colors = [];
	const saturation = 70; // 70% saturation for vibrant colors
	const lightness = 60;  // 60% lightness for good visibility
	
	for (let i = 0; i < count; i++) {
		// Distribute hues evenly around the color wheel
		const hue = (i * 360 / count) % 360;
		const color = hslToHex(hue, saturation, lightness);
		colors.push(color);
	}
	
	return colors;
}

/**
 * Convert HSL to hex color string
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string (e.g., "#FF5733")
 */
function hslToHex(h, s, l) {
	s /= 100;
	l /= 100;
	
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs((h / 60) % 2 - 1));
	const m = l - c / 2;
	
	let r = 0, g = 0, b = 0;
	
	if (h >= 0 && h < 60) {
		r = c; g = x; b = 0;
	} else if (h >= 60 && h < 120) {
		r = x; g = c; b = 0;
	} else if (h >= 120 && h < 180) {
		r = 0; g = c; b = x;
	} else if (h >= 180 && h < 240) {
		r = 0; g = x; b = c;
	} else if (h >= 240 && h < 300) {
		r = x; g = 0; b = c;
	} else if (h >= 300 && h < 360) {
		r = c; g = 0; b = x;
	}
	
	const toHex = (val) => {
		const hex = Math.round((val + m) * 255).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	};
	
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Create a mapping of filter types to colors
 * @param {Array<string>} types - Array of filter type names
 * @returns {Object} Object mapping type names to color hex strings
 */
function createTypeColorMap(types) {
	const colors = generateColorPalette(types.length);
	const typeColorMap = {};
	
	types.forEach((type, index) => {
		typeColorMap[type] = colors[index];
	});
	
	return typeColorMap;
}

/**
 * Convert array index to frequency (Hz) based on the logarithmic scale used in calculateFilterDataMatrix
 * @param {number} idx - Array index
 * @param {number} len - Total array length
 * @returns {number} Frequency in Hz
 */
function indexToFreq(idx, len) {
	// This matches the frequency calculation in calculateFilterDataMatrix
	// w ranges from 0.001 to 1 (normalized to Nyquist frequency)
	const w = Math.exp(Math.log(1 / 0.001) * idx / (len - 1)) * 0.001;
	// Convert normalized frequency to actual frequency (sampleRate/2 = 20000 Hz)
	return w * 20000;
}

/**
 * Convert frequency (Hz) to canvas X coordinate using logarithmic scale
 * @param {number} freq - Frequency in Hz
 * @param {number} canvasWidth - Total canvas width
 * @returns {number} X coordinate on canvas
 */
function freqToX(freq, canvasWidth) {
	const width = canvasWidth - textMargin;
	const logMin = Math.log10(MIN_FREQ);
	const logMax = Math.log10(MAX_FREQ);
	const logFreq = Math.log10(Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq)));
	
	return leftMargin + ((logFreq - logMin) / (logMax - logMin)) * width;
}

/**
 * Convert canvas X coordinate to frequency (Hz) using logarithmic scale (inverse of freqToX)
 * @param {number} x - X coordinate on canvas
 * @param {number} canvasWidth - Total canvas width
 * @returns {number} Frequency in Hz
 */
function xToFreq(x, canvasWidth) {
	const width = canvasWidth - textMargin;
	const logMin = Math.log10(MIN_FREQ);
	const logMax = Math.log10(MAX_FREQ);
	const normalizedX = (x - leftMargin) / width;
	const logFreq = logMin + normalizedX * (logMax - logMin);
	const freq = Math.pow(10, logFreq);
	return Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq));
}

/**
 * Convert gain (dB) to canvas Y coordinate
 * @param {number} gain - Gain in dB
 * @param {number} canvasHeight - Total canvas height
 * @returns {number} Y coordinate on canvas
 */
function gainToY(gain, canvasHeight) {
	const centerY = canvasHeight / 2;
	return centerY - (gain * HEIGHT_SCALE);
}

/**
 * Convert canvas Y coordinate to gain (dB) (inverse of gainToY)
 * @param {number} y - Y coordinate on canvas
 * @param {number} canvasHeight - Total canvas height
 * @returns {number} Gain in dB
 */
function yToGain(y, canvasHeight) {
	const centerY = canvasHeight / 2;
	return (centerY - y) / HEIGHT_SCALE;
}

/**
 * Draw a filter marker (dot and Q-value line) at the specified filter position
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} freq - Filter frequency in Hz
 * @param {number} gain - Filter gain in dB
 * @param {number} q - Filter Q value
 * @param {string} color - Color for the marker (hex string)
 * @param {Object} options - Additional options for extensibility
 * @param {number} options.dotRadius - Radius of the dot (default: 6px for ~12px diameter)
 * @param {number} options.qLineHeight - Height of Q-value delimiter lines (default: 8px)
 * @param {number} options.minQLineWidth - Minimum Q line width (default: 30px)
 * @param {number} options.maxQLineWidth - Maximum Q line width (default: 80px)
 * @param {boolean} options.isSelected - Whether marker is selected (default: false)
 * @return {void}
 */
function drawFilterMarker(ctx, freq, gain, q, color, options = {}) {
	const dotRadius = options.dotRadius || 6;
	const qLineHeight = options.qLineHeight || 8;
	const minQLineWidth = options.minQLineWidth || 30;
	const maxQLineWidth = options.maxQLineWidth || 250;
	const isSelected = options.isSelected || false;
	
	// Calculate canvas coordinates
	const x = freqToX(freq, ctx.canvas.width);
	const y = gainToY(gain, ctx.canvas.height);
	
	// Calculate Q line width - map Q value to consistent visual width
	// Lower Q = wider bandwidth = longer line
	// Higher Q = narrower bandwidth = shorter line
	// Q typically ranges from 0.5 to 10+, we'll map this inversely
	const qNormalized = Math.max(0.5, Math.min(10, q)); // Clamp Q between 0.5 and 10
	const qLineWidth = maxQLineWidth - ((qNormalized - 0.5) / (10 - 0.5)) * (maxQLineWidth - minQLineWidth);
	
	// Draw Q-value horizontal line with delimiters
	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth = isSelected ? 2.5 : 1.5;
	ctx.setLineDash([]);
	
	// Horizontal line
	ctx.beginPath();
	ctx.moveTo(x - qLineWidth / 2, y);
	ctx.lineTo(x + qLineWidth / 2, y);
	ctx.stroke();
	
	// Left delimiter
	ctx.beginPath();
	ctx.moveTo(x - qLineWidth / 2, y - qLineHeight / 2);
	ctx.lineTo(x - qLineWidth / 2, y + qLineHeight / 2);
	ctx.stroke();
	
	// Right delimiter
	ctx.beginPath();
	ctx.moveTo(x + qLineWidth / 2, y - qLineHeight / 2);
	ctx.lineTo(x + qLineWidth / 2, y + qLineHeight / 2);
	ctx.stroke();
	
	// Draw the dot
	const actualRadius = isSelected ? dotRadius * 1.3 : dotRadius;
	ctx.beginPath();
	ctx.arc(x, y, actualRadius, 0, 2 * Math.PI);
	ctx.fillStyle = color;
	ctx.fill();
	
	// Add a border to the dot for better visibility
	ctx.strokeStyle = '#FFF';
	ctx.lineWidth = isSelected ? 2.5 : 1.5;
	ctx.stroke();
	
	// Draw glow effect if selected
	if (isSelected) {
		ctx.shadowColor = color;
		ctx.shadowBlur = 15;
		ctx.beginPath();
		ctx.arc(x, y, actualRadius, 0, 2 * Math.PI);
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.shadowBlur = 0;
	}
	
	ctx.restore();
}

/**
 * Main function to plot EQ filters on a canvas
 * @param {Object} filterObject - Object containing filter definitions
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on	
 * @param {string} name - Name of the filter to plot	
 * @param {string} color - Color of the filter plot			
 * @param {number} channelNo - Channel number (for multi-channel plots)								
 * @param {Object} options - Additional options for plotting
 * @param {Function} options.markerFilter - Function(filterName, filterDef) => boolean to show marker
 * @param {Function} options.interactiveFilter - Function(filterName, filterDef) => boolean to make interactive
 * @param {boolean} options.appendMarkers - Append to existing markers (multi-channel)
 * @param {boolean} options.drawGrid - Draw grid (disable for multi-channel overlays)
 * @param {Set<string>|Array<string>} options.selectedFilterBases - Set of filter base names to highlight
 * @returns {Array<Array<number>>} Total response array
 */
function plot(filterObject, canvas, name, color, channelNo, options = {}) {
	// Default options
	const {
		markerFilter = null,        // function(filterName, filterDef) => boolean to show marker
		interactiveFilter = null,   // function(filterName, filterDef) => boolean to make interactive
		appendMarkers = false,      // append to existing markers (multi-channel)
		drawGrid = true,            // draw grid (disable for multi-channel overlays)
		selectedFilterBases = null  // Set/Array of filter base names to highlight
	} = options;
	
	const ctx = canvas;        
	const context = ctx.getContext('2d');             
	let newColor;
	if (color!=undefined) newColor = color.toString(16); else newColor="6688BB"
	// console.log("Color ",newColor)

	// Clear the canvas	
	// context.clearRect(0, 0, ctx.width, ctx.height);        	
	

	// Create the grid
	if (drawGrid) {
		createGrid(ctx);
	}
	
	canvas.totalArray = plotFilters(Object.keys(filterObject),ctx,color,channelNo,markerFilter,interactiveFilter,appendMarkers,selectedFilterBases);

	function plotFilters(filters, ctx, color, channelNo, markerFilter, interactiveFilter, appendMarkers, selectedFilterBases) {
		let totalArray = new Array(QUADLEN).fill(0).map(() => new Array(QUADLEN).fill(0));
		let dataMatrix=[];	
		let filterNum=0;
		let filterMarkers = []; // Store filter data for marker drawing
		
		// Get the 2D context from the canvas for marker drawing
		const context = ctx.getContext('2d');
		
		// Extract all unique filter subtypes to create color mapping
		const filterSubtypes = new Set();
		for (let filter of filters) {
			if (filterObject[filter].type === "Biquad" && filterObject[filter].parameters.type) {
				filterSubtypes.add(filterObject[filter].parameters.type);
			}
		}
		
		// Create type-to-color mapping
		const subtypeArray = Array.from(filterSubtypes).sort(); // Sort for consistency
		const typeColorMap = createTypeColorMap(subtypeArray);
		
		for (let filter of filters) {  
			// if (filterObject[filter].type=="Gain") continue;
			
			if (filterObject[filter].type!="Biquad") continue;
			if (filterObject[filter].parameters.type!="Peaking" && filterObject[filter].parameters.type!="Highshelf" && filterObject[filter].parameters.type!="Lowshelf") continue;
	
			dataMatrix = calculateFilterDataMatrix(filterObject[filter].parameters.type, filterObject[filter].parameters.freq, filterObject[filter].parameters.gain, filterObject[filter].parameters.q);                        
			for (let i=0;i<dataMatrix.length;i++) {
				totalArray[i][0]=dataMatrix[i][0]
				totalArray[i][1]=dataMatrix[i][1]+totalArray[i][1];        
			}
			
			// Use the old color scheme for the response curves
			let newColor = colorChange(color,filterNum);
			plotArray(ctx,dataMatrix,"#"+newColor,0.5);
			
			// Get type-based color for the marker
			const filterSubtype = filterObject[filter].parameters.type;
			const markerColor = typeColorMap[filterSubtype] || "#FFFFFF";
			
			// Calculate canvas coordinates for hit testing
			const x = freqToX(filterObject[filter].parameters.freq, ctx.width);
			const y = gainToY(filterObject[filter].parameters.gain, ctx.height);
			const dotRadius = 6; // Match default in drawFilterMarker
			
			// Determine if this marker should be visible and interactive
			const filterDef = filterObject[filter];
			const shouldShowMarker = markerFilter ? markerFilter(filter, filterDef) : true;
			const isInteractive = interactiveFilter ? interactiveFilter(filter, filterDef) : shouldShowMarker;
			
			// Only add marker if it should be shown
			if (shouldShowMarker) {
				// Compute filter base name (strip channel suffix for dual-channel matching)
				const filterBase = filter.replace(/__c\d+$/, '');
				
				// Check if this marker should be selected
				const isSelected = selectedFilterBases && 
					(selectedFilterBases instanceof Set ? selectedFilterBases.has(filterBase) : selectedFilterBases.includes(filterBase));
				
				// Store filter parameters for marker drawing with identity
				filterMarkers.push({
					id: filter + (channelNo !== undefined ? `_ch${channelNo}` : ''),
					filterName: filter,
					filterBase: filterBase,
					channelNo: channelNo,
					freq: filterObject[filter].parameters.freq,
					gain: filterObject[filter].parameters.gain,
					q: filterObject[filter].parameters.q,
					type: filterSubtype,
					color: markerColor,
					x: x,
					y: y,
					dotRadius: dotRadius,
					interactive: isInteractive,
					isSelected: isSelected
				});
			}
			
			filterNum++;
		}
		
		// Draw the total response line
		let t= plotArray(ctx, totalArray,"#FFF",2.5);
		
		// Draw filter markers on top of all curves
		for (let marker of filterMarkers) {
			drawFilterMarker(context, marker.freq, marker.gain, marker.q, marker.color, {
				isSelected: marker.isSelected
			});
		}
		
		// Store marker metadata on canvas for interaction
		// If appendMarkers is true, accumulate markers (for multi-channel)
		if (appendMarkers && ctx.__eqMarkers) {
			ctx.__eqMarkers = ctx.__eqMarkers.concat(filterMarkers);
		} else {
			ctx.__eqMarkers = filterMarkers;
		}
		
		return totalArray;
	}


	// Centre and print the config name 
	if (name!=undefined) {
		context.font="16px Abel";            
		context.fillStyle="#FFF";
		const nameText = " "+name+" "
		const textWidth = context.measureText(nameText).width;
		const nameLeft = (canvas.width - textWidth)/2;
		context.fillText(nameText,nameLeft,12);            
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

/**
 * Enable interactive dragging of EQ plot markers
 * @param {HTMLCanvasElement} canvas - The canvas element containing the plot
 */
export function enableEqPlotInteraction(canvas) {
	const HIT_SLOP = 10; // Extra pixels around marker for easier clicking
	const MIN_GAIN = -15; // Match plot vertical range
	const MAX_GAIN = 15;
	const MIN_Q = 0.1;
	const MAX_Q = 10;
	
	let dragState = null; // { marker, startX, startY, startFreq, startGain, startQ }
	
	// Map client coordinates to canvas internal coordinates
	function getCanvasPoint(evt) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (evt.clientX - rect.left) * scaleX,
			y: (evt.clientY - rect.top) * scaleY
		};
	}
	
	// Find marker at given canvas coordinates
	function findMarkerAt(x, y) {
		if (!canvas.__eqMarkers) return null;
		
		for (let marker of canvas.__eqMarkers) {
			// Skip non-interactive markers
			if (!marker.interactive) continue;
			
			const dx = x - marker.x;
			const dy = y - marker.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist <= marker.dotRadius + HIT_SLOP) {
				return marker;
			}
		}
		return null;
	}
	
	// Dispatch custom event for pages to handle
	function emitMarkerEvent(eventType, marker, params, gesture) {
		const event = new CustomEvent(eventType, {
			detail: {
				markerId: marker.id,
				filterName: marker.filterName,
				channelNo: marker.channelNo,
				params: params,
				gesture: gesture,
				source: 'eqplot'
			},
			bubbles: true
		});
		canvas.dispatchEvent(event);
	}
	
	function onPointerDown(evt) {
		const pt = getCanvasPoint(evt);
		const marker = findMarkerAt(pt.x, pt.y);
		
		if (marker) {
			evt.preventDefault();
			dragState = {
				marker: marker,
				startX: pt.x,
				startY: pt.y,
				startFreq: marker.freq,
				startGain: marker.gain,
				startQ: marker.q,
				shiftKey: evt.shiftKey
			};
			
			canvas.style.cursor = 'grabbing';
			window.__eqplotDragInProgress = true;
			
			// Emit select event on click (selection happens immediately)
			emitMarkerEvent('eqplot:marker-select', marker, {
				freq: marker.freq,
				gain: marker.gain,
				q: marker.q
			}, {
				shiftKey: evt.shiftKey,
				x: pt.x,
				y: pt.y
			});
			
			emitMarkerEvent('eqplot:marker-drag-start', marker, {
				freq: marker.freq,
				gain: marker.gain,
				q: marker.q
			}, {
				shiftKey: evt.shiftKey,
				x: pt.x,
				y: pt.y
			});
		}
	}
	
	function onPointerMove(evt) {
		if (!dragState) {
			// Update cursor on hover
			const pt = getCanvasPoint(evt);
			const marker = findMarkerAt(pt.x, pt.y);
			canvas.style.cursor = marker ? 'grab' : 'default';
			return;
		}
		
		evt.preventDefault();
		const pt = getCanvasPoint(evt);
		const params = {};
		
		if (dragState.shiftKey || evt.shiftKey) {
			// Shift+drag: update Q based on vertical delta
			const deltaY = pt.y - dragState.startY;
			// Use exponential scaling: moving down increases Q, up decreases Q
			const qScale = Math.exp(-deltaY / 120);
			let newQ = dragState.startQ * qScale;
			newQ = Math.max(MIN_Q, Math.min(MAX_Q, newQ));
			newQ = Math.round(newQ * 100) / 100; // Round to 2 decimals
			params.q = newQ;
		} else {
			// Normal drag: update frequency and gain
			let newFreq = xToFreq(pt.x, canvas.width);
			newFreq = Math.round(newFreq); // Round to nearest Hz
			params.freq = newFreq;
			
			let newGain = yToGain(pt.y, canvas.height);
			newGain = Math.max(MIN_GAIN, Math.min(MAX_GAIN, newGain));
			newGain = Math.round(newGain * 10) / 10; // Round to 1 decimal
			params.gain = newGain;
		}
		
		emitMarkerEvent('eqplot:marker-drag', dragState.marker, params, {
			shiftKey: dragState.shiftKey || evt.shiftKey,
			x: pt.x,
			y: pt.y
		});
	}
	
	function onPointerUp(evt) {
		if (!dragState) return;
		
		evt.preventDefault();
		const pt = getCanvasPoint(evt);
		
		emitMarkerEvent('eqplot:marker-drag-end', dragState.marker, {}, {
			shiftKey: dragState.shiftKey,
			x: pt.x,
			y: pt.y
		});
		
		dragState = null;
		canvas.style.cursor = 'default';
		window.__eqplotDragInProgress = false;
	}
	
	function onPointerCancel(evt) {
		if (dragState) {
			dragState = null;
			canvas.style.cursor = 'default';
			window.__eqplotDragInProgress = false;
		}
	}
	
	// Attach listeners
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointercancel', onPointerCancel);
	canvas.addEventListener('pointerleave', onPointerUp); // End drag if pointer leaves canvas
	
	// Return cleanup function
	return function cleanup() {
		canvas.removeEventListener('pointerdown', onPointerDown);
		canvas.removeEventListener('pointermove', onPointerMove);
		canvas.removeEventListener('pointerup', onPointerUp);
		canvas.removeEventListener('pointercancel', onPointerCancel);
		canvas.removeEventListener('pointerleave', onPointerUp);
	};
}

export default plot;
