/**
 * Retrieves the state of the element's visibility and display
 * @constructor
 * @param {Element} el the target element
 */
PIE.VisibilityStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

    getCss: PIE.StyleInfoBase.cacheWhenLocked( function() {
        var el = this.targetElement,
            rs = el.runtimeStyle,
            cs = el.currentStyle,
            rsVis = rs.visibility,
            ret;
        rs.visibility = '';
        ret = cs.visibility + '|' + cs.display;
        rs.visibility = rsVis;
        return ret;
    } ),

    parseCss: function() {
        var info = this.getCss().split('|');
        return {
            visible: info[0] !== 'hidden',
            displayed: info[1] !== 'none'
        };
    },

    /**
     * Always return false for isActive, since this property alone will not trigger
     * a renderer to do anything.
     */
    isActive: function() {
        return false;
    }

} );
