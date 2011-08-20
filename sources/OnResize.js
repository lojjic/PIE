/**
 * Create a single observable listener for window resize events.
 */
PIE.OnResize = new PIE.Observable();

PIE.OnBeforeUnload.attachManagedEvent( window, 'onresize', function() { PIE.OnResize.fire(); } );
