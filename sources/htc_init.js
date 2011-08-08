var el = element;

function init() {
    var PIE = window[ 'PIE' ];
    if( PIE && doc.media !== 'print' ) { // IE strangely attaches a second copy of the behavior to elements when printing
        PIE['attach']( el );
    }
}

function cleanup() {
    var PIE = window[ 'PIE' ];
    if (PIE) {
        PIE['detach']( el );
        PIE = el = 0;
    }
}

if( el.readyState === 'complete' ) {
    init();
}
