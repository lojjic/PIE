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
                        'url(data:image/svg+xml,' + escape( this.getGradientSvg( img ) ) + ') ' +
                            ( img.imgRepeat || '' ) + ' ' + this.bgPositionToString( img.bgPosition ) :
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

    bgPositionToString: function( bgPosition ) {
        return bgPosition ? bgPosition.tokens.map(function(token) {
            return token.tokenValue;
        }).join(' ') : '';
    },

    getGradientSvg: function( info ) {
        var el = this.targetElement,
            bounds = this.boundsInfo.getBounds(),
            stopsInfo = info.stops,
            stopCount = stopsInfo.length,
            bgSize = ( info.bgSize || PIE.BgSize.DEFAULT ).pixels( el, bounds.w, bounds.h, bounds.w, bounds.h ),
            w = bgSize.w,
            h = bgSize.h,
            metrics = PIE.GradientUtil.getGradientMetrics( el, w, h, info ),
            startX = metrics.startX,
            startY = metrics.startY,
            endX = metrics.endX,
            endY = metrics.endY,
            lineLength = metrics.lineLength,
            stopPx,
            i, j, before, after,
            svg;

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
