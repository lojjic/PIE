PIE.RendererBase = {

    needsUpdate: function() {
        return false;
    },

    updateProps: function() {
    },

    updatePos: function() {
    },

    updateSize: function() {
    },

    updateVis: function() {
    },

    getShape: function( name, subElName ) {
        var shapes = this._shapes || ( this._shapes = {} ),
            shape = shapes[ name ],
            s;

        if( !shape ) {
            shape = shapes[ name ] = PIE.Util.createVmlElement( 'shape' );
            if( subElName ) {
                shape.appendChild( shape[ subElName ] = PIE.Util.createVmlElement( subElName ) );
            }
            this.getBox().appendChild( shape );
            s = shape.style;
            s.position = 'absolute';
            s.left = s.top = 0;
            s.behavior = 'url(#default#VML)';
        }
        return shape;
    },

    deleteShape: function( name ) {
        var shapes = this._shapes,
            shape = shapes && shapes[ name ];
        if( shape ) {
            shape.parentNode.removeChild( shape );
            delete shapes[ name ];
        }
        return !!shape;
    },

    getRadiiPixels: function( radii ) {
        var el = this.element,
            w = el.offsetWidth,
            h = el.offsetHeight,
            tlX, tlY, trX, trY, brX, brY, blX, blY, f;

        tlX = radii.x.tl.pixels( el, w );
        tlY = radii.y.tl.pixels( el, h );
        trX = radii.x.tr.pixels( el, w );
        trY = radii.y.tr.pixels( el, h );
        brX = radii.x.br.pixels( el, w );
        brY = radii.y.br.pixels( el, h );
        blX = radii.x.bl.pixels( el, w );
        blY = radii.y.bl.pixels( el, h );

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
                tl: tlX,
                tr: trX,
                br: brX,
                bl: blX
            },
            y: {
                tl: tlY,
                tr: trY,
                br: brY,
                bl: blY
            }
        }
    },

    /**
     * Return the VML path string for the element's background box, with corners rounded.
     * @param {Object<t,r,b,l>} shrink - if present, specifies number of pixels to shrink the box path inward from
     *                                   the element's four sides.
     */
    getBoxPath: function( shrink ) {
        var r, str,
            el = this.element,
            w = el.offsetWidth - 1,
            h = el.offsetHeight - 1,
            radInfo = this.styleInfos.borderRadius,
            floor = Math.floor, ceil = Math.ceil,
            shrinkT = shrink ? shrink.t : 0,
            shrinkR = shrink ? shrink.r : 0,
            shrinkB = shrink ? shrink.b : 0,
            shrinkL = shrink ? shrink.l : 0,
            tlX, tlY, trX, trY, brX, brY, blX, blY;

        if( radInfo.isActive() ) {
            r = this.getRadiiPixels( radInfo.getProps() );

            tlX = r.x.tl;
            tlY = r.y.tl;
            trX = r.x.tr;
            trY = r.y.tr;
            brX = r.x.br;
            brY = r.y.br;
            blX = r.x.bl;
            blY = r.y.bl;

            str = 'm' + shrinkL + ',' + floor(tlY) +
                'qy' + floor(tlX) + ',' + shrinkT +
                'l' + ceil(w - trX) + ',' + shrinkT +
                'qx' + ( w - shrinkR ) + ',' + floor(trY) +
                'l' + ( w - shrinkR ) + ',' + ceil(h - brY) +
                'qy' + ceil(w - brX) + ',' + ( h - shrinkB ) +
                'l' + floor(blX) + ',' + ( h - shrinkB ) +
                'qx' + shrinkL + ',' + ceil(h - blY) + ' x e';
        } else {
            // simplified path for non-rounded box
            str = 'm' + shrinkL + ',' + shrinkT +
                  'l' + ( w - shrinkR ) + ',' + shrinkT +
                  'l' + ( w - shrinkR ) + ',' + ( h - shrinkB ) +
                  'l' + shrinkL + ',' + ( h - shrinkB ) +
                  'xe';
        }
        return str;
    }
};
