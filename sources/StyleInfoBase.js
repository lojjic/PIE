(function() {

function cacheWhenLocked( fn ) {
    var uid = PIE.Util.getUID( fn );
    return function() {
        if( this._locked ) {
            var cache = this._lockedValues || ( this._lockedValues = {} );
            return ( uid in cache ) ? cache[ uid ] : ( cache[ uid ] = fn.call( this ) );
        } else {
            return fn.call( this );
        }
    }
}


PIE.StyleInfoBase = {

    _locked: 0,

    /**
     * Create a new StyleInfo class, with the standard constructor, and augmented by
     * the StyleInfoBase's members.
     * @param proto
     */
    newStyleInfo: function( proto ) {
        function StyleInfo( el ) {
            this.targetElement = el;
            this._lastCss = this.getCss();
        }
        PIE.merge( StyleInfo.prototype, PIE.StyleInfoBase, proto );
        StyleInfo._propsCache = {};
        return StyleInfo;
    },

    /**
     * Get an object representation of the target CSS style, caching it for each unique
     * CSS value string.
     * @return {Object}
     */
    getProps: function() {
        var css = this.getCss(),
            cache = this.constructor._propsCache;
        return css ? ( css in cache ? cache[ css ] : ( cache[ css ] = this.parseCss( css ) ) ) : null;
    },

    /**
     * Get the raw CSS value for the target style
     * @return {string}
     */
    getCss: cacheWhenLocked( function() {
        var el = this.targetElement,
            ctor = this.constructor,
            s = el.style,
            cs = el.currentStyle,
            cssProp = this.cssProperty,
            styleProp = this.styleProperty,
            prefixedCssProp = ctor._prefixedCssProp || ( ctor._prefixedCssProp = PIE.CSS_PREFIX + cssProp ),
            prefixedStyleProp = ctor._prefixedStyleProp || ( ctor._prefixedStyleProp = PIE.STYLE_PREFIX + styleProp.charAt(0).toUpperCase() + styleProp.substring(1) );
        return s[ prefixedStyleProp ] || cs.getAttribute( prefixedCssProp ) || s[ styleProp ] || cs.getAttribute( cssProp );
    } ),

    /**
     * Determine whether the target CSS style is active.
     * @return {boolean}
     */
    isActive: cacheWhenLocked( function() {
        return !!this.getProps();
    } ),

    /**
     * Determine whether the target CSS style has changed since the last time it was used.
     * @return {boolean}
     */
    changed: cacheWhenLocked( function() {
        var currentCss = this.getCss(),
            changed = currentCss !== this._lastCss;
        this._lastCss = currentCss;
        return changed;
    } ),

    cacheWhenLocked: cacheWhenLocked,

    lock: function() {
        ++this._locked;
    },

    unlock: function() {
        if( !--this._locked ) {
            delete this._lockedValues;
        }
    }
};

})();