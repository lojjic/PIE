/**
 * Renderer for transform.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.TransformRenderer = PIE.RendererBase.newRenderer( {

	isActive: function() {
        var si = this.styleInfos;
        return si.transformInfo.isActive();
    },
	
    /**
	* Apply the transforms
	*/
	draw: function() {
		var el = this.targetElement,
			rotate = this.styleInfos.transformInfo.getProps().rotate, 
			m = this.styleInfos.transformInfo.getProps().m,
			oH = el.offsetHeight,
			oW = el.offsetWidth, origin;

		this.boundsInfo.lock();
		var b = this.boundsInfo.getBounds();
		//alert(b.x+','+b.y+','+b.w+','+b.h);
		
		m = m.rotate(-2*rotate);
		el.style.filter = 'progid:DXImageTransform.Microsoft.Matrix( M11=' + m['a'] + ', M12=' + m['b'] + ', M21=' + m['c'] + ', M22=' + m['d'] + ', Dx=' + m['e'] + ', Dy=' + m['f'] + ', sizingMethod=\'auto expand\')';

		el._PIE = true;
	},

	destroy: function() {
		PIE.RendererBase.destroy.call( this );
	}
} );