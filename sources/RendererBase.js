PIE.RendererBase = {

    /**
     * Create a new Renderer class, with the standard constructor, and augmented by
     * the RendererBase's members.
     * @param proto
     */
    newRenderer: function( proto ) {
        function Renderer( el, boundsInfo, styleInfos, parent ) {
            this.targetElement = el;
            this.boundsInfo = boundsInfo;
            this.styleInfos = styleInfos;
            this.parent = parent;
        }
        PIE.merge( Renderer.prototype, PIE.RendererBase, proto );
        return Renderer;
    },

    /**
     * Determine if the renderer needs to be updated
     * @return {boolean}
     */
    needsUpdate: function() {
        return false;
    },

    /**
     * Run any preparation logic that would affect the main update logic of this
     * renderer or any of the other renderers, e.g. things that might affect the
     * element's size or style properties.
     */
    prepareUpdate: PIE.emptyFn,

    /**
     * Tell the renderer to update based on modified properties or element dimensions
     */
    updateRendering: function() {
        if( this.isActive() ) {
            this.draw();
        } else {
            this.destroy();
        }
    },

    /**
     * Hide the target element's border
     */
    hideBorder: function() {
        this.targetElement.runtimeStyle.borderColor = 'transparent';
    },

    /**
     * Destroy the rendered objects. This is a base implementation which handles common renderer
     * structures, but individual renderers may override as necessary.
     */
    destroy: function() {
    }
};
