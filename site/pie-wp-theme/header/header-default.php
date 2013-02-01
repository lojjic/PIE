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
<!DOCTYPE html>

<html <?php language_attributes() ?>>
<head profile="http://gmpg.org/xfn/11">
	<meta http-equiv="content-type" content="<?php bloginfo('html_type') ?>; charset=<?php bloginfo('charset') ?>" />

	<title><?php wp_title( '-', true, 'right' ); echo wp_specialchars( get_bloginfo('name'), 1 ); ?></title>

    <!--[if lt IE 9]>
    <script>
        document.execCommand("BackgroundImageCache", false, true);
    </script>
    <![endif]-->

	<link rel="alternate" type="application/rss+xml" href="<?php bloginfo('rss2_url') ?>" title="<?php printf( __( '%s latest posts', 'carrington-jam' ), wp_specialchars( get_bloginfo('name'), 1 ) ) ?>" />
	<link rel="alternate" type="application/rss+xml" href="<?php bloginfo('comments_rss2_url') ?>" title="<?php printf( __( '%s latest comments', 'carrington-jam' ), wp_specialchars( get_bloginfo('name'), 1 ) ) ?>" />
	<link rel="pingback" href="<?php bloginfo('pingback_url') ?>" />
    <link rel="shortcut icon" href="<?php bloginfo( 'template_url') ?>/img/favicon.ico" />
	<?php wp_get_archives('type=monthly&format=link'); ?>
	
	<link rel="stylesheet" type="text/css" href="<?php bloginfo('template_url') ?>/css/common.css" />

    <!--[if lt IE 9]>
        <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

	<?php
	// Javascript for threaded comments
	// if ( is_singular() ) { wp_enqueue_script( 'comment-reply' ); } ?>
	
	<?php wp_head(); ?>


    <script type="text/javascript" 
src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>

    <?php
    global $post;
    if ($post) {
    $page_css_files = get_post_meta($post->ID, 'page_css_file', false);
    foreach( $page_css_files as $file ) {
        ?>
        <link rel='stylesheet' type='text/css' href='<?php echo $file; ?>' />
        <?php
    }

    $page_css = get_post_meta($post->ID, 'page_css', true);
    if( $page_css ) {
        echo "<style type='text/css'>$page_css</style>";
    }
    }
    ?>
</head>

<body <?php body_class(); ?>>
<div id="page">

    <header id="pageHeader">
        <a href="<?php bloginfo('url') ?>/" title="Home" rel="home">
            <img src="<?php bloginfo( 'template_url' ) ?>/img/logo.png" alt="CSS3 PIE" class="logo" />
        </a>

        <p class="tagline">Progressive Internet Explorer</p>

        <!--[if IE 8]><nav id="mainNav" class="ie8"><![endif]-->
        <![if !(IE 8)]><nav id="mainNav"><![endif]>
            <?php wp_nav_menu( array('menu' => 'Main Menu', 'container' => null )); ?>

            <p><a class="outbound" href="/download"><strong>Download</strong></a></p>

            <form action="https://www.paypal.com/cgi-bin/webscr" method="post">
                <input type="hidden" name="cmd" value="_s-xclick">
                <input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----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-----END PKCS7-----">
                <button type="submit" class="outbound"><strong>Donate</strong></button>
            </form>

            <ul class="social">
                <li class="rss"><a href="http://css3pie.com/feed" title="RSS feed for the PIE blog">RSS feed for the PIE blog</a></li>
                <li class="twitter"><a href="http://twitter.com/css3pie" title="Follow @css3pie on Twitter">Follow @css3pie on Twitter</a></li>
            </ul>

        </nav>
        
    </header>

    <div id="pageContent">
