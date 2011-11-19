PIE.merge(PIE.RendererBase, {

    /**
     * Get a VmlShape by name, creating it if necessary.
     * @param {string} name A name identifying the element
     * @param {number} zIndex Specifies the target z-index of the shape. This will be used when rendering
     *                 the shape to ensure it is inserted in the correct order with other shapes to give
     *                 correct stacking order without using actual CSS z-index.
     * @return {PIE.VmlShape}
     */
    getShape: function( name, zIndex ) {
        var shapes = this._shapes || ( this._shapes = {} ),
            shape = shapes[ name ];
        if( !shape ) {
            shape = shapes[ name ] = new PIE.VmlShape( name, zIndex );
            this.parent.enqueueShapeForRender( shape );
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
            shape.destroy();
            this.parent.removeShape( shape );
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
        var el = this.targetElement,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
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
     * @param {number} shrinkT - number of pixels to shrink the box path inward from the element's top side.
     * @param {number} shrinkR - number of pixels to shrink the box path inward from the element's right side.
     * @param {number} shrinkB - number of pixels to shrink the box path inward from the element's bottom side.
     * @param {number} shrinkL - number of pixels to shrink the box path inward from the element's left side.
     * @param {number} mult All coordinates will be multiplied by this number
     * @param {Object=} radii If specified, this will be used for the corner radii instead of the properties
     *        from this renderer's borderRadiusInfo object.
     * @return {string} the VML path
     */
    getBoxPath: function( shrinkT, shrinkR, shrinkB, shrinkL, mult, radii ) {
        var coords = this.getBoxPathCoords( shrinkT, shrinkR, shrinkB, shrinkL, mult, radii );
        return 'm' + coords[ 0 ] + ',' + coords[ 1 ] +
               'qy' + coords[ 2 ] + ',' + coords[ 3 ] +
               'l' + coords[ 4 ] + ',' + coords[ 5 ] +
               'qx' + coords[ 6 ] + ',' + coords[ 7 ] +
               'l' + coords[ 8 ] + ',' + coords[ 9 ] +
               'qy' + coords[ 10 ] + ',' + coords[ 11 ] +
               'l' + coords[ 12 ] + ',' + coords[ 13 ] +
               'qx' + coords[ 14 ] + ',' + coords[ 15 ] +
               'x';
    },

    /**
     * Return the VML coordinates for all the vertices in the rounded box path.
     * @param {number} shrinkT - number of pixels to shrink the box path inward from the element's top side.
     * @param {number} shrinkR - number of pixels to shrink the box path inward from the element's right side.
     * @param {number} shrinkB - number of pixels to shrink the box path inward from the element's bottom side.
     * @param {number} shrinkL - number of pixels to shrink the box path inward from the element's left side.
     * @param {number=} mult If specified, all coordinates will be multiplied by this number
     * @param {Object=} radii If specified, this will be used for the corner radii instead of the properties
     *        from this renderer's borderRadiusInfo object.
     * @return {Array.<number>} all the coordinates going clockwise, starting with the top-left corner's lower vertex
     */
    getBoxPathCoords: function( shrinkT, shrinkR, shrinkB, shrinkL, mult, radii ) {
        var bounds = this.boundsInfo.getBounds(),
            w = bounds.w * mult,
            h = bounds.h * mult,
            M = Math,
            floor = M.floor, ceil = M.ceil,
            max = M.max, min = M.min,
            coords;

        shrinkT *= mult;
        shrinkR *= mult;
        shrinkB *= mult;
        shrinkL *= mult;

        if ( !radii ) {
            radii = this.styleInfos.borderRadiusInfo.getProps();
        }

        if ( radii ) {
            radii = this.getRadiiPixels( radii );

            var tlRadiusX = radii.x['tl'] * mult,
                tlRadiusY = radii.y['tl'] * mult,
                trRadiusX = radii.x['tr'] * mult,
                trRadiusY = radii.y['tr'] * mult,
                brRadiusX = radii.x['br'] * mult,
                brRadiusY = radii.y['br'] * mult,
                blRadiusX = radii.x['bl'] * mult,
                blRadiusY = radii.y['bl'] * mult;

            coords = [
                floor( shrinkL ),                                       // top-left lower x
                floor( min( max( tlRadiusY, shrinkT ), h - shrinkB ) ), // top-left lower y
                floor( min( max( tlRadiusX, shrinkL ), w - shrinkR ) ), // top-left upper x
                floor( shrinkT ),                                       // top-left upper y
                ceil( max( shrinkL, w - max( trRadiusX, shrinkR ) ) ),  // top-right upper x
                floor( shrinkT ),                                       // top-right upper y
                ceil( w - shrinkR ),                                    // top-right lower x
                floor( min( max( trRadiusY, shrinkT ), h - shrinkB ) ), // top-right lower y
                ceil( w - shrinkR ),                                    // bottom-right upper x
                ceil( max( shrinkT, h - max( brRadiusY, shrinkB ) ) ),  // bottom-right upper y
                ceil( max( shrinkL, w - max( brRadiusX, shrinkR ) ) ),  // bottom-right lower x
                ceil( h - shrinkB ),                                    // bottom-right lower y
                floor( min( max( blRadiusX, shrinkL ), w - shrinkR ) ), // bottom-left lower x
                ceil( h - shrinkB ),                                    // bottom-left lower y
                floor( shrinkL ),                                       // bottom-left upper x
                ceil( max( shrinkT, h - max( blRadiusY, shrinkB ) ) )   // bottom-left upper y
            ];
        } else {
            // Skip most of the heavy math for a simple non-rounded box
            var t = floor( shrinkT ),
                r = ceil( w - shrinkR ),
                b = ceil( h - shrinkB ),
                l = floor( shrinkL );

            coords = [ l, t, l, t, r, t, r, t, r, b, r, b, l, b, l, b ];
        }

        return coords;
    },


    /**
     * Hide the actual border of the element. In IE7 and up we can just set its color to transparent;
     * however IE6 does not support transparent borders so we have to get tricky with it. Also, some elements
     * like form buttons require removing the border width altogether, so for those we increase the padding
     * by the border size.
     */
    hideBorder: function() {
        var el = this.targetElement,
            cs = el.currentStyle,
            rs = el.runtimeStyle,
            tag = el.tagName,
            isIE6 = PIE.ieVersion === 6,
            sides, side, i;

        if( ( isIE6 && ( tag in PIE.childlessElements || tag === 'FIELDSET' ) ) ||
                tag === 'BUTTON' || ( tag === 'INPUT' && el.type in PIE.inputButtonTypes ) ) {
            rs.borderWidth = '';
            sides = this.styleInfos.borderInfo.sides;
            for( i = sides.length; i--; ) {
                side = sides[ i ];
                rs[ 'padding' + side ] = '';
                rs[ 'padding' + side ] = ( PIE.getLength( cs[ 'padding' + side ] ) ).pixels( el ) +
                                         ( PIE.getLength( cs[ 'border' + side + 'Width' ] ) ).pixels( el ) +
                                         ( PIE.ieVersion !== 8 && i % 2 ? 1 : 0 ); //needs an extra horizontal pixel to counteract the extra "inner border" going away
            }
            rs.borderWidth = 0;
        }
        else if( isIE6 ) {
            // Wrap all the element's children in a custom element, set the element to visiblity:hidden,
            // and set the wrapper element to visiblity:visible. This hides the outer element's decorations
            // (background and border) but displays all the contents.
            // TODO find a better way to do this that doesn't mess up the DOM parent-child relationship,
            // as this can interfere with other author scripts which add/modify/delete children. Also, this
            // won't work for elements which cannot take children, e.g. input/button/textarea/img/etc. Look into
            // using a compositor filter or some other filter which masks the border.
            if( el.childNodes.length !== 1 || el.firstChild.tagName !== 'ie6-mask' ) {
                var cont = doc.createElement( 'ie6-mask' ),
                    s = cont.style, child;
                s.visibility = 'visible';
                s.zoom = 1;
                while( child = el.firstChild ) {
                    cont.appendChild( child );
                }
                el.appendChild( cont );
                rs.visibility = 'hidden';
            }
        }
        else {
            rs.borderColor = 'transparent';
        }
    },

    unhideBorder: function() {

    },


    /**
     * Destroy the rendered objects. This is a base implementation which handles common renderer
     * structures, but individual renderers may override as necessary.
     */
    destroy: function() {
        var shapes = this._shapes, s;
        if ( shapes ) {
            for( s in shapes ) {
                if( shapes.hasOwnProperty( s ) ) {
                    this.deleteShape( s );
                }
            }
        }
    }
});
