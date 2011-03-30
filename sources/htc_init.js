var p = window['PIE'],
    el = element;

function init() {
    if( p && doc.media !== 'print' ) { // IE strangely attaches a second copy of the behavior to elements when printing
        p['attach']( el );
    }
}

function cleanup() {
    if( p ) {
        if( p['detach'] ) { // This is to cope with the following error in IE9: Object doesn't support property or method 'detach'
			p['detach']( el );
		}
		p = el = 0;
    }
}

if( el.readyState === 'complete' ) {
    init();
}
