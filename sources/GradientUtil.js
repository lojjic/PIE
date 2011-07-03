/**
 * Utility functions for handling gradients
 */
PIE.GradientUtil = {

    getGradientMetrics: function( el, width, height, gradientInfo ) {
        var angle = gradientInfo.angle,
            startPos = gradientInfo.gradientStart,
            startX, startY,
            endX, endY,
            startCornerX, startCornerY,
            endCornerX, endCornerY,
            deltaX, deltaY,
            p, UNDEF;

        // Find the "start" and "end" corners; these are the corners furthest along the gradient line.
        // This is used below to find the start/end positions of the CSS3 gradient-line, and also in finding
        // the total length of the VML rendered gradient-line corner to corner.
        function findCorners() {
            startCornerX = ( angle >= 90 && angle < 270 ) ? width : 0;
            startCornerY = angle < 180 ? height : 0;
            endCornerX = width - startCornerX;
            endCornerY = height - startCornerY;
        }

        // Normalize the angle to a value between [0, 360)
        function normalizeAngle() {
            while( angle < 0 ) {
                angle += 360;
            }
            angle = angle % 360;
        }

        // Find the start and end points of the gradient
        if( startPos ) {
            startPos = startPos.coords( el, width, height );
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
            p = PIE.GradientUtil.perpendicularIntersect( startX, startY, angle, endCornerX, endCornerY );
            endX = p[0];
            endY = p[1];
        }
        else if( startPos ) {
            // Start position but no angle specified: find the end point by rotating 180deg around the center
            endX = width - startX;
            endY = height - startY;
        }
        else {
            // Neither position nor angle specified; create vertical gradient from top to bottom
            startX = startY = endX = 0;
            endY = height;
        }
        deltaX = endX - startX;
        deltaY = endY - startY;

        if( angle === UNDEF ) {
            // Get the angle based on the change in x/y from start to end point. Checks first for horizontal
            // or vertical angles so they get exact whole numbers rather than what atan2 gives.
            angle = ( !deltaX ? ( deltaY < 0 ? 90 : 270 ) :
                        ( !deltaY ? ( deltaX < 0 ? 180 : 0 ) :
                            -Math.atan2( deltaY, deltaX ) / Math.PI * 180
                        )
                    );
            normalizeAngle();
            findCorners();
        }

        return {
            angle: angle,
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            startCornerX: startCornerX,
            startCornerY: startCornerY,
            endCornerX: endCornerX,
            endCornerY: endCornerY,
            deltaX: deltaX,
            deltaY: deltaY,
            lineLength: PIE.GradientUtil.distance( startX, startY, endX, endY )
        }
    },

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
    perpendicularIntersect: function( x1, y1, angle, x2, y2 ) {
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
            var a1 = Math.tan( -angle * Math.PI / 180 ),
                c1 = a1 * x1 - y1,
                a2 = -1 / a1,
                c2 = a2 * x2 - y2,
                d = a2 - a1,
                endX = ( c2 - c1 ) / d,
                endY = ( a1 * c2 - a2 * c1 ) / d;
            return [ endX, endY ];
        }
    },

    /**
     * Find the distance between two points
     * @param {Number} p1x
     * @param {Number} p1y
     * @param {Number} p2x
     * @param {Number} p2y
     * @return {Number} the distance
     */
    distance: function( p1x, p1y, p2x, p2y ) {
        var dx = p2x - p1x,
            dy = p2y - p1y;
        return Math.abs(
            dx === 0 ? dy :
            dy === 0 ? dx :
            Math.sqrt( dx * dx + dy * dy )
        );
    }

};