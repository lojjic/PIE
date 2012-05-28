/**
 * Root renderer for IE9; manages the rendering layers in the element's background
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.IE9RootRenderer = PIE.RendererBase.newRenderer( {

    outerCommasRE: /^,+|,+$/g,
    innerCommasRE: /,+/g,

    setBackgroundLayer: function(zIndex, bg) {
        var me = this,
            bgLayers = me._bgLayers || ( me._bgLayers = [] ),
            undef;
        bgLayers[zIndex] = bg || undef;
    },

    updateRendering: function() {
        var me = this,
            bgLayers = me._bgLayers,
            bg;
        if( bgLayers && ( bg = bgLayers.join( ',' ).replace( me.outerCommasRE, '' ).replace( me.innerCommasRE, ',' ) ) !== me._lastBg ) {
            me._lastBg = me.targetElement.runtimeStyle.background = bg;
        }
    },

    destroy: function() {
        this.targetElement.runtimeStyle.background = '';
        delete this._bgLayers;
    }

} );
