var PIE = window['PIE'];

if( !PIE ) {
    PIE = window['PIE'] = {
        CSS_PREFIX: '-pie-',
        STYLE_PREFIX: 'Pie',
        CLASS_PREFIX: 'pie_'
    };

    // Detect IE6
    if( !window.XMLHttpRequest ) {
        PIE.isIE6 = true;

        // IE6 can't access properties with leading dash, but can without it.
        PIE.CSS_PREFIX = PIE.CSS_PREFIX.replace( /^-/, '' );
    }

    // Detect IE8
    PIE.ie8DocMode = element.document.documentMode;
    PIE.isIE8 = !!PIE.ie8DocMode;

    // Set up polling - this is a brute-force workaround for issues in IE8 caused by it not
    // always firing the onmove and onresize events when elements are moved or resized.
    if( PIE.ie8DocMode === 8 ) {
        PIE.ie8Poller = {
            fns: {},

            add: function( fn ) {
                var id = fn.id || ( fn.id = '' + new Date().getTime() + Math.random() );
                this.fns[ id ] = fn;
            },

            remove: function( fn ) {
                delete this.fns[ fn.id ];
            },

            fire: function() {
                var fns = this.fns, id;
                for( id in fns ) {
                    if( fns.hasOwnProperty( id ) ) {
                        fns[ id ]();
                    }
                }
            }
        };
        setInterval( function() { PIE.ie8Poller.fire() }, 250 )
    }


