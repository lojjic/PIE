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
		var props = {m: {}, matrix:{}, rotate: 0,
				skew: {x:0,y:0}, translate: {x:0,y:0},
				scale: {x:0,y:0}}, prop = {}, el = this.targetElement,
			rect = el.getBoundingClientRect(),
        	Type = PIE.Tokenizer.Type,
			tokenizer, token, tokType, tokVal,
			m = new PIE.Matrix(1,0,0,1,0,0);		

		m.translate((rect.right - rect.left)/2, (rect.bottom - rect.top) / 2);
		tokenizer = new PIE.Tokenizer( css );
		while( token = tokenizer.next()) {
			tokType = token.tokenType;
			tokVal = token.tokenValue;
			
			if(tokType == Type.FUNCTION) {
				prop.f = tokVal;
				prop.v = [];
			} else if(tokType & Type.ANGLE || tokType & Type.NUMBER || tokType & Type.PERCENT || tokType & Type.LENGTH) {
				prop.v.push(parseFloat(tokVal));
			} else if(tokType == Type.CHARACTER) {
				if(prop.f == 'rotate') {
					m = m.rotate(prop.v[0]);
					props.rotate += parseFloat(prop.v[0]);
				} else if(prop.f in this.scaleIdents) {
					m = m.scale(prop.v[0], prop.v[1] || prop.v[0]);
					props.scale.x *= prop.v[0];
					props.scale.y *= prop.v[1] || prop.v[0]
				} else if(prop.f in this.skewIdents) {
					m = m.skew(prop.v[0], prop.v[1] || prop.v[0]);
					props.skew.x += prop.v[0];
					props.skew.y += prop.v[1] || prop.v[0];
				} else if(prop.f in this.translateIdents) {
					m = m.translate(prop.v[0], prop.v[1] || prop.v[0]);
					props.translate.x += parseInt(prop.v[0]);
					props.translate.y += parseInt(prop.v[1] || prop.v[0]);
				} else if(prop.f == 'matrix') {
					m = m.multiply(new PIE.Matrix(
							prop.v[0], prop.v[1], 
							prop.v[2], prop.v[3], 
							prop.v[4], prop.v[5]));
					props.matrix = new PIE.Matrix(
							prop.v[0], prop.v[1], 
							prop.v[2], prop.v[3], 
							prop.v[4], prop.v[5]);
				}
				prop = {};
			}
		}
		m.translate(-(rect.right - rect.left)/2, -(rect.bottom - rect.top) / 2);
		props.m = m;
		return props;
	}	
} );