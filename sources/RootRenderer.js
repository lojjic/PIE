/**
 * Root renderer; creates the outermost container element and handles keeping it aligned
 * with the target element's size and position.
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.RootRenderer = function( el, styleInfos ) {
    this.element = el;
    this.styleInfos = styleInfos;
};
PIE.Util.merge( PIE.RootRenderer.prototype, PIE.RendererBase, {

    isActive: function() {
        var infos = this.styleInfos;
        for( var i in infos ) {
            if( infos.hasOwnProperty( i ) && infos[ i ].isActive() ) {
                return true;
            }
        }
        return false;
    },

    updateVis: function() {
        if( this.isActive() ) {
            var cs = this.element.currentStyle;
            this.getBox().style.display = ( cs.visibility === 'hidden' || cs.display === 'none' ) ? 'none' : '';
        }
    },

    updatePos: function() {
        if( this.isActive() ) {
            var el = this.element,
                par = el,
                docEl,
                elRect, parRect,
                s = this.getBox().style,
                x = 0, y = 0;

            // Get the element's offsets from its nearest positioned ancestor. Uses
            // getBoundingClientRect for accuracy and speed.
            do {
                par = par.offsetParent;
            } while( par && par.currentStyle.position === 'static' );
            elRect = el.getBoundingClientRect();
            if( par ) {
                parRect = par.getBoundingClientRect();
                x = elRect.left - parRect.left;
                y = elRect.top - parRect.top;
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

    getBox: function() {
        var box = this._box, el, s;
        if( !box ) {
            el = this.element;
            box = this._box = el.document.createElement( 'css3-container' );
            s = box.style;

            s.position = 'absolute';

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
    }

} );
