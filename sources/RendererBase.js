PIE.RendererBase = {

    /**
     * Create a new Renderer class, with the standard constructor, and augmented by
     * the RendererBase's members.
     * @param proto
     */
    newRenderer: function( proto ) {
        function Renderer( el, boundsInfo, styleInfos, parent ) {
            this.targetElement = el;
            this.boundsInfo = boundsInfo;
            this.styleInfos = styleInfos;
            this.parent = parent;
        }
        PIE.Util.merge( Renderer.prototype, PIE.RendererBase, proto );
        return Renderer;
    },

    /**
     * Flag indicating the element has already been positioned at least once.
     * @type {boolean}
     */
    isPositioned: false,

    /**
     * Determine if the renderer needs to be updated
     * @return {boolean}
     */
    needsUpdate: function() {
        return false;
    },

    /**
     * Tell the renderer to update based on modified properties
     */
    updateProps: function() {
        this.destroy();
        if( this.isActive() ) {
            this.draw();
        }
    },

    /**
     * Tell the renderer to update based on modified element position
     */
    updatePos: function() {
        this.isPositioned = true;
    },

    /**
     * Tell the renderer to update based on modified element dimensions
     */
    updateSize: function() {
        if( this.isActive() ) {
            this.draw();
        } else {
            this.destroy();
        }
    },


    /**
     * Add a layer element, with the given z-order index, to the renderer's main box element. We can't use
     * z-index because that breaks when the root rendering box's z-index is 'auto' in IE8+ standards mode.
     * So instead we make sure they are inserted into the DOM in the correct order.
     * @param {number} index
     * @param {Element} el
     */
    addLayer: function( index, el ) {
        this.removeLayer( index );
        for( var layers = this._layers || ( this._layers = [] ), i = index + 1, len = layers.length, layer; i < len; i++ ) {
            layer = layers[i];
            if( layer ) {
                break;
            }
        }
        layers[index] = el;
        this.getBox().insertBefore( el, layer || null );
    },

    /**
     * Retrieve a layer element by its index, or null if not present
     * @param {number} index
     * @return {Element}
     */
    getLayer: function( index ) {
        var layers = this._layers;
        return layers && layers[index] || null;
    },

    /**
     * Remove a layer element by its index
     * @param {number} index
     */
    removeLayer: function( index ) {
        var layer = this.getLayer( index ),
            box = this._box;
        if( layer && box ) {
            box.removeChild( layer );
            this._layers[index] = null;
        }
    },


    /**
     * Get a VML shape by name, creating it if necessary.
     * @param {string} name A name identifying the element
     * @param {string=} subElName If specified a subelement of the shape will be created with this tag name
     * @param {Element} parent The parent element for the shape; will be ignored if 'group' is specified
     * @param {number=} group If specified, an ordinal group for the shape. 1 or greater. Groups are rendered
     *                  using container elements in the correct order, to get correct z stacking without z-index.
     */
    getShape: function( name, subElName, parent, group ) {
        var shapes = this._shapes || ( this._shapes = {} ),
            shape = shapes[ name ],
            s;

        if( !shape ) {
            shape = shapes[ name ] = PIE.Util.createVmlElement( 'shape' );
            if( subElName ) {
                shape.appendChild( shape[ subElName ] = PIE.Util.createVmlElement( subElName ) );
            }

            if( group ) {
                parent = this.getLayer( group );
                if( !parent ) {
                    this.addLayer( group, doc.createElement( 'group' + group ) );
                    parent = this.getLayer( group );
                }
            }

            parent.appendChild( shape );

            s = shape.style;
            s.position = 'absolute';
            s.left = s.top = 0;
            s['behavior'] = 'url(#default#VML)';
        }
        return shape;
    },

    /**
     * Delete a named shape which was created by getShape(). Returns true if a shape with the
     * given name was found and deleted, or false if there was no shape of that name.
     * @param {string} name
     * @return {boolean}
     */
    deleteShape: function( name ) {
        var shapes = this._shapes,
            shape = shapes && shapes[ name ];
        if( shape ) {
            shape.parentNode.removeChild( shape );
            delete shapes[ name ];
        }
        return !!shape;
    },


    /**
     * For a given set of border radius length/percentage values, convert them to concrete pixel
     * values based on the current size of the target element.
     * @param {Object} radii
     * @return {Object}
     */
    getRadiiPixels: function( radii ) {
        var el = this.targetElement,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            tlX, tlY, trX, trY, brX, brY, blX, blY, f;

        tlX = radii.x['tl'].pixels( el, w );
        tlY = radii.y['tl'].pixels( el, h );
        trX = radii.x['tr'].pixels( el, w );
        trY = radii.y['tr'].pixels( el, h );
        brX = radii.x['br'].pixels( el, w );
        brY = radii.y['br'].pixels( el, h );
        blX = radii.x['bl'].pixels( el, w );
        blY = radii.y['bl'].pixels( el, h );

        // If any corner ellipses overlap, reduce them all by the appropriate factor. This formula
        // is taken straight from the CSS3 Backgrounds and Borders spec.
        f = Math.min(
            w / ( tlX + trX ),
            h / ( trY + brY ),
            w / ( blX + brX ),
            h / ( tlY + blY )
        );
        if( f < 1 ) {
            tlX *= f;
            tlY *= f;
            trX *= f;
            trY *= f;
            brX *= f;
            brY *= f;
            blX *= f;
            blY *= f;
        }

        return {
            x: {
                'tl': tlX,
                'tr': trX,
                'br': brX,
                'bl': blX
            },
            y: {
                'tl': tlY,
                'tr': trY,
                'br': brY,
                'bl': blY
            }
        }
    },

    /**
     * Return the VML path string for the element's background box, with corners rounded.
     * @param {Object.<{t:number, r:number, b:number, l:number}>} shrink - if present, specifies number of
     *        pixels to shrink the box path inward from the element's four sides.
     * @param {number=} mult If specified, all coordinates will be multiplied by this number
     * @param {Object=} radii If specified, this will be used for the corner radii instead of the properties
     *        from this renderer's borderRadiusInfo object.
     * @return {string} the VML path
     */
    getBoxPath: function( shrink, mult, radii ) {
        mult = mult || 1;

        var r, str, box,
        	m = this.styleInfos.transformInfo.getProps().m,
            bounds = m.getTransformedBounds(this.boundsInfo.getBounds()),
            w = bounds.w * mult,
            h = bounds.h * mult,
            radInfo = this.styleInfos.borderRadiusInfo,
            floor = Math.floor, ceil = Math.ceil,
            shrinkT = shrink ? shrink.t * mult : 0,
            shrinkR = shrink ? shrink.r * mult : 0,
            shrinkB = shrink ? shrink.b * mult : 0,
            shrinkL = shrink ? shrink.l * mult : 0;
        	
        if( radii || radInfo.isActive() ) {
        	var start, end, corner1, corner2, min = Math.min, max = Math.max,abs=Math.abs,s,e,rad,c,round = Math.round;
        	r = this.getRadiiPixels( radii || radInfo.getProps() );
        	
        	function getArcBox(ra, ce, st, en) {
        		var b = {};
        		
        		ce = m.applyToPoint(ce.x, ce.y);
        		
        		return {l: ceil(ce.x - ra.x), t: ceil(ce.y - ra.y),
        				r: ceil(ce.x + ra.x), b: ceil(ce.y + ra.y),
        				start: m.applyToPoint(st.x, st.y), end: m.applyToPoint(en.x, en.y)};
        	}
        	s = {x: -shrinkT * mult, y: (r.y['tl'] - shrinkL) * mult};
        	e = {x: (r.x['tl'] - shrinkT) * mult, y: -shrinkL * mult};
        	rad = {x: e.x - s.x, y: s.y - e.y};
        	c = {x: e.x, y: s.y};
        	box = getArcBox(rad,c,s,e);
        	str = 'm' + floor(box.start.x) + ',' + floor(box.start.y) + 
        		'wa' + box.l + ',' + box.t + ',' + box.r + ',' + box.b + ',' +
        		floor(box.start.x) + ',' + floor(box.start.y) + ',' + ceil(box.end.x) + ',' + ceil(box.end.y);
        	
        	s = {x: bounds.w - (shrinkT + r.x['tr']) * mult, y: -shrinkR * mult};
        	e = {x: bounds.w - shrinkT * mult, y: (r.y['tr'] - shrinkR) * mult};
        	rad = {x: e.x - s.x, y: e.y - s.y};
        	c = {x: s.x, y: e.y};
        	box = getArcBox(rad,c,s,e);
        	str += 'l' + floor(box.start.x) + ',' + floor(box.start.y) + 
        		'wa' + box.l + ',' + box.t + ',' + box.r + ',' + box.b + ',' +
        		floor(box.start.x) + ',' + floor(box.start.y) + ',' + floor(box.end.x) + ',' + floor(box.end.y);

        	s = {x: bounds.w - shrinkB * mult, y: bounds.h - (shrinkR + r.y['br']) * mult};
        	e = {x: bounds.w - (shrinkB + r.x['br']) * mult, y: bounds.h - shrinkR * mult};
        	rad = {x: s.x - e.x, y: e.y - s.y};
        	c = {x: e.x, y: s.y};
        	box = getArcBox(rad,c,s,e);
        	str += 'l' + floor(box.start.x) + ',' + floor(box.start.y) + 
        		'wa' + box.l + ',' + box.t + ',' + box.r + ',' + box.b + ',' +
        		floor(box.start.x) + ',' + floor(box.start.y) + ',' + floor(box.end.x) + ',' + floor(box.end.y);

        	s = {x: (r.x['bl'] - shrinkB) * mult, y: bounds.h - shrinkL * mult};
        	e = {x: -shrinkB * mult, y: bounds.h - (shrinkL + r.y['bl']) * mult};
        	rad = {x: s.x - e.x, y: s.y - e.y};
        	c = {x: s.x, y: e.y};
        	box = getArcBox(rad,c,s,e);
        	str += 'l' + floor(box.start.x) + ',' + floor(box.start.y) + 
        		'wa' + box.l + ',' + box.t + ',' + box.r + ',' + box.b + ',' +
        		floor(box.start.x) + ',' + floor(box.start.y) + ',' + floor(box.end.x) + ',' + floor(box.end.y) + ' x e';
        } else {
            tl = m.applyToPoint(0 - shrinkT * mult, 0 - shrinkL * mult);
            tr = m.applyToPoint(bounds.w - shrinkT * mult, 0 - shrinkR * mult);
            br = m.applyToPoint(bounds.w - shrinkB * mult, bounds.h - shrinkR * mult);
            bl = m.applyToPoint(0 - shrinkB * mult, bounds.h - shrinkL * mult);
            
        	// simplified path for non-rounded box
            str = 'm' + floor( tl.x ) + ',' + floor( tl.y ) +
                  'l' + ceil( tr.x ) + ',' + floor( tr.y ) +
                  'l' + ceil( br.x ) + ',' + ceil( br.y ) +
                  'l' + floor( bl.x ) + ',' + ceil( bl.y ) +
                  'xe';
        }

        return str;
    },


    /**
     * Get the container element for the shapes, creating it if necessary.
     */
    getBox: function() {
        var box = this.parent.getLayer( this.boxZIndex ), s;

        if( !box ) {
            box = doc.createElement( this.boxName );
            s = box.style;
            s.position = 'absolute';
            s.top = s.left = 0;
            this.parent.addLayer( this.boxZIndex, box );
        }

        return box;
    },


    /**
     * Destroy the rendered objects. This is a base implementation which handles common renderer
     * structures, but individual renderers may override as necessary.
     */
    destroy: function() {
        this.parent.removeLayer( this.boxZIndex );
        delete this._shapes;
        delete this._layers;
    }
};
