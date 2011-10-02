/*
 * This file exposes the public API for invoking PIE.
 */


/**
 * The version number of this PIE build.
 */
PIE[ 'version' ] = '$Version$';


/**
 * @property supportsVML
 * True if the current IE browser environment has a functioning VML engine. Should be true
 * in most IEs, but in rare cases may be false. If false, PIE will exit immediately when
 * attached to an element (for IE<9) to prevent errors; this property may also be used for
 * debugging or by external scripts to perform some special action when VML support is absent.
 * @type {boolean}
 */
PIE[ 'supportsVML' ] = PIE.supportsVML;


/**
 * Programatically attach PIE to a single element.
 * @param {Element} el
 */
PIE[ 'attach' ] = function( el ) {
    if ( PIE.ieDocMode === 9 || ( PIE.ieDocMode < 9 && PIE.supportsVML ) ) {
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

