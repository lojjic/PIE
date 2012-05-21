var el = element,
    doc = el.document,
    docMode = doc.documentMode || 0;

// NOTE: do NOT try maintaining a long-lived variable referencing window.PIE here at the top
// level because for some reason it isn't reliably set when it should be on subsequent attachments
// of the behavior, resulting in double loads of the JS file.

if ( !window[ 'PIE' ] && docMode < 10 ) {
    (function() {
        var queue = {},
            baseUrls = $DefaultBaseUrls$,
            protocol = doc.location.protocol,
            baseUrl, tester, isIE6, i = 0;

        // Create stub PIE object
        window[ 'PIE' ] = {
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

        // Look for a custom -pie-load-path in the url or the css, or fall back to the CDN url
        baseUrl = doc.location.href.match(/pie-load-path=([^&]+)/);
        if( baseUrl ) {
            baseUrl = decodeURIComponent(baseUrl[1]);
        }
        if( !baseUrl ) {
            baseUrl = doc.documentElement.currentStyle.getAttribute( ( isIE6 ? '' : '-' ) + 'pie-load-path' );
        }
        if( baseUrl ) {
            baseUrl = baseUrl.replace(/^("|')|("|')$/g, '');
            baseUrls = [ baseUrl ];
        }

        // Start loading JS file
        function tryLoading( baseUrl ) {
            var script = doc.createElement( 'script' );
            script.async = true;
            script.onreadystatechange = function() {
                var PIE = window[ 'PIE' ],
                    rs = script.readyState,
                    id;
                if ( queue && ( rs === 'complete' || rs === 'loaded' ) ) {
                    if ( 'version' in PIE ) {
                        for( id in queue ) {
                            if ( queue.hasOwnProperty( id ) ) {
                                PIE[ 'attach' ]( queue[ id ] );
                            }
                        }
                        queue = 0;
                    }
                    else if( baseUrls[ ++i ] ) {
                        tryLoading( baseUrls[ i ] );
                    }
                }
            };

            if ( protocol === 'https:' ) {
                baseUrl = baseUrl.replace( /^http:/, protocol );
            }
            script.src = baseUrl + '/PIE_IE' + ( docMode < 9 ? '678' : '9' ) + '$JSVariant$.js';
            ( doc.getElementsByTagName( 'head' )[0] || doc.body ).appendChild( script );
        }

        tryLoading( baseUrls[ i ] );

    })();
}

function init() {
    if ( doc.media !== 'print' ) { // IE strangely attaches a second copy of the behavior to elements when printing
        var PIE = window[ 'PIE' ];
        if( PIE ) {
            PIE[ 'attach' ]( el );
        }
    }
}

function cleanup() {
    if ( doc.media !== 'print' ) {
        var PIE = window[ 'PIE' ];
        if ( PIE ) {
            PIE[ 'detach' ]( el );
        }
    }
    el = 0;
}

if( el.readyState === 'complete' ) {
    init();
}
