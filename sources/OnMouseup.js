/**
 * Create a single observable listener for document mouseup events.
 */
PIE.OnMouseup = new PIE.Observable();

PIE.OnBeforeUnload.attachManagedEvent( doc, 'onmouseup', function() { PIE.OnMouseup.fire(); } );
