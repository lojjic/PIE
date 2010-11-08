var PIE = window['PIE'];

if( !PIE ) {
    PIE = window['PIE'] = {
        CSS_PREFIX: '-pie-',
        STYLE_PREFIX: 'Pie',
        CLASS_PREFIX: 'pie_',
        tableCellTags: {
            'TD': 1,
            'TH': 1
        }
    };

    // Force the background cache to be used. No reason it shouldn't be.
    doc.execCommand( 'BackgroundImageCache', false, true );

    /*
     * IE version detection approach by James Padolsey, with modifications -- from
     * http://james.padolsey.com/javascript/detect-ie-in-js-using-conditional-comments/
     */
    PIE.ieVersion = function(){
        var v = 4,
            div = doc.createElement('div'),
            all = div.getElementsByTagName('i');

        while (
            div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
            all[0]
        ) {}

        return v;
    }();

    // Detect IE6
    if( PIE.ieVersion === 6 ) {
        // IE6 can't access properties with leading dash, but can without it.
        PIE.CSS_PREFIX = PIE.CSS_PREFIX.replace( /^-/, '' );
    }

    // Detect IE8
    PIE.ie8DocMode = PIE.ieVersion === 8 && doc.documentMode;
