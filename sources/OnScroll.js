/**
 * Create a single observable listener for scroll events. Used for lazy loading based
 * on the viewport, and for fixed position backgrounds.
 */
PIE.OnScroll = new PIE.Observable();
window.attachEvent( 'onscroll', function() { PIE.OnScroll.fire(); } );
window.attachEvent( 'onresize', function() { PIE.OnScroll.fire(); } );
