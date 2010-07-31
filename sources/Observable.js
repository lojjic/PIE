/**
 * 
 */
PIE.Observable = function() {
    /**
     * List of registered observer functions
     */
    this.observers = [];

    /**
     * Hash of function ids to their position in the observers list, for fast lookup
     */
    this.indexes = {};
};
PIE.Observable.prototype = {

    observe: function( fn ) {
        var id = fn[ '_id' ] || ( fn[ '_id' ] = '' + new Date().getTime() + Math.random() ),
            indexes = this.indexes,
            observers = this.observers;
        if( !( id in indexes ) ) {
            indexes[ id ] = observers.length;
            observers.push( fn );
        }
    },

    unobserve: function( fn ) {
        var id = fn[ '_id' ],
            indexes = this.indexes;
        if( id && id in indexes ) {
            delete this.observers[ indexes[ id ] ];
            delete indexes[ id ];
        }
    },

    fire: function() {
        var o = this.observers,
            i = o.length;
        while( i-- ) {
            o[ i ] && o[ i ]();
        }
    }

};