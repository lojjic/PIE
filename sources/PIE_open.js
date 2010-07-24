var PIE = window['PIE'];

if( !PIE ) {
    PIE = window['PIE'] = {
        CSS_PREFIX: '-pie-',
        STYLE_PREFIX: 'Pie',
        CLASS_PREFIX: 'pie_'
    };

    // Detect IE6
    if( !window.XMLHttpRequest ) {
        PIE.isIE6 = true;

        // IE6 can't access properties with leading dash, but can without it.
        PIE.CSS_PREFIX = PIE.CSS_PREFIX.replace( /^-/, '' );
    }

    // Detect IE8
    PIE.isIE8 = !!element.document.documentMode;

