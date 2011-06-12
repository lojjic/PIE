/**
 * Renderer for text-shadows
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.TextShadowRenderer = PIE.RendererBase.newRenderer( {

    boxZIndex: 7,
    boxName: 'text-shadow',
    textStyles: [ 'fontSize', 'fontFamily', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'textDecoration', 'textAlign' ],

    needsUpdate: function() {
        return this.styleInfos.textShadowInfo.changed();
    },

    isActive: function() {
        var textShadowInfo = this.styleInfos.textShadowInfo;
        return textShadowInfo.isActive() && textShadowInfo.getProps();
    },


    draw: function() {
        var el = this.targetElement,
            currentStyle = el.currentStyle,
            box = this.getBox(),
            si = this.styleInfos,
            shadowProps = si.textShadowInfo.getProps(),
            i = shadowProps.length,
            textStyles = this.textStyles,
            getLength = PIE.getLength,
            bounds = this.boundsInfo.getBounds(),
            borderProps = si.borderInfo.getProps(),
            borderWidths = borderProps && borderProps.widths,
            borderTopWidth = borderWidths ? borderWidths['t'].pixels( el ) : 0,
            borderLeftWidth = borderWidths ? borderWidths['l'].pixels( el ) : 0,
            filterPrefix = 'progid:DXImageTransform.Microsoft.',
            math = Math,
            round = math.round,
            props, shadowEl, shadowStyle, color, blur, blurLog, glow, opacity, j;

        box.innerHTML = '';
        
        while( i-- ) {
            props = shadowProps[ i ];
            shadowEl = doc.createElement( 'shadow' );
            shadowStyle = shadowEl.style;
            color = props.color;
            blur = props.blur.pixels( el );

            if ( blur ) {
                blurLog = math.log( blur );

                // Decrease the blur size to line up more closely with other browsers
                if ( blur > 2 ) {
                    blur -= .75 + blur / 4;
                }
                else if ( blur > 1 ) {
                    blur = 1.5;
                }
    
                // For blurs over a threshold we must add a small amount of glow before blurring
                // to keep the color from getting washed out.
                glow = blur > 8 ? blurLog : 0;

                // Calculate opacity; all blurs are adjusted down to a baseline and then multiplied
                // by the alpha value from the specified text-shadow color.
                opacity = math.max( ( blur > 8 ? 55 - blurLog * 2 : 70 + blur * 2 ), 1 ) * color.alpha();

                shadowStyle.filter = 'alpha(opacity=' + opacity + ') ' +
                                     ( glow ? filterPrefix + 'Glow(Strength=' + glow + ',Color=' + color.hexValue( el ) + ') ' : '' ) +
                                     filterPrefix + 'Blur(PixelRadius=' + ( blur - glow ) + ',MakeShadow=false)';
            }

            shadowStyle.position = 'absolute';
            shadowStyle.left = props.xOffset.pixels( el ) - round(blur) + borderLeftWidth +
                               getLength( currentStyle.paddingLeft ).pixels( el );
            shadowStyle.top = props.yOffset.pixels( el ) - round(blur) + borderTopWidth +
                              getLength( currentStyle.paddingTop ).pixels( el );
            shadowStyle.width = bounds.w;
            shadowStyle.height = bounds.h;

            // Copy the original text's styles to the shadow element
            j = textStyles.length;
            while( j-- ) {
                shadowStyle[ textStyles[ j ] ] = currentStyle[ textStyles[ j ] ];
            }

            shadowStyle.color = color.colorValue( el );
            shadowEl.innerText = el.innerText;
            box.appendChild( shadowEl );
        }
    }

} );
