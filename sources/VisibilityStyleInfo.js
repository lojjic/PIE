/**
 * Retrieves the state of the element's visibility and display
 * @constructor
 * @param {Element} el the target element
 */
PIE.VisibilityStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

    getCss: function() {
        var cs = this.element.currentStyle;
        return cs.visibility + '|' + cs.display;
    },

    parseCss: function() {
        var el = this.element,
            rs = el.runtimeStyle,
            cs = el.currentStyle,
            rsVis = rs.visibility,
            csVis;

        rs.visibility = '';
        csVis = cs.visibility;
        rs.visibility = rsVis;

        return {
            visible: csVis !== 'hidden',
            displayed: cs.display !== 'none'
        }
    },

    /**
     * Always return false for isActive, since this property alone will not trigger
     * a renderer to do anything.
     */
    isActive: function() {
        return false;
    }

} );
