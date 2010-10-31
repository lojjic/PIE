/**
 * Create a single observable listener for window resize events.
 */
(function() {
    PIE.OnResize = new PIE.Observable();

    function resized() {
        PIE.OnResize.fire();
    }

    PIE.OnBeforeUnload.attachManagedEvent( window, 'onresize', resized );
})();
