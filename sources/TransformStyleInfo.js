/**
 * Handles parsing, caching, and detecting changes to transform CSS
 * @constructor
 * @param {Element} el the target element
 */
PIE.TransformStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

	cssProperty: 'transform',
	styleProperty: 'Transform',

	singleIdents: {'rotate': 1, 'matrix': 1},
	scaleIdents: {'scale': 1, 'scaleX': 1, 'scaleY': 1},
	skewIdents: {'skew': 1, 'skewX': 1, 'skewY': 1},
	translateIdents: {'translate': 1, 'translateX': 1, 'translateY': 1},

	deg2rad: Math.PI * 2 / 360,
    
	parseCss: function( css ) {
		var props = {}, property = {},
        	Type = PIE.Tokenizer.Type,
			tokenizer, token, tokType, tokVal;
		props.matrix = [1,0,0,0,1,0,0,0,1];
		
		tokenizer = new PIE.Tokenizer( css );
		while( token = tokenizer.next()) {
			tokType = token.tokenType;
			tokVal = token.tokenValue;
			
			if(tokType == Type.FUNCTION) {
				property.func = tokVal;
				property.values = [];
			} else if(tokType & Type.ANGLE || tokType & Type.NUMBER || tokType & Type.PERCENT || tokType & Type.LENGTH) {
				property.values.push(tokVal);
			} else if(tokType == Type.CHARACTER) {
				if(property.func == 'rotate') {
					props.matrix = this.rotateCalc(props, property);
				} else if(property.func in this.scaleIdents) {
					props.matrix = this.scaleCalc(props, property);
				} else if(property.func in this.skewIdents) {
					props.matrix = this.skewCalc(props, property);
				} else if(property.func in this.translateIdents) {
					props.matrix = this.translateCalc(props, property);
				} else if(property.func == 'matrix') {
					props.matrix = this.matrixCalc(props, property);
				}
				property = {};
			}
		}
		return props;
	},

	rotateCalc: function(props, property) {
		var m = [], rad, sin, cos;
		rad = parseFloat(property.values[0]) * this.deg2rad;
		cos = Math.cos(rad);
		sin = Math.sin(rad);
		return this.matrixMult(props.matrix,[cos, -sin, 0, sin, cos, 0, 0, 0, 1]);
	},

	scaleCalc: function(props, property) {
		var m = [1,0,0,0,1,0,0,0,1];
		if(property.func == 'scale') {
			m[0] = parseFloat(property.values[0]);
			if(property.values.length > 1) m[4] = parseFloat(property.values[1]);
			else m[4] = parseFloat(property.values[0]);
		}
		else if(property.func == 'scaleX') m[0] = parseFloat(property.values[0]);
		else if(property.func == 'scaleY') m[4] = parseFloat(property.values[0]);
		return this.matrixMult(props.matrix, m);
	},
	
	skewCalc: function(props, property) {
		var m = [1,0,0,0,1,0,0,0,1],
			val = Math.tan(parseFloat(property.values[0]) * this.deg2rad);
		if(property.func == 'skew') {
			m[1] = val;
			if(property.values.length > 1) m[3] = Math.tan(parseFloat(property.values[1]) * this.deg2rad);
		}
		else if(property.func == 'skewX') m[1] = val;
		else if(property.func == 'skewY') m[3] = val;
		return this.matrixMult(props.matrix, m);
	},
	
	translateCalc: function(props, property) {
		var m = [1,0,0,0,1,0,0,0,1];
		m[2] = parseInt(property.values[0]);
		if(property.func == 'translateY') {
			m[2] = 0;
			m[5] = parseInt(property.values[0]);
		}
		if(property.values.length > 1) m[5] = parseInt(property.values[1]); 
		
		return this.matrixMult(props.matrix, m);
	},

	matrixCalc: function(props, property) {
		var m = [property.values[0], property.values[2], property.values[4],
		         property.values[1], property.values[3], property.values[5],
		         0,					0,					1				];
		return this.matrixMult(props.matrix, m);
	},
	
	matrixMult: function(matrix1, matrix2) {
		var result = [], i = 0, j, k, x;
		for(; i < 3; i++) {
			for(j = 0; j < 3; j++) {
				x = 0;
				for(k = 0; k < 3; k++) {
					x += matrix1[(i*3)+k] * matrix2[(k*3) + j];
				}
				result[(i*3)+j] = x;
			}
		}
		return result;
	}
	
} );