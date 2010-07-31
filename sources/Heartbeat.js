/*
 * Set up polling for IE8 - this is a brute-force workaround for syncing issues caused by IE8 not
 * always firing the onmove and onresize events when elements are moved or resized. We check a few
 * times every second to make sure the elements have the correct position and size.
 */

if( PIE.ie8DocMode === 8 ) {
    PIE.Heartbeat = new PIE.Observable();
    setInterval( function() { PIE.Heartbeat.fire() }, 250 );
}
