/**
 * Renderer for element backgrounds, specific for IE9. Only handles translating CSS3 gradients
 * to an equivalent SVG data URI.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.IE9BackgroundRenderer = PIE.RendererBase.newRenderer( {

    bgLayerZIndex: 1,

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.backgroundInfo.changed();
    },

    isActive: function() {
        var si = this.styleInfos;
        return si.backgroundInfo.isActive() || si.borderImageInfo.isActive();
    },

    draw: function() {
        var me = this,
            styleInfos = me.styleInfos,
            bgInfo = styleInfos.backgroundInfo,
            props = bgInfo.getProps(),
            bg, images, i = 0, img, bgAreaSize, bgSize;

        if ( props ) {
            bg = [];

            images = props.bgImages;
            if ( images ) {
                while( img = images[ i++ ] ) {
                    if (img.imgType === 'linear-gradient' ) {
                        bgAreaSize = bgInfo.getBgAreaSize( bg.bgOrigin, me.boundsInfo, styleInfos.borderInfo, styleInfos.paddingInfo );
                        bgSize = ( img.bgSize || PIE.BgSize.DEFAULT ).pixels(
                            me.targetElement, bgAreaSize.w, bgAreaSize.h, bgAreaSize.w, bgAreaSize.h
                        );
                        bg.push(
                            'url(data:image/svg+xml,' + escape( me.getGradientSvg( img, bgSize.w, bgSize.h ) ) + ') ' +
                            me.bgPositionToString( img.bgPosition ) + ' / ' + bgSize.w + 'px ' + bgSize.h + 'px ' +
                            ( img.bgAttachment || '' ) + ' ' + ( img.bgOrigin || '' ) + ' ' + ( img.bgClip || '' )
                        );
                    } else {
                        bg.push( img.origString );
                    }
                }
            }

            if ( props.color ) {
                bg.push( props.color.val + ' ' + ( props.colorClip || '' ) );
            }

            me.parent.setBackgroundLayer(me.bgLayerZIndex, bg.join(','));
        }
    },

    bgPositionToString: function( bgPosition ) {
        return bgPosition ? bgPosition.tokens.map(function(token) {
            return token.tokenValue;
        }).join(' ') : '0 0';
    },

    getGradientSvg: function( info, bgWidth, bgHeight ) {
        var el = this.targetElement,
            stopsInfo = info.stops,
            stopCount = stopsInfo.length,
            metrics = PIE.GradientUtil.getGradientMetrics( el, bgWidth, bgHeight, info ),
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
            '<svg width="' + bgWidth + '" height="' + bgHeight + '" xmlns="http://www.w3.org/2000/svg">' +
                '<defs>' +
                    '<linearGradient id="g" gradientUnits="userSpaceOnUse"' +
                    ' x1="' + ( startX / bgWidth * 100 ) + '%" y1="' + ( startY / bgHeight * 100 ) + '%" x2="' + ( endX / bgWidth * 100 ) + '%" y2="' + ( endY / bgHeight * 100 ) + '%">'
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
        this.parent.setBackgroundLayer( this.bgLayerZIndex );
    }

} );
