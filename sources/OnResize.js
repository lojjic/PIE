/**
 * Create a single observable listener for window resize events.
 */
(function() {
    PIE.OnResize = new PIE.Observable();

    function resized() {
        PIE.OnResize.fire();
    }

    window.attachEvent( 'onresize', resized );
    PIE.OnBeforeUnload.observe( function() {
        window.detachEvent( 'onresize', resized );
    } );
})();
