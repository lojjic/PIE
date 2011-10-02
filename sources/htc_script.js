var el = element,
    doc = el.document,
    docMode = doc.documentMode || 0,
    PIE = window[ 'PIE' ];

if (!PIE && docMode < 10) {
    (function() {
        var queue = {},
            defaultBaseUrl = '$DefaultBaseUrl$',
            protocol = doc.location.protocol,
            baseUrl, script, tester, isIE6;

        // Create stub PIE object
        PIE = window[ 'PIE' ] = {
            'attach': function( el ) {
                queue[ el[ 'uniqueID' ] ] = el;
            },

            'detach': function( el ) {
                delete queue[ el[ 'uniqueID' ] ];
            }
        };

        // Are we in IE6?
        tester = doc.createElement('div');
        tester.innerHTML = '<!--[if IE 6]><i></i><![endif]-->';
        isIE6 = tester.getElementsByTagName('i')[0];

        // Look for a custom -pie-base-url and load it, or fall back to the CDN url
        baseUrl = doc.documentElement.currentStyle.getAttribute( ( isIE6 ? '' : '-' ) + 'pie-base-url' );
        if( baseUrl ) {
            baseUrl = baseUrl.replace(/^"|"$/g, '');
        } else {
            baseUrl = ( protocol === 'https:' ? protocol + defaultBaseUrl.replace( /^[^\/]*]/, '' ) : defaultBaseUrl );
        }
        baseUrl += '/PIE_IE' + ( docMode < 9 ? '678' : '9' ) + '$JSVariant$.js';

        // Start loading JS file
        script = doc.createElement( 'script' );
        script.async = true;
        script.onreadystatechange = function() {
            var rs = script.readyState, id;
            if ( queue && ( rs === 'complete' || rs === 'loaded' ) ) {
                for( id in queue ) {
                    if ( queue.hasOwnProperty( id ) ) {
                        PIE[ 'attach' ]( queue[ id ] );
                    }
                }
                queue = 0;
            }
        };
        script.src = baseUrl;
        ( doc.getElementsByTagName( 'head' )[0] || doc.body ).appendChild( script );
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
