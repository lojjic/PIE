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

    getBoxCssText: function() {
        var el = this.getPositioningElement(),
            par = el,
            docEl,
            parRect,
            tgtCS = el.currentStyle,
            tgtPos = tgtCS.position,
            boxPos,
            cs,
            x = 0, y = 0,
            elBounds = this.boundsInfo.getBounds(),
            vis = this.styleInfos.visibilityInfo.getProps(),
            logicalZoomRatio = elBounds.logicalZoomRatio;

        if( tgtPos === 'fixed' && PIE.ieVersion > 6 ) {
            x = elBounds.x * logicalZoomRatio;
            y = elBounds.y * logicalZoomRatio;
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
                x = ( elBounds.x - parRect.left ) * logicalZoomRatio - ( parseFloat(cs.borderLeftWidth) || 0 );
                y = ( elBounds.y - parRect.top ) * logicalZoomRatio - ( parseFloat(cs.borderTopWidth) || 0 );
            } else {
                docEl = doc.documentElement;
                x = ( elBounds.x + docEl.scrollLeft - docEl.clientLeft ) * logicalZoomRatio;
                y = ( elBounds.y + docEl.scrollTop - docEl.clientTop ) * logicalZoomRatio;
            }
            boxPos = 'absolute';
        }

        // IMPORTANT: in order to avoid triggering the hasLayout collapsing-top-margin bug in IE6/7,
        // we *must* include background:none in the styles, and we *cannot* include a z-index during
        // the initial render. The z-index can be set after insertion instead safely. For some reason
        // that makes no logical sense whatsoever, this exact combination avoids the bug. Go figure.
        // Special thanks to Drew Diller, who did this in DD_roundies (though who knows if it was
        // done intentionally for this reason since it's not commented as such or if it was just a
        // very lucky coincidence...)
        return 'direction:ltr;' +
               'behavior:none !important;' +
               'position:' + boxPos + ';' +
               'background:none;' +
               'left:' + x + 'px;' +
               'top:' + y + 'px;' +
               ( vis.visible && vis.displayed ? '' : 'display:none;' );
    },

    updateBoxStyles: function() {
        var me = this,
            boxEl = me.getBoxEl();
        if( boxEl && ( me.boundsInfo.positionChanged() || me.styleInfos.visibilityInfo.changed() ) ) {
            boxEl.style.cssText = me.getBoxCssText() + 'z-index:' + me.getBoxZIndex();
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
     * Determine the target z-index for the box el
     */
    getBoxZIndex: function() {
        var cs = this.targetElement.currentStyle;
        return cs.position === 'static' ? '-1' : cs.zIndex;
    },

    /**
     * Render any child rendrerer shapes which have not already been rendered into the DOM.
     */
    updateRendering: function() {
        var me = this,
            queue = me._shapeRenderQueue,
            renderedShapes, markup, i, len, j,
            ref, pos, vis;

        if (me.isActive()) {
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
                    me._shapeRenderQueue = 0;
                    me.updateBoxStyles();
                }
                // This is the first render, so build up a single markup string and insert it all at once
                else {
                    vis = me.styleInfos.visibilityInfo.getProps();
                    if( vis.visible && vis.displayed ) {
                        queue.sort( me.shapeSorter );
                        markup = [ '<css3pie id="_pie' + PIE.Util.getUID( me ) + '" style="' + me.getBoxCssText() + '">' ];
                        for( i = 0, len = queue.length; i < len; i++ ) {
                            markup.push( queue[ i ].getMarkup() );
                        }
                        markup.push( '</css3pie>' );

                        me.getPositioningElement().insertAdjacentHTML( 'beforeBegin', markup.join( '' ) );

                        // Can't include z-index in the initial styles to prevent top-margin collapsing
                        // bug (see comment above in #getBoxCssText), so we set it here after insertion.
                        me.getBoxEl().style.zIndex = me.getBoxZIndex();

                        me._renderedShapes = queue;
                        me._shapeRenderQueue = 0;
                    }
                }
            } else {
                me.updateBoxStyles();
            }
        } else {
            me.destroy();
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
