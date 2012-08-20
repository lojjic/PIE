/**
 * Renderer for element backgrounds.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BackgroundRenderer = PIE.RendererBase.newRenderer( {

    shapeZIndex: 2,

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.backgroundInfo.changed() || si.borderRadiusInfo.changed();
    },

    isActive: function() {
        var si = this.styleInfos;
        return si.borderImageInfo.isActive() ||
               si.borderRadiusInfo.isActive() ||
               si.backgroundInfo.isActive() ||
               ( si.boxShadowInfo.isActive() && si.boxShadowInfo.getProps().inset );
    },

    /**
     * Draw the shapes
     */
    draw: function() {
        var bounds = this.boundsInfo.getBounds();
        if( bounds.w && bounds.h ) {
            this.drawBgColor();
            this.drawBgImages();
        }
    },

    /**
     * Draw the background color shape
     */
    drawBgColor: function() {
        var props = this.styleInfos.backgroundInfo.getProps(),
            bounds = this.boundsInfo.getBounds(),
            el = this.targetElement,
            color = props && props.color,
            shape, alpha;

        if( color && color.alpha() > 0 ) {
            this.hideBackground();

            shape = this.getShape( 'bgColor', this.shapeZIndex );

            shape.setSize( bounds.w, bounds.h );
            shape.setAttrs(
                'path', this.getBgClipPath( bounds, props.colorClip )
            );
            shape.setFillAttrs( 'color', color.colorValue( el ) );
            alpha = color.alpha();
            if( alpha < 1 ) {
                shape.setFillAttrs( 'opacity', alpha );
            }
        } else {
            this.deleteShape( 'bgColor' );
        }
    },

    /**
     * Draw all the background image layers
     */
    drawBgImages: function() {
        var props = this.styleInfos.backgroundInfo.getProps(),
            bounds = this.boundsInfo.getBounds(),
            images = props && props.bgImages,
            img, shape, w, h, i;

        if( images ) {
            this.hideBackground();

            w = bounds.w;
            h = bounds.h;

            i = images.length;
            while( i-- ) {
                img = images[i];
                shape = this.getShape( 'bgImage' + i, this.shapeZIndex + ( .5 - i / 1000 ) );

                shape.setAttrs(
                    'path', this.getBgClipPath( bounds, img.bgClip )
                );
                shape.setSize( w, h );

                if( img.imgType === 'linear-gradient' ) {
                    this.addLinearGradient( shape, img );
                }
                else {
                    shape.setFillAttrs(
                        'type', 'tile',
                        'color', 'none'
                    );
                    this.positionBgImage( shape, img.imgUrl, i );
                }
            }
        }

        // Delete any bgImage shapes previously created which weren't used above
        i = images ? images.length : 0;
        while( this.deleteShape( 'bgImage' + i++ ) ) {}
    },


    /**
     * Set the position and clipping of the background image for a layer
     * @param {Element} shape
     * @param {String} src
     * @param {number} index
     */
    positionBgImage: function( shape, src, index ) {
        PIE.Util.withImageSize( src, function( imgSize ) {
            var me = this,
                el = me.targetElement,
                bounds = me.boundsInfo.getBounds(),
                elW = bounds.w,
                elH = bounds.h;

            // It's possible that the element dimensions are zero now but weren't when the original
            // update executed, make sure that's not the case to avoid divide-by-zero error
            if( elW && elH ) {
                var styleInfos = me.styleInfos,
                    bgInfo = styleInfos.backgroundInfo,
                    bg = bgInfo.getProps().bgImages[ index ],
                    bgAreaSize = bgInfo.getBgAreaSize( bg.bgOrigin, me.boundsInfo, styleInfos.borderInfo, styleInfos.paddingInfo ),
                    adjustedImgSize = ( bg.bgSize || PIE.BgSize.DEFAULT ).pixels(
                        me.targetElement, bgAreaSize.w, bgAreaSize.h, imgSize.w, imgSize.h
                    ),
                    bgOriginXY = me.getBgOriginXY( bg.bgOrigin ),
                    bgPos = bg.bgPosition ? bg.bgPosition.coords( el, bgAreaSize.w - adjustedImgSize.w, bgAreaSize.h - adjustedImgSize.h ) : { x:0, y:0 },
                    repeat = bg.imgRepeat,
                    pxX, pxY,
                    clipT = 0, clipL = 0,
                    clipR = elW + 1, clipB = elH + 1, //make sure the default clip region is not inside the box (by a subpixel)
                    clipAdjust = PIE.ieVersion === 8 ? 0 : 1; //prior to IE8 requires 1 extra pixel in the image clip region

                // Positioning - find the pixel offset from the top/left and convert to a ratio
                // The position is shifted by half a pixel, to adjust for the half-pixel coordorigin shift which is
                // needed to fix antialiasing but makes the bg image fuzzy.
                pxX = Math.round( bgOriginXY.x + bgPos.x ) + 0.5;
                pxY = Math.round( bgOriginXY.y + bgPos.y ) + 0.5;
                shape.setFillAttrs(
                    'src', src,
                    'position', ( pxX / elW ) + ',' + ( pxY / elH ),

                    // Set the size of the image. We only set it if the image is scaled via background-size or by
                    // the user changing the browser zoom level, to avoid fuzzy images at normal size. For some reason
                    // using px units doesn't work in VML markup so we must convert to pt.
                    'size', ( adjustedImgSize.w !== imgSize.w || adjustedImgSize.h !== imgSize.h ||
                        bounds.logicalZoomRatio !== 1 || screen['logicalXDPI'] / screen['deviceXDPI'] !== 1 ) ?
                        PIE.Length.pxToPt( adjustedImgSize.w ) + 'pt,' + PIE.Length.pxToPt( adjustedImgSize.h ) + 'pt' : ''
                );

                // Repeating - clip the image shape
                if( repeat && repeat !== 'repeat' ) {
                    if( repeat === 'repeat-x' || repeat === 'no-repeat' ) {
                        clipT = pxY + 1;
                        clipB = pxY + adjustedImgSize.h + clipAdjust;
                    }
                    if( repeat === 'repeat-y' || repeat === 'no-repeat' ) {
                        clipL = pxX + 1;
                        clipR = pxX + adjustedImgSize.w + clipAdjust;
                    }
                    shape.setStyles( 'clip', 'rect(' + clipT + 'px,' + clipR + 'px,' + clipB + 'px,' + clipL + 'px)' );
                }
            }
        }, this );
    },


    /**
     * For a given background-clip value, return the VML path for that clip area.
     * @param {Object} bounds
     * @param {String} bgClip
     */
    getBgClipPath: function( bounds, bgClip ) {
        var me = this,
            shrinkT = 0,
            shrinkR = 0,
            shrinkB = 0,
            shrinkL = 0,
            el = me.targetElement,
            styleInfos = me.styleInfos,
            borders, paddings;

        if ( bgClip && bgClip !== 'border-box' ) {
            borders = styleInfos.borderInfo.getProps();
            if ( borders && ( borders = borders.widths ) ) {
                shrinkT += borders[ 't' ].pixels( el );
                shrinkR += borders[ 'r' ].pixels( el );
                shrinkB += borders[ 'b' ].pixels( el );
                shrinkL += borders[ 'l' ].pixels( el );
            }
        }

        if ( bgClip === 'content-box' ) {
            paddings = styleInfos.paddingInfo.getProps();
            if( paddings ) {
                shrinkT += paddings[ 't' ].pixels( el );
                shrinkR += paddings[ 'r' ].pixels( el );
                shrinkB += paddings[ 'b' ].pixels( el );
                shrinkL += paddings[ 'l' ].pixels( el );
            }
        }

        // Add points at 0,0 and w,h so that the image size/position will still be
        // based on the full element area.
        return 'm0,0r0,0m' + bounds.w * 2 + ',' + bounds.h * 2 + 'r0,0' +
               me.getBoxPath( shrinkT, shrinkR, shrinkB, shrinkL, 2 );
    },


    /**
     * For a given background-origin value, return the x/y position of the origin
     * from the top-left of the element bounds.
     * @param {String} bgOrigin
     */
    getBgOriginXY: function( bgOrigin ) {
        var me = this,
            el = me.targetElement,
            styleInfos = me.styleInfos,
            x = 0,
            y = 0,
            borders, paddings;

        if( bgOrigin !== 'border-box' ) {
            borders = styleInfos.borderInfo.getProps();
            if( borders && ( borders = borders.widths ) ) {
                x += borders[ 'l' ].pixels( el );
                y += borders[ 't' ].pixels( el );
            }
        }

        if ( bgOrigin === 'content-box' ) {
            paddings = styleInfos.paddingInfo.getProps();
            if( paddings ) {
                x += paddings[ 'l' ].pixels( el );
                y += paddings[ 't' ].pixels( el );
            }
        }

        return { x: x, y: y };
    },


    /**
     * Draw the linear gradient for a gradient layer
     * @param {Element} shape
     * @param {Object} info The object holding the information about the gradient
     */
    addLinearGradient: function( shape, info ) {
        var el = this.targetElement,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            stops = info.stops,
            stopCount = stops.length,
            PI = Math.PI,
            metrics = PIE.GradientUtil.getGradientMetrics( el, w, h, info ),
            angle = metrics.angle,
            lineLength = metrics.lineLength,
            vmlAngle, vmlColors,
            stopPx, i, j, before, after;

        // In VML land, the angle of the rendered gradient depends on the aspect ratio of the shape's
        // bounding box; for example specifying a 45 deg angle actually results in a gradient
        // drawn diagonally from one corner to its opposite corner, which will only appear to the
        // viewer as 45 degrees if the shape is equilateral. We adjust for this by taking the x/y deltas
        // between the start and end points, multiply one of them by the shape's aspect ratio,
        // and get their arctangent, resulting in an appropriate VML angle. If the angle is perfectly
        // horizontal or vertical then we don't need to do this conversion.
        // VML angles go in the opposite direction from CSS angles.
        vmlAngle = ( angle % 90 ) ?
            Math.atan2( metrics.startY - metrics.endY, ( metrics.endX - metrics.startX ) * w / h ) / PI * 180 - 90 :
            -angle;
        while( vmlAngle < 0 ) {
            vmlAngle += 360;
        }
        vmlAngle = vmlAngle % 360;

        // Add all the stops to the VML 'colors' list, including the first and last stops.
        // For each, we find its pixel offset along the gradient-line; if the offset of a stop is less
        // than that of its predecessor we increase it to be equal.
        vmlColors = [];

        // Find the pixel offsets along the CSS3 gradient-line for each stop.
        stopPx = [];
        for( i = 0; i < stopCount; i++ ) {
            stopPx.push( stops[i].offset ? stops[i].offset.pixels( el, lineLength ) :
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
            // Make sure each stop's offset is no less than the one before it
            stopPx[ i ] = Math.max( stopPx[ i ], stopPx[ i - 1 ] );
        }

        // Convert to percentage along the gradient line and add to the VML 'colors' value
        for( i = 0; i < stopCount; i++ ) {
            vmlColors.push(
                ( stopPx[ i ] / lineLength * 100 ) + '% ' + stops[i].color.colorValue( el )
            );
        }

        // Now, finally, we're ready to render the gradient fill. Set the start and end colors to
        // the first and last stop colors; this just sets outer bounds for the gradient.
        shape.setFillAttrs(
            'angle', vmlAngle,
            'type', 'gradient',
            'method', 'sigma',
            'color', stops[0].color.colorValue( el ),
            'color2', stops[stopCount - 1].color.colorValue( el ),
            'colors', vmlColors.join( ',' )
        );

        // Set opacity; right now we only support this for two-stop gradients, multi-stop
        // opacity will require chopping up each segment into its own shape.
        // Note these seem backwards but they must be that way since VML strangely reverses
        // them when the 'colors' property is present.
        if ( stopCount === 2 ) {
            shape.setFillAttrs(
                'opacity', stops[1].color.alpha(),
                'o:opacity2', stops[0].color.alpha()
            );
        }
    },


    /**
     * Hide the actual background image and color of the element.
     */
    hideBackground: function() {
        var rs = this.targetElement.runtimeStyle;
        rs.backgroundImage = 'url(about:blank)'; //ensures the background area reacts to mouse events
        rs.backgroundColor = 'transparent';
    },

    destroy: function() {
        PIE.RendererBase.destroy.call( this );
        var rs = this.targetElement.runtimeStyle;
        rs.backgroundImage = rs.backgroundColor = '';
    }

} );
