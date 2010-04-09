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

    getBoxPath: function( shrink ) {
        var r, instructions, values, str = '', i,
            el = this.element,
            w = el.offsetWidth - 1,
            h = el.offsetHeight - 1,
            radInfo = this.styleInfos.borderRadius,
            floor = Math.floor, ceil = Math.ceil,
            deg = 65535,
            tlX, tlY, trX, trY, brX, brY, blX, blY;

        shrink = floor( shrink || 0 );

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

            instructions = [ 'm', 'qy', 'l', 'qx', 'l', 'qy', 'l', 'qx' ];
            values = [
                shrink + ',' + floor(tlY),
                floor(tlX) + ',' + shrink,
                ceil(w - trX) + ',' + shrink,
                ( w - shrink ) + ',' + floor(trY),
                ( w - shrink ) + ',' + ceil(h - brY),
                ceil(w - brX) + ',' + ( h - shrink ),
                floor(blX) + ',' + ( h - shrink ),
                shrink + ',' + ceil(h - blY)
            ];

            for ( i = 0; i < 8; i++ ) {
                str += instructions[i] + values[i];
            }
            str += ' x e';
        } else {
            // simplified path for non-rounded box
            str = 'm' + shrink + ',' + shrink +
                  'l' + ( w - shrink ) + ',' + shrink +
                  'l' + ( w - shrink ) + ',' + ( h - shrink ) +
                  'l' + shrink + ',' + ( h - shrink ) +
                  'xe';
        }
        return str;
    }
};
