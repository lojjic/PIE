/**
 * Handles calculating, caching, and detecting changes to size and position of the element.
 * @constructor
 * @param {Element} el the target element
 */
PIE.BoundsInfo = function( el ) {
    this.element = el;
};
PIE.BoundsInfo.prototype = {

    _lastBounds: {},

    positionChanged: function() {
        var last = this._lastBounds,
            bounds = this.getBounds();
        return !last || last.x !== bounds.x || last.y !== bounds.y;
    },

    sizeChanged: function() {
        var last = this._lastBounds,
            bounds = this.getBounds();
        return !last || last.w !== bounds.w || last.h !== bounds.h;
    },

    getLiveBounds: function() {
        var rect = this.element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            w: rect.right - rect.left,
            h: rect.bottom - rect.top
        };
    },

    getBounds: function() {
        return this._lockedBounds || this.getLiveBounds();
    },

    lock: function() {
        this._lockedBounds = this.getLiveBounds();
    },

    unlock: function() {
        this._lastBounds = this._lockedBounds;
        this._lockedBounds = null;
    }

};
