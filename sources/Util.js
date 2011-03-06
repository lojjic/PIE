/**
 * Utility functions
 */
(function() {
    var vmlCreatorDoc,
        idNum = 0,
        imageSizes = {};


    PIE.Util = {

        /**
         * To create a VML element, it must be created by a Document which has the VML
         * namespace set. Unfortunately, if you try to add the namespace programatically
         * into the main document, you will get an "Unspecified error" when trying to
         * access document.namespaces before the document is finished loading. To get
         * around this, we create a DocumentFragment, which in IE land is apparently a
         * full-fledged Document. It allows adding namespaces immediately, so we add the
         * namespace there and then have it create the VML element.
         * @param {string} tag The tag name for the VML element
         * @return {Element} The new VML element
         */
        createVmlElement: function( tag ) {
            var vmlPrefix = 'css3vml';
            if( !vmlCreatorDoc ) {
                vmlCreatorDoc = doc.createDocumentFragment();
                vmlCreatorDoc.namespaces.add( vmlPrefix, 'urn:schemas-microsoft-com:vml' );
            }
            return vmlCreatorDoc.createElement( vmlPrefix + ':' + tag );
        },


        /**
         * Generate and return a unique ID for a given object. The generated ID is stored
         * as a property of the object for future reuse.
         * @param {Object} obj
         */
        getUID: function( obj ) {
            return obj && obj[ '_pieId' ] || ( obj[ '_pieId' ] = ++idNum );
        },


        /**
         * Simple utility for merging objects
         * @param {Object} obj1 The main object into which all others will be merged
         * @param {...Object} var_args Other objects which will be merged into the first, in order
         */
        merge: function( obj1 ) {
            var i, len, p, objN, args = arguments;
            for( i = 1, len = args.length; i < len; i++ ) {
                objN = args[i];
                for( p in objN ) {
                    if( objN.hasOwnProperty( p ) ) {
                        obj1[ p ] = objN[ p ];
                    }
                }
            }
            return obj1;
        },


        /**
         * Execute a callback function, passing it the dimensions of a given image once
         * they are known.
         * @param {string} src The source URL of the image
         * @param {function({w:number, h:number})} func The callback function to be called once the image dimensions are known
         * @param {Object} ctx A context object which will be used as the 'this' value within the executed callback function
         */
        withImageSize: function( src, func, ctx ) {
            var size = imageSizes[ src ], img, queue;
            if( size ) {
                // If we have a queue, add to it
                if( Object.prototype.toString.call( size ) === '[object Array]' ) {
                    size.push( [ func, ctx ] );
                }
                // Already have the size cached, call func right away
                else {
                    func.call( ctx, size );
                }
            } else {
                queue = imageSizes[ src ] = [ [ func, ctx ] ]; //create queue
                img = new Image();
                img.onload = function() {
                    size = imageSizes[ src ] = { w: img.width, h: img.height };
                    for( var i = 0, len = queue.length; i < len; i++ ) {
                        queue[ i ][ 0 ].call( queue[ i ][ 1 ], size );
                    }
                    img.onload = null;
                };
                img.src = src;
            }
        }
    };
})();