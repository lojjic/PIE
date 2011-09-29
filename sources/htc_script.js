var el = element,
    doc = el.document,
    PIE = window[ 'PIE' ];

if (!PIE) {
    (function() {
        var queue = {},
            baseUrl, script, tester, isIE6;

        // Create stub PIE object
        PIE = window[ 'PIE' ] = {
            'onLoad': function() {
                for( var id in queue ) {
                    if ( queue.hasOwnProperty( id ) ) {
                        PIE[ 'attach' ]( queue[ id ] );
                    }
                }
                queue = 0;
                delete PIE[ 'onLoad' ];
            },

            'attach': function( el ) {
                queue[ el[ 'uniqueID' ] ] = el;
            },

            'detach': function( el ) {
                delete queue[ el[ 'uniqueID' ] ];
            }
        };

        tester = doc.createElement('div');
        tester.innerHTML = '<!--[if IE 6]><i></i><![endif]-->';
        isIE6 = tester.getElementsByTagName('i')[0];

        // Start loading JS file
        baseUrl = doc.documentElement.currentStyle.getAttribute( ( isIE6 ? '' : '-' ) + 'pie-base-url' );
        baseUrl = baseUrl ? baseUrl.replace(/^"|"$/g, '') : '';
        script = doc.createElement('script');
        script.async = true;
        script.src = baseUrl + '/PIE_IE' + ( doc.documentMode === 9 ? '9' : '678' ) + '.js';
        doc.getElementsByTagName( 'head' )[0].appendChild( script );
    })();
}

function init() {
    var PIE = window[ 'PIE' ];
    if( PIE && doc.media !== 'print' ) { // IE strangely attaches a second copy of the behavior to elements when printing
        PIE[ 'attach' ]( el );
    }
}

function cleanup() {
    var PIE = window[ 'PIE' ];
    if ( PIE && doc.media !== 'print' ) {
        PIE[ 'detach' ]( el );
    }
    el = 0;
}

if( el.readyState === 'complete' ) {
    init();
}
