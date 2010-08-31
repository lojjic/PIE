
PIE.Element = (function() {

    var wrappers = {};

    function Element( el ) {
        var lastW, lastH, lastX, lastY,
            renderers,
            styleInfos,
            ancestors,
            initializing,
            initialized,
            delayed;

        /**
         * Initialize PIE for this element.
         */
        function init() {
            if( !initialized ) {
                var doc = el.document,
                    docEl = doc.documentElement || doc.body,
                    rect,
                    rootRenderer;

                // Force layout so move/resize events will fire. Set this as soon as possible to avoid layout changes
                // after load, but make sure it only gets called the first time through to avoid recursive calls to init().
                if( !initializing ) {
                    initializing = 1;
                    el.runtimeStyle.zoom = 1;
                    initFirstChildPseudoClass();

                    el.attachEvent( 'onmove', update );
                    el.attachEvent( 'onresize', update );
                    el.attachEvent( 'onpropertychange', propChanged );
                    el.attachEvent( 'onmouseenter', mouseEntered );
                    el.attachEvent( 'onmouseleave', mouseLeft );
                }

                rect = el.getBoundingClientRect();

                // Check if the element is in the viewport; if not, delay initialization
                if( rect.top > docEl.clientHeight || rect.left > docEl.clientWidth || rect.bottom < 0 || rect.right < 0 ) {
                    if( !delayed ) {
                        delayed = 1;
                        PIE.OnScroll.observe( init );
                    }
                } else {
                    initialized = 1;
                    delayed = initializing = 0;
                    PIE.OnScroll.unobserve( init );

                    // Create the style infos and renderers
                    styleInfos = {
                        backgroundInfo: new PIE.BackgroundStyleInfo( el ),
                        borderInfo: new PIE.BorderStyleInfo( el ),
                        borderImageInfo: new PIE.BorderImageStyleInfo( el ),
                        borderRadiusInfo: new PIE.BorderRadiusStyleInfo( el ),
                        boxShadowInfo: new PIE.BoxShadowStyleInfo( el ),
                        visibilityInfo: new PIE.VisibilityStyleInfo( el )
                    };

                    rootRenderer = new PIE.RootRenderer( el, styleInfos );
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

                    // Add to list of polled elements in IE8
                    if( PIE.ie8DocMode === 8 ) {
                        PIE.Heartbeat.observe( update );
                    }

                    // Listen for window resize events
                    PIE.OnResize.observe( update );

                    // Trigger rendering
                    update();
                }
            }
        }


        /**
         * Update position and/or size as necessary. Both move and resize events call
         * this rather than the updatePos/Size functions because sometimes, particularly
         * during page load, one will fire but the other won't.
         */
        function update() {
            if( initialized ) {
                /* TODO just using getBoundingClientRect may not always be accurate; it's possible that
                   an element will actually move relative to its positioning parent, but its position
                   relative to the viewport will stay the same. Need to come up with a better way to
                   track movement. The most accurate would be the same logic used in RootRenderer.updatePos()
                   but that is a more expensive operation since it does some DOM walking, and we want this
                   check to be as fast as possible. */
                var rect = el.getBoundingClientRect(),
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
            else if( !initializing ) {
                init();
            }
        }

        /**
         * Handle property changes to trigger update when appropriate.
         */
        function propChanged() {
            if( initialized ) {
                var i, len,
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
            else if( !initializing ) {
                init();
            }
        }


        /**
         * Handle mouseenter events. Adds a custom class to the element to allow IE6 to add
         * hover styles to non-link elements.
         */
        function mouseEntered() {
            if( PIE.ieVersion === 6 && el.tagName !== 'A' ) {
                el.className += ' ' + PIE.CLASS_PREFIX + 'hover';
            }
            //must delay this because the mouseleave event fires before the :hover styles are added.
            setTimeout( propChanged, 0 );
        }

        /**
         * Handle mouseleave events
         */
        function mouseLeft() {
            if( PIE.ieVersion === 6 && el.tagName !== 'A' ) {
                el.className = el.className.replace( PIE.hoverClassRE, '' );
            }
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
        function destroy() {
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
                    ancestors[i].detachEvent( 'onmouseenter', mouseEntered );
                    ancestors[i].detachEvent( 'onmouseleave', mouseLeft );
                }
                ancestors = null;
            }

            // Remove from list of polled elements in IE8
            if( PIE.ie8DocMode === 8 ) {
                PIE.Heartbeat.unobserve( update );
            }
            // Stop onscroll/onresize listening
            PIE.OnScroll.unobserve( update );
            PIE.OnResize.unobserve( update );

            el.detachEvent( 'onmove', update );
            el.detachEvent( 'onresize', update );
            el.detachEvent( 'onpropertychange', propChanged );
            el.detachEvent( 'onmouseenter', mouseEntered );
            el.detachEvent( 'onmouseleave', mouseLeft );

        }


        /**
         * If requested via the custom -pie-watch-ancestors CSS property, add onpropertychange listeners
         * to ancestor(s) of the element so we can pick up style changes based on CSS rules using
         * descendant selectors.
         */
        function initAncestorPropChangeListeners() {
            var watch = el.currentStyle.getAttribute( PIE.CSS_PREFIX + 'watch-ancestors' ),
                i, a;
            if( watch ) {
                ancestors = [];
                watch = parseInt( watch, 10 );
                i = 0;
                a = el.parentNode;
                while( a && ( watch === 'NaN' || i++ < watch ) ) {
                    ancestors.push( a );
                    a.attachEvent( 'onpropertychange', ancestorPropChanged );
                    a.attachEvent( 'onmouseenter', mouseEntered );
                    a.attachEvent( 'onmouseleave', mouseLeft );
                    a = a.parentNode;
                }
            }
        }


        /**
         * If the target element is a first child, add a pie_first-child class to it. This allows using
         * the added class as a workaround for the fact that PIE's rendering element breaks the :first-child
         * pseudo-class selector.
         */
        function initFirstChildPseudoClass() {
            var tmpEl = el,
                isFirst = 1;
            while( tmpEl = tmpEl.previousSibling ) {
                if( tmpEl.nodeType === 1 ) {
                    isFirst = 0;
                    break;
                }
            }
            if( isFirst ) {
                el.className += ' ' + PIE.CLASS_PREFIX + 'first-child';
            }
        }


        // Public methods - these are all already bound to this instance so there's no need to wrap them
        // in a closure to maintain the 'this' scope object.
        this.init = init;
        this.update = update;
        this.destroy = destroy;
    }

    Element.getInstance = function( el ) {
        var id = PIE.Util.getUID( el );
        return wrappers[ id ] || ( wrappers[ id ] = new Element( el ) );
    };

    Element.destroy = function( el ) {
        var id = PIE.Util.getUID( el ),
            wrapper = wrappers[ id ];
        if( wrapper ) {
            wrapper.destroy();
            delete wrappers[ id ];
        }
    };

    // Destroy all Element objects when leaving the page
    window.attachEvent( 'onbeforeunload', function() {
        if( wrappers ) {
            for( var w in wrappers ) {
                if( wrappers.hasOwnProperty( w ) ) {
                    wrappers[ w ].destroy();
                }
            }
        }
    } );

    return Element;
})();

