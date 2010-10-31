/**
 * Listen for printing events, destroy all active PIE instances when printing, and
 * restore them afterward.
 */
(function() {

    var elements,
        win = window;

    function beforePrint() {
        elements = PIE.Element.destroyAll();
    }

    function afterPrint() {
        if( elements ) {
            for( var i = 0, len = elements.length; i < len; i++ ) {
                PIE[ 'attach' ]( elements[i] );
            }
            elements = 0;
        }
    }

    win.attachEvent( 'onbeforeprint', beforePrint );
    win.attachEvent( 'onafterprint', afterPrint );

    PIE.OnBeforeUnload.observe( function() {
        win.detachEvent( 'onbeforeprint', beforePrint );
        win.detachEvent( 'onafterprint', afterPrint );
    } );

})();