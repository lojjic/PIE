
PIE.Element = (function() {

    var wrappers = {},
        lazyInitCssProp = PIE.CSS_PREFIX + 'lazy-init',
        ignorePropertyNames = { 'background':1, 'bgColor':1 };

    function Element( el ) {
        var renderers,
            boundsInfo = new PIE.BoundsInfo( el ),
            styleInfos,
            styleInfosArr,
            ancestors,
            initializing,
            initialized,
            eventsAttached,
            delayed,
            destroyed;

        /**
         * Initialize PIE for this element.
         */
        function init() {
            if( !initialized ) {
                var docEl,
                    bounds,
                    lazy = el.currentStyle.getAttribute( lazyInitCssProp ) === 'true',
                    rootRenderer;

                // Force layout so move/resize events will fire. Set this as soon as possible to avoid layout changes
                // after load, but make sure it only gets called the first time through to avoid recursive calls to init().
                if( !initializing ) {
                    initializing = 1;
                    el.runtimeStyle.zoom = 1;
                    initFirstChildPseudoClass();
                }

                boundsInfo.lock();

                // If the -pie-lazy-init:true flag is set, check if the element is outside the viewport and if so, delay initialization
                if( lazy && ( bounds = boundsInfo.getBounds() ) && ( docEl = doc.documentElement || doc.body ) &&
                        ( bounds.y > docEl.clientHeight || bounds.x > docEl.clientWidth || bounds.y + bounds.h < 0 || bounds.x + bounds.w < 0 ) ) {
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
                    styleInfosArr = [
                        styleInfos.backgroundInfo,
                        styleInfos.borderInfo,
                        styleInfos.borderImageInfo,
                        styleInfos.borderRadiusInfo,
                        styleInfos.boxShadowInfo,
                        styleInfos.visibilityInfo
                    ];

                    rootRenderer = new PIE.RootRenderer( el, boundsInfo, styleInfos );
                    var childRenderers = [
                        new PIE.BoxShadowOutsetRenderer( el, boundsInfo, styleInfos, rootRenderer ),
                        new PIE.BackgroundRenderer( el, boundsInfo, styleInfos, rootRenderer ),
                        new PIE.BoxShadowInsetRenderer( el, boundsInfo, styleInfos, rootRenderer ),
                        new PIE.BorderRenderer( el, boundsInfo, styleInfos, rootRenderer ),
                        new PIE.BorderImageRenderer( el, boundsInfo, styleInfos, rootRenderer )
                    ];
                    rootRenderer.childRenderers = childRenderers; // circular reference, can't pass in constructor; TODO is there a cleaner way?
                    renderers = [ rootRenderer ].concat( childRenderers );

                    // Add property change listeners to ancestors if requested
                    initAncestorPropChangeListeners();

                    // Add to list of polled elements in IE8
                    if( PIE.ie8DocMode === 8 ) {
                        PIE.Heartbeat.observe( update );
                    }

                    // Trigger rendering
                    update();
                }

                if( !eventsAttached ) {
                    eventsAttached = 1;
                    el.attachEvent( 'onmove', handleMoveOrResize );
                    el.attachEvent( 'onresize', handleMoveOrResize );
                    el.attachEvent( 'onpropertychange', propChanged );
                    el.attachEvent( 'onmouseenter', mouseEntered );
                    el.attachEvent( 'onmouseleave', mouseLeft );
                    PIE.OnResize.observe( handleMoveOrResize );
                }

                boundsInfo.unlock();
            }
        }


        /**
         * Event handler for onmove and onresize events. Invokes update() only if the element's
         * bounds have previously been calculated, to prevent multiple runs during page load when
         * the element has no initial CSS3 properties.
         */
        function handleMoveOrResize() {
            if( boundsInfo && boundsInfo.hasBeenQueried() ) {
                update();
            }
        }


        /**
         * Update position and/or size as necessary. Both move and resize events call
         * this rather than the updatePos/Size functions because sometimes, particularly
         * during page load, one will fire but the other won't.
         */
        function update() {
            if( initialized ) {
                if( !destroyed ) {
                    var i, len;

                    boundsInfo.lock();
                    for( i = styleInfosArr.length; i--; ) {
                        styleInfosArr[i].lock();
                    }
                    if( boundsInfo.positionChanged() ) {
                        /* TODO just using getBoundingClientRect (used internally by BoundsInfo) for detecting
                           position changes may not always be accurate; it's possible that
                           an element will actually move relative to its positioning parent, but its position
                           relative to the viewport will stay the same. Need to come up with a better way to
                           track movement. The most accurate would be the same logic used in RootRenderer.updatePos()
                           but that is a more expensive operation since it does some DOM walking, and we want this
                           check to be as fast as possible. */
                        for( i = 0, len = renderers.length; i < len; i++ ) {
                            renderers[i].updatePos();
                        }
                    }
                    if( boundsInfo.sizeChanged() ) {
                        for( i = 0, len = renderers.length; i < len; i++ ) {
                            renderers[i].updateSize();
                        }
                    }
                    for( i = styleInfosArr.length; i--; ) {
                        styleInfosArr[i].unlock();
                    }
                    boundsInfo.unlock();
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
            // Some elements like <table> fire onpropertychange events for old-school background properties
            // ('background', 'bgColor') when runtimeStyle background properties are changed, which
            // results in an infinite loop; therefore we filter out those property names.
            if( !( event && event.propertyName in ignorePropertyNames ) ) {
                if( initialized ) {
                    var i, len,
                        toUpdate = [];

                    boundsInfo.lock();

                    for( i = 0, len = renderers.length; i < len; i++ ) {
                        // Make sure position is synced if the element hasn't already been renderered.
                        // TODO this feels sloppy - look into merging propChanged and update functions
                        if( !renderers[i].isPositioned ) {
                            renderers[i].updatePos();
                        }
                        if( renderers[i].needsUpdate() ) {
                            toUpdate.push( renderers[i] );
                        }
                    }
                    for( i = 0, len = toUpdate.length; i < len; i++ ) {
                        toUpdate[i].updateProps();
                    }

                    boundsInfo.unlock();
                }
                else if( !initializing ) {
                    init();
                }
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
            if( !destroyed ) {
                var i, len;

                destroyed = 1;

                // destroy any active renderers
                if( renderers ) {
                    for( i = 0, len = renderers.length; i < len; i++ ) {
                        renderers[i].destroy();
                    }
                }

                // remove any ancestor propertychange listeners
                if( ancestors ) {
                    for( i = 0, len = ancestors.length; i < len; i++ ) {
                        ancestors[i].detachEvent( 'onpropertychange', ancestorPropChanged );
                        ancestors[i].detachEvent( 'onmouseenter', mouseEntered );
                        ancestors[i].detachEvent( 'onmouseleave', mouseLeft );
                    }
                }

                // Remove from list of polled elements in IE8
                if( PIE.ie8DocMode === 8 ) {
                    PIE.Heartbeat.unobserve( update );
                }
                // Stop onscroll/onresize listening
                PIE.OnScroll.unobserve( update );
                PIE.OnResize.unobserve( update );

                // Remove event listeners
                el.detachEvent( 'onmove', update );
                el.detachEvent( 'onresize', update );
                el.detachEvent( 'onpropertychange', propChanged );
                el.detachEvent( 'onmouseenter', mouseEntered );
                el.detachEvent( 'onmouseleave', mouseLeft );

                // Kill objects
                renderers = boundsInfo = styleInfos = styleInfosArr = ancestors = el = null;
            }
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


        // These methods are all already bound to this instance so there's no need to wrap them
        // in a closure to maintain the 'this' scope object when calling them.
        this.init = init;
        this.update = update;
        this.destroy = destroy;
        this.el = el;
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

    Element.destroyAll = function() {
        var els = [], wrapper;
        if( wrappers ) {
            for( var w in wrappers ) {
                if( wrappers.hasOwnProperty( w ) ) {
                    wrapper = wrappers[ w ];
                    els.push( wrapper.el );
                    wrapper.destroy();
                }
            }
            wrappers = {};
        }
        return els;
    };

    // Destroy all Element objects when leaving the page
    PIE.OnBeforeUnload.observe( Element.destroyAll );

    return Element;
})();

