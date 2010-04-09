var PIE = window.PIE;

if( !PIE ) {
    PIE = window.PIE = {
        CSS_PREFIX: '-pie-',
        STYLE_PREFIX: 'Pie'
    };

    // Detect IE6
    if( !window.XMLHttpRequest ) {
        PIE.isIE6 = true;

        // IE6 can't access properties with leading dash, but can without it.
        PIE.CSS_PREFIX = PIE.CSS_PREFIX.replace( /^-/, '' );
    }

