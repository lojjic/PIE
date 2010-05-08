<?php
/*
This file is a wrapper, for use in PHP environments, which serves PIE.htc using the
correct content-type, so that IE will recognize it as a behavior.  Simply specify the
behavior property to fetch this .php file instead of the .htc directly:

.myElement {
    [ ...css3 properties... ]
    behavior: url(PIE.php);
}

This is only necessary when the web server is not already configured to serve .htc files
with the text/x-component content-type.
*/

header( 'Content-type: text/x-component' );
include( 'PIE.htc' );
?>