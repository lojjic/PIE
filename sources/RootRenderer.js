/**
 * Root renderer; creates the outermost container element and handles keeping it aligned
 * with the target element's size and position.
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.RootRenderer = PIE.RendererBase.newRenderer( {

    isActive: function() {
        var children = this.childRenderers;
        for( var i in children ) {
            if( children.hasOwnProperty( i ) && children[ i ].isActive() ) {
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
            var el = this.getPositioningElement(),
                par = el,
                docEl,
                parRect,
                tgtCS = el.currentStyle,
                tgtPos = tgtCS.position,
                boxPos,
                s = this.getBox().style, cs,
                x = 0, y = 0,
                elBounds = this.boundsInfo.getBounds();

            if( tgtPos === 'fixed' && PIE.ieVersion > 6 ) {
                x = elBounds.x;
                y = elBounds.y;
                boxPos = tgtPos;
            } else {
                // Get the element's offsets from its nearest positioned ancestor. Uses
                // getBoundingClientRect for accuracy and speed.
                do {
                    par = par.offsetParent;
                } while( par && ( par.currentStyle.position === 'static' ) );
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
                boxPos = 'absolute';
            }

            s.position = boxPos;
            s.left = x;
            s.top = y;
            s.zIndex = tgtPos === 'static' ? -1 : tgtCS.zIndex;
            this.isPositioned = true;
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

    getPositioningElement: function() {
        var el = this.targetElement;
        return el.tagName in PIE.tableCellTags ? el.offsetParent : el;
    },

    getBox: function() {
        var box = this._box, el;
        if( !box ) {
            el = this.getPositioningElement();
            box = this._box = doc.createElement( 'css3-container' );
            box.style['direction'] = 'ltr'; //fix positioning bug in rtl environments

            this.updateVisibility();

            el.parentNode.insertBefore( box, el );
        }
        return box;
    },

    destroy: function() {
        var box = this._box, par;
        if( box && ( par = box.parentNode ) ) {
            par.removeChild( box );
        }
        delete this._box;
        delete this._layers;
    }

} );
