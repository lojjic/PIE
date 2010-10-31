/**
 * Create an observable listener for the onbeforeunload event
 */
PIE.OnBeforeUnload = new PIE.Observable();
window.attachEvent( 'onbeforeunload', function() { PIE.OnBeforeUnload.fire(); } );

/**
 * Attach an event which automatically gets detached onbeforeunload
 */
PIE.OnBeforeUnload.attachManagedEvent = function( target, name, handler ) {
    target.attachEvent( name, handler );
    this.observe( function() {
        target.detachEvent( name, handler );
    } );
};