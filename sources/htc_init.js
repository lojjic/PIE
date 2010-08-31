var p = window.PIE;

function init() {
    p.attach( element );
}

function cleanup() {
    p.detach( element );
}

if( element.readyState === 'complete' ) {
    init();
}
