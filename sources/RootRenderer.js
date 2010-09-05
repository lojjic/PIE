/**
 * Root renderer; creates the outermost container element and handles keeping it aligned
 * with the target element's size and position.
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.RootRenderer = PIE.RendererBase.newRenderer( {

    isActive: function() {
        var infos = this.styleInfos;
        for( var i in infos ) {
            if( infos.hasOwnProperty( i ) && infos[ i ].isActive() ) {
                return true;
            }
        }
        return false;
    },

    needsUpdate: function() {
        return this.styleInfos.visibilityInfo.changed();
    },

    updatePos: function() {
        if( this.isActive() ) {
            var el = this.targetElement,
                par = el,
                docEl,
                elBounds, parRect,
                s = this.getBox().style, cs,
                x = 0, y = 0;

            // Get the element's offsets from its nearest positioned ancestor. Uses
            // getBoundingClientRect for accuracy and speed.
            do {
                par = par.offsetParent;
            } while( par && par.currentStyle.position === 'static' );
            elBounds = this.boundsInfo.getBounds();
            if( par ) {
                parRect = par.getBoundingClientRect();
                cs = par.currentStyle;
                x = elBounds.x - parRect.left - ( parseFloat(cs.borderLeftWidth) || 0 );
                y = elBounds.y - parRect.top - ( parseFloat(cs.borderTopWidth) || 0 );
            } else {
                docEl = doc.documentElement;
                x = elBounds.x + docEl.scrollLeft - docEl.clientLeft;
                y = elBounds.y + docEl.scrollTop - docEl.clientTop;
            }

            s.left = x;
            s.top = y;
            s.zIndex = el.currentStyle.position === 'static' ? -1 : el.currentStyle.zIndex;
        }
    },

    updateSize: function() {
        // NO-OP
    },

    updateVisibility: function() {
        var vis = this.styleInfos.visibilityInfo.getProps();
        this.getBox().style.display = ( vis.visible && vis.displayed ) ? '' : 'none';
    },

    updateProps: function() {
        if( this.isActive() ) {
            this.updateVisibility();
        } else {
            this.destroy();
        }
    },

    getBox: function() {
        var box = this._box, el, s;
        if( !box ) {
            el = this.targetElement;
            box = this._box = doc.createElement( 'css3-container' );
            s = box.style;

            s.position = el.currentStyle.position === 'fixed' ? 'fixed' : 'absolute';
            this.updateVisibility();

            el.parentNode.insertBefore( box, el );
        }
        return box;
    },

    destroy: function() {
        var box = this._box;
        if( box && box.parentNode ) {
            box.parentNode.removeChild( box );
        }
        delete this._box;
        delete this._layers;
    }

} );
