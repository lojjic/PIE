/**
 * Create a single observable listener for window resize events.
 */
PIE.OnResize = new PIE.Observable();
window.attachEvent( 'onresize', function() { PIE.OnResize.fire(); } );
