/**
 * Create a single observable listener for scroll events. Used for lazy loading based
 * on the viewport, and for fixed position backgrounds.
 */
(function() {
    PIE.OnScroll = new PIE.Observable();

    function scrolled() {
        PIE.OnScroll.fire();
    }

    PIE.OnBeforeUnload.attachManagedEvent( window, 'onscroll', scrolled );

    PIE.OnResize.observe( scrolled );
})();
