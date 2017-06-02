/**
 * Create an observable listener for the onunload event
 */
(function() {
    PIE.OnUnload = new PIE.Observable();

    function handleUnload() {
        PIE.OnUnload.fire();
        win.detachEvent( 'onunload', handleUnload );
        win[ 'PIE' ] = null;
    }

    if (win.addEventListener) {
        win.addEventListener('unload', handleUnload, false);
    } else if (win.attachEvent) {
        win.attachEvent('onunload', handleUnload);
    }

    /**
     * Attach an event which automatically gets detached onunload
     */
    PIE.OnUnload.attachManagedEvent = function( target, name, handler ) {
        if (target.addEventListener) {
            target.addEventListener(name.substr(2), handler, false);
        } else if (target.attachEvent) {
            target.attachEvent(name, handler);
        }
        this.observe( function() {
            target.detachEvent( name, handler );
        } );
    };
})()