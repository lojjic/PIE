/**
 * Abstraction for a VML shape element. Allows assembling a VML shape's properties in
 * a non-DOM structure, which can then both generate itself as a single HTML string, and/or
 * update itself incrementally if its DOM element already exists.
 */
PIE.VmlShape = (function() {

    var nsPrefix = 'pievml',
        attrsPrefix = '_attrs_',
        objectSetters = {
            'colors': function( fill, name, value ) {
                if( fill[ name ] ) { //sometimes the colors object isn't initialized so we have to assign it directly (?)
                    fill[ name ].value = value;
                } else {
                    fill[ name ] = value;
                }
            },

            'size': function( fill, name, value ) {
                if ( !value ) {
                    delete fill[ name ];
                } else {
                    fill[ name ][ 'x' ] = 1; //Can be any value, just has to be set to "prime" it so the next line works. Weird!
                    fill[ name ] = value;
                }
            },

            'o:opacity2': function( fill, name, value ) {
                // The VML DOM does not allow dynamic setting of o:opacity2, so we must regenerate
                // the entire shape from markup instead.
                var me = this;
                if( value !== me.lastOpacity2 ) {
                    me.getShape().insertAdjacentHTML( 'afterEnd', me.getMarkup() );
                    me.destroy();
                    me.lastOpacity2 = value;
                }
            }
        };

    function createSetter( objName ) {
        return function() {
            var args = arguments,
                i, len = args.length,
                obj, name, setter;

            // Store the property locally
            obj = this[ attrsPrefix + objName ] || ( this[ attrsPrefix + objName ] = {} );
            for( i = 0; i < len; i += 2 ) {
                obj[ args[ i ] ] = args[ i + 1 ];
            }

            // If there is a rendered VML shape already, set the property directly via the VML DOM
            obj = this.getShape();
            if( obj ) {
                if( objName ) {
                    obj = obj[ objName ];
                }
                for( i = 0; i < len; i += 2 ) {
                    name = args[ i ];
                    setter = objectSetters[ name ]; //if there is a custom setter for this property, use it
                    if ( setter ) {
                        setter.call( this, obj, name, args[ i + 1 ]);
                    } else {
                        obj[ name ] = args[ i + 1 ];
                    }
                }
            }
        }
    }


    /**
     * The VML namespace has to be registered with the document, or the shapes will be invisible
     * on initial render sometimes. This results in the infamous "Unspecified error" if called
     * at certain times, so catch that and retry after a delay.
     */
    (function addVmlNamespace() {
        try {
            doc.namespaces.add(nsPrefix, 'urn:schemas-microsoft-com:vml', '#default#VML');
        }
        catch (e) {
            setTimeout(addVmlNamespace, 1);
        }
    })();



    function VmlShape( idSeed, ordinalGroup ) {
        this.elId = '_pie_' + ( idSeed || 'shape' ) + PIE.Util.getUID(this);
        this.ordinalGroup = ordinalGroup || 0;
    }
    VmlShape.prototype = {
        behaviorStyle: 'behavior:url(#default#VML);',
        defaultStyles: 'position:absolute;top:0px;left:0px;',
        defaultAttrs: 'coordorigin="1,1" stroked="false" ',
        tagName: 'shape',
        mightBeRendered: 0,

        getShape: function() {
            return this.mightBeRendered ?
                ( this._shape || ( this._shape = doc.getElementById( this.elId ) ) ) : null;
        },

        setAttrs: createSetter( '' ),
        setStyles: createSetter( 'style' ),
        setFillAttrs: createSetter( 'fill' ),

        setSize: function( w, h ) {
            this.setStyles(
                'width', w + 'px',
                'height', h + 'px'
            );
            this.setAttrs(
                'coordsize', w * 2 + ',' + h * 2
            );
        },

        getStyleCssText: function() {
            var styles = this[ attrsPrefix + 'style' ] || {},
                cssText = [], p;

            for( p in styles ) {
                if( styles.hasOwnProperty( p ) ) {
                    cssText.push( p + ':' + styles[p] );
                }
            }

            return this.behaviorStyle + this.defaultStyles + cssText.join( ';' );
        },

        getMarkup: function() {
            var m,
                me = this,
                tag = me.tagName,
                tagStart = '<' + nsPrefix + ':',
                subElEnd = ' style="' + me.behaviorStyle + '" />';

            me.mightBeRendered = 1;

            function pushAttrs( keyVals ) {
                if( keyVals ) {
                    for( var key in keyVals ) {
                        if( keyVals.hasOwnProperty( key ) ) {
                            m.push( ' ' + key + '="' + keyVals[key] + '"' );
                        }
                    }
                }
            }

            function pushElement( name ) {
                var attrs = me[ attrsPrefix + name ];
                if( attrs ) {
                    m.push( tagStart + name );
                    pushAttrs( attrs );
                    m.push( subElEnd );
                }
            }

            m = [ tagStart, tag, ' id="', me.elId, '" style="', me.getStyleCssText(), '" ', me.defaultAttrs ];
            pushAttrs( me[ attrsPrefix ] );
            m.push( '>' );

            pushElement( 'fill' );

            m.push( '</' + nsPrefix + ':' + tag + '>' );

            return m.join( '' );
        },

        destroy: function() {
            var shape = this.getShape(),
                par = shape && shape.parentNode;
            if( par ) {
                par.removeChild(shape);
                delete this._shape;
            }
        }
    };

    return VmlShape;
})();