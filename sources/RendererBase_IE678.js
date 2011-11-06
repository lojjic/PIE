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
     * @param {Object.<{t:number, r:number, b:number, l:number}>} shrink - if present, specifies number of
     *        pixels to shrink the box path inward from the element's four sides.
     * @param {number=} mult If specified, all coordinates will be multiplied by this number
     * @param {Object=} radii If specified, this will be used for the corner radii instead of the properties
     *        from this renderer's borderRadiusInfo object.
     * @return {string} the VML path
     */
    getBoxPath: function( shrink, mult, radii ) {
        mult = mult || 1;

        var r, str,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w * mult,
            h = bounds.h * mult,
            radInfo = this.styleInfos.borderRadiusInfo,
            floor = Math.floor, ceil = Math.ceil,
            shrinkT = shrink ? shrink.t * mult : 0,
            shrinkR = shrink ? shrink.r * mult : 0,
            shrinkB = shrink ? shrink.b * mult : 0,
            shrinkL = shrink ? shrink.l * mult : 0,
            tlX, tlY, trX, trY, brX, brY, blX, blY;

        if( radii || radInfo.isActive() ) {
            r = this.getRadiiPixels( radii || radInfo.getProps() );

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
