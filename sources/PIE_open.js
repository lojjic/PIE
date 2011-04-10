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
    try {
        doc.execCommand( 'BackgroundImageCache', false, true );
    } catch(e) {}

    (function() {
        /*
         * IE version detection approach by James Padolsey, with modifications -- from
         * http://james.padolsey.com/javascript/detect-ie-in-js-using-conditional-comments/
         */
        var ieVersion = 4,
            div = doc.createElement('div'),
            all = div.getElementsByTagName('i'),
            shape;
        while (
            div.innerHTML = '<!--[if gt IE ' + (++ieVersion) + ']><i></i><![endif]-->',
            all[0]
        ) {}
        PIE.ieVersion = ieVersion;

        // Detect IE6
        if( ieVersion === 6 ) {
            // IE6 can't access properties with leading dash, but can without it.
            PIE.CSS_PREFIX = PIE.CSS_PREFIX.replace( /^-/, '' );
        }

        PIE.ieDocMode = doc.documentMode || PIE.ieVersion;

        // Detect VML support (a small number of IE installs don't have a working VML engine)
        div.innerHTML = '<v:shape adj="1"/>';
        shape = div.firstChild;
        shape.style['behavior'] = 'url(#default#VML)';
        PIE.supportsVML = (typeof shape['adj'] === "object");
    }());
