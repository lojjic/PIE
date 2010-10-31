var p = window.PIE;

function init() {
    if( doc.media !== 'print' ) { // IE strangely attaches a second copy of the behavior to elements when printing
        p.attach( element );
    }
}

function cleanup() {
    p.detach( element );
}

if( element.readyState === 'complete' ) {
    init();
}
