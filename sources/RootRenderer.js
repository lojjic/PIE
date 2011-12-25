/**
 * Root renderer; creates the outermost container element and handles keeping it aligned
 * with the target element's size and position.
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.RootRenderer = PIE.RendererBase.newRenderer( {

    /**
     * Flag indicating the element has already been positioned at least once.
     * @type {boolean}
     */
    isPositioned: false,

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

    /**
     * Tell the renderer to update based on modified element position
     */
    updatePos: function() {
        if( this.isActive() && this.getBoxEl() ) {
            var el = this.getPositioningElement(),
                par = el,
                docEl,
                parRect,
                tgtCS = el.currentStyle,
                tgtPos = tgtCS.position,
                boxPos,
                s = this.getBoxEl().style, cs,
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

    updateVisibility: function() {
        var vis = this.styleInfos.visibilityInfo,
            box = this._box;
        if ( box && vis.changed() ) {
            vis = vis.getProps();
            box.style.display = ( vis.visible && vis.displayed ) ? '' : 'none';
        }
    },

    updateRendering: function() {
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

    /**
     * Get a reference to the css3pie container element that contains the VML shapes,
     * if it has been inserted.
     */
    getBoxEl: function() {
        var box = this._box;
        if( !box ) {
            box = this._box = doc.getElementById( '_pie' + PIE.Util.getUID( this ) );
        }
        return box;
    },

    /**
     * Render any child rendrerer shapes which have not already been rendered into the DOM.
     */
    finishUpdate: function() {
        var me = this,
            queue = me._shapeRenderQueue,
            renderedShapes, markup, i, len, j,
            ref, pos;

        if( queue ) {
            // We've already rendered something once, so do incremental insertion of new shapes
            renderedShapes = me._renderedShapes;
            if( renderedShapes ) {
                for( i = 0, len = queue.length; i < len; i++ ) {
                    for( j = renderedShapes.length; j--; ) {
                        if( renderedShapes[ j ].ordinalGroup < queue[ i ].ordinalGroup ) {
                            break;
                        }
                    }

                    if ( j < 0 ) {
                        ref = me.getBoxEl();
                        pos = 'afterBegin';
                    } else {
                        ref = renderedShapes[ j ].getShape();
                        pos = 'afterEnd';
                    }
                    ref.insertAdjacentHTML( pos, queue[ i ].getMarkup() );
                    renderedShapes.splice( j < 0 ? 0 : j, 0, queue[ i ] );
                }
            }
            // This is the first render, so build up a single markup string and insert it all at once
            else {
                queue.sort( me.shapeSorter );
                markup = [ '<css3pie id="_pie' + PIE.Util.getUID( me ) + '" style="direction:ltr;position:absolute;">' ];
                for( i = 0, len = queue.length; i < len; i++ ) {
                    markup.push( queue[ i ].getMarkup() );
                }
                markup.push( '</css3pie>' );

                me.getPositioningElement().insertAdjacentHTML( 'beforeBegin', markup.join( '' ) );

                me._renderedShapes = queue;
            }
            me._shapeRenderQueue = 0;
        }
    },

    shapeSorter: function( shape1, shape2 ) {
        return shape1.ordinalGroup - shape2.ordinalGroup;
    },

    /**
     * Add a VmlShape into the queue to get rendered in finishUpdate
     */
    enqueueShapeForRender: function( shape ) {
        var me = this,
            queue = me._shapeRenderQueue || ( me._shapeRenderQueue = [] );
        queue.push( shape );
    },

    /**
     * Remove a VmlShape from the DOM and also from the internal list of rendered shapes.
     */
    removeShape: function( shape ) {
        var shapes = this._renderedShapes, i;
        if ( shapes ) {
            for( i = shapes.length; i--; ) {
                if( shapes[ i ] === shape ) {
                    shapes.splice( i, 1 );
                    break;
                }
            }
        }
    },

    destroy: function() {
        var box = this._box, par;
        if( box && ( par = box.parentNode ) ) {
            par.removeChild( box );
        }
        delete this._box;
        delete this._renderedShapes;
    }

} );

// Prime IE for recognizing the custom <css3pie> element
doc.createElement( 'css3pie' );
