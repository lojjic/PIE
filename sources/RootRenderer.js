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
            var el = this.element,
                par = el,
                docEl,
                elRect, parRect,
                s = this.getBox().style, cs,
                x = 0, y = 0;

            // Get the element's offsets from its nearest positioned ancestor. Uses
            // getBoundingClientRect for accuracy and speed.
            do {
                par = par.offsetParent;
            } while( par && par.currentStyle.position === 'static' );
            elRect = el.getBoundingClientRect();
            if( par ) {
                parRect = par.getBoundingClientRect();
                cs = par.currentStyle;
                x = elRect.left - parRect.left - ( parseFloat(cs.borderLeftWidth) || 0 );
                y = elRect.top - parRect.top - ( parseFloat(cs.borderTopWidth) || 0 );
            } else {
                docEl = el.document.documentElement;
                x = elRect.left + docEl.scrollLeft - docEl.clientLeft;
                y = elRect.top + docEl.scrollTop - docEl.clientTop;
            }

            s.left = x;
            s.top = y;
            s.zIndex = el.currentStyle.position === 'static' ? -1 : el.currentStyle.zIndex;
        }
    },

    updateSize: function() {
        if( this.isActive() ) {
            var el = this.element,
                s = this.getBox().style,
                i, len;

            s.width = el.offsetWidth;
            s.height = el.offsetHeight;
        }
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
            el = this.element;
            box = this._box = el.document.createElement( 'css3-container' );
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
