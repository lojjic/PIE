/*
 * This file exposes the public API for invoking PIE.
 */


/**
 * Programatically attach PIE to a single element.
 * @param {Element} el
 */
PIE[ 'attach' ] = function( el ) {
    if (PIE.ieVersion < 9) {
        PIE.Element.getInstance( el ).init();
    }
};


/**
 * Programatically detach PIE from a single element.
 * @param {Element} el
 */
PIE[ 'detach' ] = function( el ) {
    PIE.Element.destroy( el );
};

