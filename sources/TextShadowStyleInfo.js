/**
 * Handles parsing, caching, and detecting changes to text-shadow CSS. The text-shadow
 * format matches box-shadow exactly except that it does not allow the 'inset' keyword,
 * so it uses the parsing logic from BoxShadowStyleInfo but removes any inset info.
 * @constructor
 * @param {Element} el the target element
 */
PIE.TextShadowStyleInfo = PIE.StyleInfoBase.newStyleInfo( {
    cssProperty: 'text-shadow',
    styleProperty: 'textShadow',
    isTextShadow: true,

    parseCss: (function( superMethod ) {
        return function( css ) {
            var info = superMethod.call( this, css );
            return (info && info.outset) || null;
        }
    })( PIE.BoxShadowStyleInfo.prototype.parseCss )
} );
