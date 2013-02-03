var el = element,
    doc = el.document,
    docMode = doc.documentMode || 0;

// NOTE: do NOT try maintaining a long-lived variable referencing window.PIE here at the top
// level because for some reason it isn't reliably set when it should be on subsequent attachments
// of the behavior, resulting in double loads of the JS file.

if ( !window[ 'PIE' ] && docMode < 10 ) {
    (function() {
        var queue = {},
            styleSheetRE, checkStyleSheets,
            baseUrl, tester, isIE6, script;

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

        // Look for a custom pie-load-path parameter in the page's url...
        baseUrl = doc.location.href.match(/pie-load-path=([^&]+)/);
        if( baseUrl ) {
            baseUrl = decodeURIComponent(baseUrl[1]);
        }
        // Otherwise look for a custom -pie-load-path property in the CSS for the html element...
        if( !baseUrl ) {
            baseUrl = doc.documentElement.currentStyle.getAttribute( ( isIE6 ? '' : '-' ) + 'pie-load-path' );
        }
        // Otherwise look through the stylesheets for the location of the behavior file...
        if( !baseUrl ) {
            styleSheetRE = /BEHAVIOR: url\(([^\)]*PIE[^\)]*)/i;
            checkStyleSheets = function( styleSheets ) {
                var i = styleSheets.length,
                    url, match;
                while( i-- ) {
                    match = styleSheets[ i ].cssText.match( styleSheetRE );
                    url = match ?
                        ( match[ 1 ].replace( /[^\/]*$/, '' ) || '.' ) :
                        checkStyleSheets( styleSheets[ i ].imports );
                    if( url ) {
                        break;
                    }
                }
                return url;
            };
            baseUrl = checkStyleSheets( doc.styleSheets );
        }

        // If we found the base URL, try to load the appropriate JS file from it
        if( baseUrl ) {
            baseUrl = baseUrl.replace( /^['"]|\/?['"]?$/g, '' );
            script = doc.createElement( 'script' );
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
                }
            };
            script.src = baseUrl + '/PIE_IE' + ( docMode < 9 ? '678' : '9' ) + '$JSVariant$.js';
            ( doc.getElementsByTagName( 'head' )[0] || doc.body ).appendChild( script );
        }
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
