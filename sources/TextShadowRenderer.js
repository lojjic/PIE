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
    textStyles: [ 'fontSize', 'fontFamily', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'textDecoration' ],

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
            shadowProps = this.styleInfos.textShadowInfo.getProps(),
            i = shadowProps.length,
            textStyles = this.textStyles,
            getLength = PIE.getLength,
            filterPrefix = 'progid:DXImageTransform.Microsoft.',
            props, shadowEl, shadowStyle, color, blur, glow, j;

        box.style.width = this.boundsInfo.getBounds().w;
        box.innerHTML = '';
        
        while( i-- ) {
            props = shadowProps[ i ];
            shadowEl = doc.createElement( 'span' );
            color = props.color;
            blur = props.blur.pixels( el );
            glow = blur > 3 ? ( Math.ceil( blur / 4 ) ) : 0;

            shadowStyle = shadowEl.style;
            shadowStyle.position = 'absolute';
            shadowStyle.left = props.xOffset.pixels( el ) - blur + getLength( currentStyle.paddingLeft ).pixels( el );
            shadowStyle.top = props.yOffset.pixels( el ) - blur + getLength( currentStyle.paddingTop ).pixels( el );

            j = textStyles.length;
            while( j-- ) {
                shadowStyle[ textStyles[ j ] ] = currentStyle[ textStyles[ j ] ];
            }
            shadowStyle.color = color.colorValue( el );
            
            if ( blur ) {
                shadowStyle.filter = 'alpha(opacity=' + Math.max( 75 - ( blur * 2 ), 10 ) * color.alpha() + ') ' +
                                        (glow ? filterPrefix + 'Glow(Strength=' + ( glow ) + ', Color=' + color.hexValue( el ) + ') ' : '') +
                                        filterPrefix + 'Blur(PixelRadius=' + ( blur - glow ) + ', MakeShadow=false)';
            }

            shadowEl.innerText = el.innerText;
            box.appendChild( shadowEl );
        }
    }

} );
