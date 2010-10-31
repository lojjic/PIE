/**
 * Create an observable listener for the onbeforeunload event
 */
PIE.OnBeforeUnload = new PIE.Observable();
window.attachEvent( 'onbeforeunload', function() { PIE.OnBeforeUnload.fire(); } );
