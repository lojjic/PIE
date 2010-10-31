/**
 * Create a single observable listener for scroll events. Used for lazy loading based
 * on the viewport, and for fixed position backgrounds.
 */
(function() {
    PIE.OnScroll = new PIE.Observable();

    function scrolled() {
        PIE.OnScroll.fire();
    }

    window.attachEvent( 'onscroll', scrolled );
    PIE.OnBeforeUnload.observe( function() {
        window.detachEvent( 'onscroll', scrolled );
    } );

    PIE.OnResize.observe( scrolled );
})();
