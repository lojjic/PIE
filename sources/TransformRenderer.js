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
			props = this.styleInfos.transformInfo.getProps(),
			matrix = props.matrix,
			oH = el.offsetHeight,
			oW = el.offsetWidth, m, origin;
		/**
		 * TODO: Correct for transformation origin
		 m = [1,0,-oW/2,0,1,-oH/2,0,0,1];
		m = this.styleInfos.transformInfo.matrixMult(m, matrix);
		*/
		m = matrix;
		el.style.filter = 'progid:DXImageTransform.Microsoft.Matrix( M11=' + m[0] + ', M12=' + m[1] + ', M21=' + m[3] + ', M22=' + m[4] + ', Dx=' + m[2] + ', Dy=' + m[5] + ', sizingMethod=\'auto expand\')';

		el._PIE = true;
	},

	destroy: function() {
		PIE.RendererBase.destroy.call( this );
	}
} );