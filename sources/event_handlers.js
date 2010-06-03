var lastW, lastH, lastX, lastY,
    renderers,
    styleInfos,
    ancestors;

/**
 * Update position and/or size as necessary. Both move and resize events call
 * this rather than the updatePos/Size functions because sometimes, particularly
 * during page load, one will fire but the other won't.
 */
function update() {
    init();

    /* TODO just using getBoundingClientRect may not always be accurate; it's possible that
       an element will actually move relative to its positioning parent, but its position
       relative to the viewport will stay the same. Need to come up with a better way to
       track movement. The most accurate would be the same logic used in RootRenderer.updatePos()
       but that is a more expensive operation since it does some DOM walking, and we want this
       check to be as fast as possible. */
    var rect = element.getBoundingClientRect(),
        x = rect.left,
        y = rect.top,
        w = rect.right - x,
        h = rect.bottom - y,
        i, len;

    if( x !== lastX || y !== lastY ) {
        for( i = 0, len = renderers.length; i < len; i++ ) {
            renderers[i].updatePos();
        }
        lastX = x;
        lastY = y;
    }
    if( w !== lastW || h !== lastH ) {
        for( i = 0, len = renderers.length; i < len; i++ ) {
            renderers[i].updateSize();
        }
        lastW = w;
        lastH = h;
    }
}

/**
 * Handle property changes to trigger update when appropriate.
 */
function propChanged() {
    init();
    var name = event && event.propertyName,
        i, len, toUpdate;
    if( name === 'style.display' || name === 'style.visibility' ) {
        for( i = 0, len = renderers.length; i < len; i++ ) {
            renderers[i].updateVis();
        }
    }
    else { //if( event.propertyName === 'style.boxShadow' ) {
        toUpdate = [];
        for( i = 0, len = renderers.length; i < len; i++ ) {
            if( renderers[i].needsUpdate() ) {
                toUpdate.push( renderers[i] );
            }
        }
        for( i = 0, len = toUpdate.length; i < len; i++ ) {
            toUpdate[i].updateProps();
        }
    }
}


/**
 * Handle mouseenter events. Adds a custom class to the element to allow IE6 to add
 * hover styles to non-link elements.
 */
function mouseEntered() {
    element.className += ' ' + PIE.CLASS_PREFIX + 'hover';
    //must delay this because the mouseleave event fires before the :hover styles are added.
    setTimeout( propChanged, 0 );
}
/**
 * Handle mouseleave events
 */
function mouseLeft() {
    element.className = element.className.replace( new RegExp( '\\b' + PIE.CLASS_PREFIX + 'hover\\b', 'g' ), '' );
    //must delay this because the mouseleave event fires before the :hover styles are removed.
    setTimeout( propChanged, 0 );
}


/**
 * Handle property changes on ancestors of the element; see initAncestorPropChangeListeners()
 * which adds these listeners as requested with the -pie-watch-ancestors CSS property.
 */
function ancestorPropChanged() {
    var name = event.propertyName;
    if( name === 'className' || name === 'id' ) {
        propChanged();
    }
}


/**
 * Clean everything up when the behavior is removed from the element, or the element
 * is destroyed.
 */
function cleanup() {
    var i, len;

    // destroy any active renderers
    if( renderers ) {
        for( i = 0, len = renderers.length; i < len; i++ ) {
            renderers[i].destroy();
        }
        renderers = null;
    }
    
    styleInfos = null;

    // remove any ancestor propertychange listeners
    if( ancestors ) {
        for( i = 0, len = ancestors.length; i < len; i++ ) {
            ancestors[i].detachEvent( 'onpropertychange', ancestorPropChanged );
        }
        ancestors = null;
    }
}


/**
 * If requested via the custom -pie-watch-ancestors CSS property, add onpropertychange listeners
 * to ancestor(s) of the element so we can pick up style changes based on CSS rules using
 * descendant selectors.
 */
function initAncestorPropChangeListeners() {
    var el = element,
        watch = el.currentStyle.getAttribute( PIE.CSS_PREFIX + 'watch-ancestors' ),
        i, a;
    if( watch ) {
        ancestors = [];
        watch = parseInt( watch, 10 );
        i = 0;
        a = el.parentNode;
        while( a && ( watch === 'NaN' || i++ < watch ) ) {
            ancestors.push( a );
            a.attachEvent( 'onpropertychange', ancestorPropChanged );
            a = a.parentNode;
        }
    }
}


/**
 * Initialize PIE for this element.
 */
function init() {
    if( !renderers ) {
        var el = element;

        // force layout so move/resize events will fire
        el.runtimeStyle.zoom = 1;

        // Create the style infos and renderers
        styleInfos = {
            backgroundInfo: new PIE.BackgroundStyleInfo( el ),
            borderInfo: new PIE.BorderStyleInfo( el ),
            borderImageInfo: new PIE.BorderImageStyleInfo( el ),
            borderRadiusInfo: new PIE.BorderRadiusStyleInfo( el ),
            boxShadowInfo: new PIE.BoxShadowStyleInfo( el )
        };

        var rootRenderer = new PIE.RootRenderer( el, styleInfos );
        renderers = [
            rootRenderer,
            new PIE.BoxShadowOutsetRenderer( el, styleInfos, rootRenderer ),
            new PIE.BackgroundRenderer( el, styleInfos, rootRenderer ),
            new PIE.BoxShadowInsetRenderer( el, styleInfos, rootRenderer ),
            new PIE.BorderRenderer( el, styleInfos, rootRenderer ),
            new PIE.BorderImageRenderer( el, styleInfos, rootRenderer )
        ];

        // Add property change listeners to ancestors if requested
        initAncestorPropChangeListeners();

        update();
    }
}


if( element.readyState === 'complete' ) {
    init();
}
