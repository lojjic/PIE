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

    copyTextStyles: function( from, to ) {
        var fromStyle = from.currentStyle,
            toStyle = to.style,
            textStyles = this.textStyles,
            i = textStyles.length;
        while( i-- ) {
            toStyle[ textStyles[ i ] ] = fromStyle[ textStyles[ i ] ];
        }
    },

    draw: function() {
        var el = this.targetElement,
            currentStyle = el.currentStyle,
            box = this.getBox(),
            si = this.styleInfos,
            shadowProps = si.textShadowInfo.getProps(),
            i = shadowProps.length,
            getLength = PIE.getLength,
            bounds = this.boundsInfo.getBounds(),
            borderProps = si.borderInfo.getProps(),
            borderWidths = borderProps && borderProps.widths,
            borderTopWidth = borderWidths ? borderWidths['t'].pixels( el ) : 0,
            borderLeftWidth = borderWidths ? borderWidths['l'].pixels( el ) : 0,
            borderRightWidth = borderWidths ? borderWidths['r'].pixels( el ) : 0,
            paddingLeft = getLength( currentStyle.paddingLeft ).pixels( el ),
            paddingRight = getLength( currentStyle.paddingRight ).pixels( el ),
            paddingTop = getLength( currentStyle.paddingTop ).pixels( el ),
            indent = currentStyle.display === 'block' ?
                    getLength( currentStyle.textIndent ).pixels( el ) :
                    currentStyle.display === 'inline' ? el.getClientRects()[0].left - bounds.x : 0,
            filterPrefix = 'progid:DXImageTransform.Microsoft.',
            math = Math,
            round = math.round,
            childNodes = el.childNodes,
            childCount = childNodes.length,
            props, shadowEl, shadowStyle, color, blur, blurLog, glow, opacity, j, child, clone;

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

            // Size and position the shadow element
            shadowStyle.position = 'absolute';
            shadowStyle.left = props.xOffset.pixels( el ) - round(blur) + borderLeftWidth + paddingLeft;
            shadowStyle.top = props.yOffset.pixels( el ) - round(blur) + borderTopWidth + paddingTop;
            shadowStyle.width = bounds.w - paddingLeft - paddingRight - borderLeftWidth - borderRightWidth + round(blur) * 2;

            // Handle indentation of the first line, either due to text-indent CSS on a block element
            // or an inline element that is not the first text on the line and wraps to a second line.
            shadowStyle.textIndent = indent;

            // Copy the original text's styles to the shadow element
            this.copyTextStyles( el, shadowEl );

            shadowStyle.color = color.colorValue( el );

            if ( el.tagName.toLowerCase() in { input:1, textarea:1 } ) {
                shadowEl.innerText = el.value;
            } else {
                var childElements = [];
                for( j = 0; j < childCount; j++ ) {
                    child = childNodes[ j ];
                    if ( child.nodeType === 1 && child.tagName.toLowerCase() !== 'css3-container' ) {
                        clone = this.deepCopy( child );
                        clone.style.visibility = 'hidden';
                        shadowEl.appendChild( clone );

                        clone.style.zoom = 1; //The original child is going to get layout by attaching PIE, so force layout on the clone to match
                        childElements.push( child );
                    }
                    else if ( child.nodeType === 3 ) {
                        shadowEl.appendChild( child.cloneNode() );
                    }
                }

                for( j = childElements.length; j--; ) {
                    PIE.attach( childElements[ j ] );
                }
            }

            box.appendChild( shadowEl );
        }
    },

    deepCopy: function( el ) {
        var copy = doc.createElement( 'subel' ),
            childNodes = el.childNodes,
            childLength = childNodes.length,
            i = 0, child, nodeType;
        this.copyTextStyles( el, copy );
        for ( ; i < childLength; i++ ) {
            child = childNodes[ i ];
            nodeType = child.nodeType;
            if ( nodeType == 1 && child.tagName !== 'css3-container' ) {
                copy.appendChild( this.deepCopy( child ) );
            }
            else if ( nodeType == 3 ) {
                copy.appendChild( child.cloneNode() );
            }
        }
        copy.style.display = el.currentStyle.display;
        return copy;
    }

} );
