var el = element;

function init() {
    if ( doc.media !== 'print' ) { // IE strangely attaches a second copy of the behavior to elements when printing
        var PIE = window[ 'PIE' ];
        if( PIE ) {
            PIE['attach']( el );
        }
    }
}

function cleanup() {
    if ( doc.media !== 'print' ) {
        var PIE = window[ 'PIE' ];
        if (PIE) {
            PIE['detach']( el );
            el = 0;
        }
    }
}

if( el.readyState === 'complete' ) {
    init();
}
