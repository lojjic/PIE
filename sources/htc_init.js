var p = window['PIE'],
    el = element;

function init() {
    if( p && doc.media !== 'print' ) { // IE strangely attaches a second copy of the behavior to elements when printing
        p['attach']( el );
    }
}

function cleanup() {
    if (p) {
        p['detach']( el );
        p = el = 0;
    }
}

if( el.readyState === 'complete' ) {
    init();
}
