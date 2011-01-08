/**
 * Renderer for re-rendering img elements using VML. Kicks in if the img has
 * a border-radius applied, or if the -pie-png-fix flag is set.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.ImgRenderer = PIE.RendererBase.newRenderer( {

    boxZIndex: 6,
    boxName: 'imgEl',

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

        var shape = this.getShape( 'img', 'fill', this.getBox() ),
            fill = shape.fill,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            borderProps = this.styleInfos.borderInfo.getProps(),
            borderWidths = borderProps && borderProps.widths,
            el = this.targetElement,
            src = el.src,
            round = Math.round,
            s;

        shape.stroked = false;
        fill.type = 'frame';
        fill.src = src;
        fill.position = (w ? 0.5 / w : 0) + ',' + (h ? 0.5 / h : 0);
        shape.coordsize = w * 2 + ',' + h * 2;
        shape.coordorigin = '1,1';
        shape.path = this.getBoxPath( borderWidths ? {
            t: round( borderWidths['t'].pixels( el ) ),
            r: round( borderWidths['r'].pixels( el ) ),
            b: round( borderWidths['b'].pixels( el ) ),
            l: round( borderWidths['l'].pixels( el ) )
        } : 0, 2 );
        s = shape.style;
        s.width = w;
        s.height = h;
    },

    hideActualImg: function() {
        this.targetElement.runtimeStyle.filter = 'alpha(opacity=0)';
    },

    destroy: function() {
        PIE.RendererBase.destroy.call( this );
        this.targetElement.runtimeStyle.filter = '';
    }

} );
