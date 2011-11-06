/**
 * Renderer for re-rendering img elements using VML. Kicks in if the img has
 * a border-radius applied, or if the -pie-png-fix flag is set.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.ImgRenderer = PIE.RendererBase.newRenderer( {

    shapeZIndex: 6,

    needsUpdate: function() {
        var si = this.styleInfos;
        return this.targetElement.src !== this._lastSrc || si.borderRadiusInfo.changed();
    },

    isActive: function() {
        var si = this.styleInfos;
        return si.borderRadiusInfo.isActive() || si.backgroundInfo.isPngFix();
    },

    draw: function() {
        this._lastSrc = src;
        this.hideActualImg();

        var shape = this.getShape( 'img', this.shapeZIndex ),
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            borderProps = this.styleInfos.borderInfo.getProps(),
            borderWidths = borderProps && borderProps.widths,
            el = this.targetElement,
            src = el.src,
            round = Math.round,
            cs = el.currentStyle,
            getLength = PIE.getLength,
            zero;

        // In IE6, the BorderRenderer will have hidden the border by moving the border-width to
        // the padding; therefore we want to pretend the borders have no width so they aren't doubled
        // when adding in the current padding value below.
        if( !borderWidths || PIE.ieVersion < 7 ) {
            zero = PIE.getLength( '0' );
            borderWidths = { 't': zero, 'r': zero, 'b': zero, 'l': zero };
        }

        shape.setAttrs(
            'stroked', false,
            'path', this.getBoxPath( {
                t: round( borderWidths['t'].pixels( el ) + getLength( cs.paddingTop ).pixels( el ) ),
                r: round( borderWidths['r'].pixels( el ) + getLength( cs.paddingRight ).pixels( el ) ),
                b: round( borderWidths['b'].pixels( el ) + getLength( cs.paddingBottom ).pixels( el ) ),
                l: round( borderWidths['l'].pixels( el ) + getLength( cs.paddingLeft ).pixels( el ) )
            }, 2 )
        );
        shape.setFillAttrs(
            'type', 'frame',
            'src', src,
            'position', (w ? 0.5 / w : 0) + ',' + (h ? 0.5 / h : 0)
        );
        shape.setSize( w, h );
    },

    hideActualImg: function() {
        this.targetElement.runtimeStyle.filter = 'alpha(opacity=0)';
    },

    destroy: function() {
        PIE.RendererBase.destroy.call( this );
        this.targetElement.runtimeStyle.filter = '';
    }

} );
