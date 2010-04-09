var lastW, lastH, lastX, lastY,
    renderers,
    styleInfos,
    ancestors;

/**
 * Update position and/or size as necessary. Both move and resize events call
 * this rather than the updatePos/Size functions because sometimes, particularly
 * during page load, one will fire but the other won't.
 */
function update( force ) {
    if( renderers ) {
        var el = element,
            x = el.offsetLeft,
            y = el.offsetTop,
            w = el.offsetWidth,
            h = el.offsetHeight,
            i, len;

        if( force || x !== lastX || y !== lastY ) {
            for( i = 0, len = renderers.length; i < len; i++ ) {
                renderers[i].updatePos();
            }
            lastX = x;
            lastY = y;
        }
        if( force || w !== lastW || h !== lastH ) {
            for( i = 0, len = renderers.length; i < len; i++ ) {
                renderers[i].updateSize();
            }
            lastW = w;
            lastH = h;
        }
    }
}

/**
 * Handle property changes to trigger update when appropriate.
 */
function propChanged() {
    if( renderers ) {
        var name = event.propertyName,
            i, len, toUpdate;
        if( name === 'style.display' || name === 'style.visibility' ) {
            for( i = 0, len = renderers.length; i < len; i++ ) {
                renderers[i].updateVis();
            }
        }
        else { //if( event.propertyName === 'style.boxShadow' ) {
            toUpdate = [];
            for( i = 0, len = renderers.length; i < len; i++ ) {
                toUpdate.push( renderers[i] );
            }
            for( i = 0, len = toUpdate.length; i < len; i++ ) {
                toUpdate[i].updateProps();
            }
        }
    }
}


function ancestorPropChanged() {
    var name = event.propertyName;
    if( name === 'className' || name === 'id' ) {
        propChanged();
    }
}


function cleanup() {
    var i, len;

    // destroy any active renderers
    for( i = 0, len = renderers.length; i < len; i++ ) {
        renderers[i].destroy();
    }
    renderers = null;
    styleInfos = null;

    // remove any ancestor propertychange listeners
    if( ancestors ) {
        for( i = 0, len = ancestors.length; i < len; i++ ) {
            ancestors[i].detachEvent( 'onpropertychange', ancestorPropChanged );
        }
        ancestors = null;
    }
}



function initAncestorPropChangeListeners() {
    var watch = element.currentStyle.getAttribute( PIE.CSS_PREFIX + 'watch-ancestors' ),
        i, a;
    if( watch ) {
        ancestors = [];
        watch = parseInt( watch, 10 );
        i = 0;
        a = element.parentNode;
        while( a && ( watch === 'NaN' || i++ < watch ) ) {
            ancestors.push( a );
            a.attachEvent( 'onpropertychange', ancestorPropChanged );
            a = a.parentNode;
        }
    }
}


/**
 * Initialize
 */
function init() {
    var el = element;

    // force layout so move/resize events will fire
    el.runtimeStyle.zoom = 1;

    // Create the style infos and renderers
    styleInfos = {
        background: new PIE.BackgroundStyleInfo( el ),
        border: new PIE.BorderStyleInfo( el ),
        borderImage: new PIE.BorderImageStyleInfo( el ),
        borderRadius: new PIE.BorderRadiusStyleInfo( el ),
        boxShadow: new PIE.BoxShadowStyleInfo( el )
    };

    var rootRenderer = new PIE.RootRenderer( el, styleInfos );
    renderers = [
        rootRenderer,
        new PIE.BoxShadowRenderer( el, styleInfos, rootRenderer ),
        new PIE.BackgroundAndBorderRenderer( el, styleInfos, rootRenderer ),
        new PIE.BorderImageRenderer( el, styleInfos, rootRenderer )
    ];

    // Add property change listeners to ancestors if requested
    initAncestorPropChangeListeners();

    update();
}