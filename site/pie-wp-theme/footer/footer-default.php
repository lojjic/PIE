<?php

// This file is part of the Carrington JAM Theme for WordPress
// http://carringtontheme.com
//
// Copyright (c) 2008-2010 Crowd Favorite, Ltd. All rights reserved.
// http://crowdfavorite.com
//
// Released under the GPL license
// http://www.opensource.org/licenses/gpl-license.php
//
// **********************************************************************
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
// **********************************************************************

if (__FILE__ == $_SERVER['SCRIPT_FILENAME']) { die(); }
if (CFCT_DEBUG) { cfct_banner(__FILE__); }
?>


        <footer id="pageFooter">
            <nav id="footNav">
                <?php wp_nav_menu( array('menu' => 'Footer Menu', 'container' => null ) ); ?>
            </nav>

            <p id="copyright">&copy;2011 <a href="http://sencha.com">Sencha Inc.</a>. Part of Sencha 
Labs. Created and maintained by 
Jason Johnston.</p>
        </footer>
    </div>
</div>

<?php
wp_footer();


global $post;
if ($post) {
$page_js_files = get_post_meta($post->ID, 'page_js_file', false);
foreach( $page_js_files as $file ) {
    ?>
    <script type='text/javascript' src='<?php wp_js($file); ?>'></script>
    <?php
}
$page_js = get_post_meta($post->ID, 'page_js', true);
if( $page_js ) {
    echo "<script type='text/javascript'>$page_js</script>";
}
}
?>

<!-- Proudly powered by <a href="http://wordpress.org/">WordPress</a> and <a href="http://carringtontheme.com">Carrington JAM</a> -->
</body>
</html>
