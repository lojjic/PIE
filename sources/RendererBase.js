PIE.RendererBase = {

    /**
     * Determine if the renderer needs to be updated
     * @return {boolean}
     */
    needsUpdate: function() {
        return false;
    },

    /**
     * Tell the renderer to update based on modified properties
     */
    updateProps: function() {
    },

    /**
     * Tell the renderer to update based on modified element position
     */
    updatePos: function() {
    },

    /**
     * Tell the renderer to update based on modified element dimensions
     */
    updateSize: function() {
    },

    /**
     * Tell the renderer to update based on modified element visibility
     */
    updateVis: function() {
    },


    /**
     * Add a layer element, with the given z-order index, to the renderer's main box element. We can't use
     * z-index because that breaks when the root rendering box's z-index is 'auto' in IE8+ standards mode.
     * So instead we make sure they are inserted into the DOM in the correct order.
     * @param {number} index
     * @param {Element} el
     */
    addLayer: function( index, el ) {
        this.removeLayer( index );
        for( var layers = this._layers || ( this._layers = [] ), i = index + 1, len = layers.length, layer; i < len; i++ ) {
            layer = layers[i];
            if( layer ) {
                break;
            }
        }
        layers[index] = el;
        this.getBox().insertBefore( el, layer || null );
    },

    /**
     * Retrieve a layer element by its index, or null if not present
     * @param {number} index
     * @return {Element}
     */
    getLayer: function( index ) {
        var layers = this._layers;
        return layers && layers[index] || null;
    },

    /**
     * Remove a layer element by its index
     * @param {number} index
     */
    removeLayer: function( index ) {
        var layer = this.getLayer( index ),
            box = this._box;
        if( layer && box ) {
            box.removeChild( layer );
            this._layers[index] = null;
        }
    },


    /**
     * Get a VML shape by name, creating it if necessary.
     * @param {string} name A name identifying the element
     * @param {string=} subElName If specified a subelement of the shape will be created with this tag name
     * @param {number=} group If specified, an ordinal group for the shape. 1 or greater. Groups are rendered
     *                  using container elements in the correct order, to get correct z stacking without z-index.
     */
    getShape: function( name, subElName, group ) {
        var shapes = this._shapes || ( this._shapes = {} ),
            shape = shapes[ name ],
            s, parent;

        if( !shape ) {
            shape = shapes[ name ] = PIE.Util.createVmlElement( 'shape' );
            if( subElName ) {
                shape.appendChild( shape[ subElName ] = PIE.Util.createVmlElement( subElName ) );
            }

            if( group ) {
                parent = this.getLayer( group );
                if( !parent ) {
                    this.addLayer( group, this.element.document.createElement( 'group' + group ) );
                    parent = this.getLayer( group );
                }
            } else {
                parent = this.getBox();
            }

            parent.appendChild( shape );

            s = shape.style;
            s.position = 'absolute';
            s.left = s.top = 0;
            s['behavior'] = 'url(#default#VML)';
        }
        return shape;
    },

    /**
     * Delete a named shape which was created by getShape(). Returns true if a shape with the
     * given name was found and deleted, or false if there was no shape of that name.
     * @param {string} name
     * @return {boolean}
     */
    deleteShape: function( name ) {
        var shapes = this._shapes,
            shape = shapes && shapes[ name ];
        if( shape ) {
            shape.parentNode.removeChild( shape );
            delete shapes[ name ];
        }
        return !!shape;
    },


    /**
     * For a given set of border radius length/percentage values, convert them to concrete pixel
     * values based on the current size of the target element.
     * @param {Object} radii
     * @return {Object}
     */
    getRadiiPixels: function( radii ) {
        var el = this.element,
            w = el.offsetWidth,
            h = el.offsetHeight,
            tlX, tlY, trX, trY, brX, brY, blX, blY, f;

        tlX = radii.x['tl'].pixels( el, w );
        tlY = radii.y['tl'].pixels( el, h );
        trX = radii.x['tr'].pixels( el, w );
        trY = radii.y['tr'].pixels( el, h );
        brX = radii.x['br'].pixels( el, w );
        brY = radii.y['br'].pixels( el, h );
        blX = radii.x['bl'].pixels( el, w );
        blY = radii.y['bl'].pixels( el, h );

        // If any corner ellipses overlap, reduce them all by the appropriate factor. This formula
        // is taken straight from the CSS3 Backgrounds and Borders spec.
        f = Math.min(
            w / ( tlX + trX ),
            h / ( trY + brY ),
            w / ( blX + brX ),
            h / ( tlY + blY )
        );
        if( f < 1 ) {
            tlX *= f;
            tlY *= f;
            trX *= f;
            trY *= f;
            brX *= f;
            brY *= f;
            blX *= f;
            blY *= f;
        }

        return {
            x: {
                'tl': tlX,
                'tr': trX,
                'br': brX,
                'bl': blX
            },
            y: {
                'tl': tlY,
                'tr': trY,
                'br': brY,
                'bl': blY
            }
        }
    },

    /**
     * Return the VML path string for the element's background box, with corners rounded.
     * @param {Object.<{t:number, r:number, b:number, l:number}>} shrink - if present, specifies number of
     *        pixels to shrink the box path inward from the element's four sides.
     * @param {number=} mult If specified, all coordinates will be multiplied by this number
     * @return {string} the VML path
     */
    getBoxPath: function( shrink, mult ) {
        mult = mult || 1;

        var r, str,
            el = this.element,
            w = el.offsetWidth * mult,
            h = el.offsetHeight * mult,
            radInfo = this.styleInfos.borderRadiusInfo,
            floor = Math.floor, ceil = Math.ceil,
            shrinkT = shrink ? shrink.t * mult : 0,
            shrinkR = shrink ? shrink.r * mult : 0,
            shrinkB = shrink ? shrink.b * mult : 0,
            shrinkL = shrink ? shrink.l * mult : 0,
            tlX, tlY, trX, trY, brX, brY, blX, blY;

        if( radInfo.isActive() ) {
            r = this.getRadiiPixels( radInfo.getProps() );

            tlX = r.x['tl'] * mult;
            tlY = r.y['tl'] * mult;
            trX = r.x['tr'] * mult;
            trY = r.y['tr'] * mult;
            brX = r.x['br'] * mult;
            brY = r.y['br'] * mult;
            blX = r.x['bl'] * mult;
            blY = r.y['bl'] * mult;

            str = 'm' + floor( shrinkL ) + ',' + floor( tlY ) +
                'qy' + floor( tlX ) + ',' + floor( shrinkT ) +
                'l' + ceil( w - trX ) + ',' + floor( shrinkT ) +
                'qx' + ceil( w - shrinkR ) + ',' + floor( trY ) +
                'l' + ceil( w - shrinkR ) + ',' + ceil( h - brY ) +
                'qy' + ceil( w - brX ) + ',' + ceil( h - shrinkB ) +
                'l' + floor( blX ) + ',' + ceil( h - shrinkB ) +
                'qx' + floor( shrinkL ) + ',' + ceil( h - blY ) + ' x e';
        } else {
            // simplified path for non-rounded box
            str = 'm' + floor( shrinkL ) + ',' + floor( shrinkT ) +
                  'l' + ceil( w - shrinkR ) + ',' + floor( shrinkT ) +
                  'l' + ceil( w - shrinkR ) + ',' + ceil( h - shrinkB ) +
                  'l' + floor( shrinkL ) + ',' + ceil( h - shrinkB ) +
                  'xe';
        }
        return str;
    }
};
