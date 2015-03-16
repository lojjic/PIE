/**
 * Renderer for element backgrounds, specific for IE9. Only handles translating CSS3 gradients
 * to an equivalent SVG data URI.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 */
PIE.IE9BackgroundRenderer = PIE.RendererBase.newRenderer( {

    drawingCanvas: doc.createElement( 'canvas' ),

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
                        if (bgAreaSize.h > 0 && bgAreaSize.w > 0) {
                            bgSize = ( img.bgSize || PIE.BgSize.DEFAULT ).pixels(
                                me.targetElement, bgAreaSize.w, bgAreaSize.h, bgAreaSize.w, bgAreaSize.h
                            );
                            bg.push(
                                'url(' + me.getGradientImgData( img, bgSize.w, bgSize.h )  + ') ' +
                                me.bgPositionToString( img.bgPosition ) + ' / ' + bgSize.w + 'px ' + bgSize.h + 'px ' +
                                ( img.bgAttachment || '' ) + ' ' + ( img.bgOrigin || '' ) + ' ' + ( img.bgClip || '' )
                            );
                        }
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

    getGradientImgData: function( info, bgWidth, bgHeight ) {
        var me = this,
            el = me.targetElement,
            stopsInfo = info.stops,
            stopCount = stopsInfo.length,
            metrics = PIE.GradientUtil.getGradientMetrics( el, bgWidth, bgHeight, info ),
            lineLength = metrics.lineLength,
            canvas = me.drawingCanvas,
            context = canvas.getContext( '2d' ),
            gradient = context.createLinearGradient( metrics.startX, metrics.startY, metrics.endX, metrics.endY ),
            stopPx = [],
            i, j, before, after;

        // Find the pixel offsets along the CSS3 gradient-line for each stop.
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

        // Convert stops to percentages along the gradient line and add a stop for each
        for( i = 0; i < stopCount; i++ ) {
            gradient.addColorStop( stopPx[ i ] / lineLength, stopsInfo[ i ].color.val );
        }

        canvas.width = bgWidth;
        canvas.height = bgHeight;
        context.fillStyle = gradient;
        context.fillRect( 0, 0, bgWidth, bgHeight );
        return canvas.toDataURL();
    },

    destroy: function() {
        this.parent.setBackgroundLayer( this.bgLayerZIndex );
    }

} );
