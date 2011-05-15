/**
 * Renderer for element backgrounds, specific for IE9. Only handles translating CSS3 gradients
 * to an equivalent SVG data URI.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.IE9BackgroundRenderer = PIE.RendererBase.newRenderer( {

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.backgroundInfo.changed();
    },

    isActive: function() {
        var si = this.styleInfos;
        return si.backgroundInfo.isActive();
    },

    draw: function() {
        var props = this.styleInfos.backgroundInfo.getProps(),
            bg, images, i = 0, img;

        if ( props ) {
            bg = [];

            images = props.bgImages;
            if ( images ) {
                while( img = images[ i++ ] ) {
                    bg.push( img.imgType === 'linear-gradient' ?
                        'url(data:image/svg+xml,' + escape( this.getGradientSvg( img ) ) + ')' :
                        img.origString
                    );
                }
            }

            if ( props.color ) {
                bg.push( props.color.val );
            }

            this.targetElement.runtimeStyle.background = bg.join(', ');
        }
    },

    getGradientSvg: function( info ) {
        var el = this.targetElement,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            angle = info.angle,
            startPos = info.gradientStart,
            stopsInfo = info.stops,
            stopCount = stopsInfo.length,
            PI = Math.PI,
            UNDEF,
            startX, startY,
            endX, endY,
            startCornerX, startCornerY,
            endCornerX, endCornerY,
            deltaX, deltaY, lineLength,
            stopPx,
            p, i, j, before, after,
            svg;

        /**
         * Find the point along a given line (defined by a starting point and an angle), at which
         * that line is intersected by a perpendicular line extending through another point.
         * @param x1 - x coord of the starting point
         * @param y1 - y coord of the starting point
         * @param angle - angle of the line extending from the starting point (in degrees)
         * @param x2 - x coord of point along the perpendicular line
         * @param y2 - y coord of point along the perpendicular line
         * @return [ x, y ]
         */
        function perpendicularIntersect( x1, y1, angle, x2, y2 ) {
            // Handle straight vertical and horizontal angles, for performance and to avoid
            // divide-by-zero errors.
            if( angle === 0 || angle === 180 ) {
                return [ x2, y1 ];
            }
            else if( angle === 90 || angle === 270 ) {
                return [ x1, y2 ];
            }
            else {
                // General approach: determine the Ax+By=C formula for each line (the slope of the second
                // line is the negative inverse of the first) and then solve for where both formulas have
                // the same x/y values.
                var a1 = Math.tan( -angle * PI / 180 ),
                    c1 = a1 * x1 - y1,
                    a2 = -1 / a1,
                    c2 = a2 * x2 - y2,
                    d = a2 - a1,
                    endX = ( c2 - c1 ) / d,
                    endY = ( a1 * c2 - a2 * c1 ) / d;
                return [ endX, endY ];
            }
        }

        // Find the "start" and "end" corners; these are the corners furthest along the gradient line.
        // This is used below to find the start/end positions of the CSS3 gradient-line, and also in finding
        // the total length of the VML rendered gradient-line corner to corner.
        function findCorners() {
            startCornerX = ( angle >= 90 && angle < 270 ) ? w : 0;
            startCornerY = angle < 180 ? h : 0;
            endCornerX = w - startCornerX;
            endCornerY = h - startCornerY;
        }

        // Normalize the angle to a value between [0, 360)
        function normalizeAngle() {
            while( angle < 0 ) {
                angle += 360;
            }
            angle = angle % 360;
        }

        // Find the distance between two points
        function distance( p1, p2 ) {
            var dx = p2[0] - p1[0],
                dy = p2[1] - p1[1];
            return Math.abs(
                dx === 0 ? dy :
                dy === 0 ? dx :
                Math.sqrt( dx * dx + dy * dy )
            );
        }

        // Find the start and end points of the gradient
        if( startPos ) {
            startPos = startPos.coords( el, w, h );
            startX = startPos.x;
            startY = startPos.y;
        }
        if( angle ) {
            angle = angle.degrees();

            normalizeAngle();
            findCorners();

            // If no start position was specified, then choose a corner as the starting point.
            if( !startPos ) {
                startX = startCornerX;
                startY = startCornerY;
            }

            // Find the end position by extending a perpendicular line from the gradient-line which
            // intersects the corner opposite from the starting corner.
            p = perpendicularIntersect( startX, startY, angle, endCornerX, endCornerY );
            endX = p[0];
            endY = p[1];
        }
        else if( startPos ) {
            // Start position but no angle specified: find the end point by rotating 180deg around the center
            endX = w - startX;
            endY = h - startY;
        }
        else {
            // Neither position nor angle specified; create vertical gradient from top to bottom
            startX = startY = endX = 0;
            endY = h;
        }
        deltaX = endX - startX;
        deltaY = endY - startY;

        if( angle === UNDEF ) {
            // Get the angle based on the change in x/y from start to end point. Checks first for horizontal
            // or vertical angles so they get exact whole numbers rather than what atan2 gives.
            angle = ( !deltaX ? ( deltaY < 0 ? 90 : 270 ) :
                        ( !deltaY ? ( deltaX < 0 ? 180 : 0 ) :
                            -Math.atan2( deltaY, deltaX ) / PI * 180
                        )
                    );
            normalizeAngle();
            findCorners();
        }

        lineLength = distance( [ startX, startY ], [ endX, endY ] );

        // Find the pixel offsets along the CSS3 gradient-line for each stop.
        stopPx = [];
        for( i = 0; i < stopCount; i++ ) {
            stopPx.push( stopsInfo[i].offset ? stopsInfo[i].offset.pixels( el, lineLength ) :
                         i === 0 ? 0 : i === stopCount - 1 ? lineLength : null );
        }
        // Fill in gaps with evenly-spaced offsets
        for( i = 1; i < stopCount; i++ ) {
            if( stopPx[ i ] === null ) {
                before = stopPx[ i - 1 ];
                j = i;
                do {
                    after = stopPx[ ++j ];
                } while( after === null );
                stopPx[ i ] = before + ( after - before ) / ( j - i + 1 );
            }
        }

        svg = [
            '<svg width="' + w + '" height="' + h + '" xmlns="http://www.w3.org/2000/svg">' +
                '<defs>' +
                    '<linearGradient id="g" gradientUnits="userSpaceOnUse"' +
                    ' x1="' + ( startX / w * 100 ) + '%" y1="' + ( startY / h * 100 ) + '%" x2="' + ( endX / w * 100 ) + '%" y2="' + ( endY / h * 100 ) + '%">'
        ];

        // Convert to percentage along the SVG gradient line and add to the stops list
        for( i = 0; i < stopCount; i++ ) {
            svg.push(
                '<stop offset="' + ( stopPx[ i ] / lineLength ) +
                    '" stop-color="' + stopsInfo[i].color.colorValue( el ) +
                    '" stop-opacity="' + stopsInfo[i].color.alpha() + '"/>'
            );
        }

        svg.push(
                    '</linearGradient>' +
                '</defs>' +
                '<rect width="100%" height="100%" fill="url(#g)"/>' +
            '</svg>'
        );

        return svg.join( '' );
    },

    destroy: function() {
        this.targetElement.runtimeStyle.background = '';
    }

} );
