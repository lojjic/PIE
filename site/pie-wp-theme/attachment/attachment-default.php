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

get_header();

if (have_posts()) : while (have_posts()) : the_post(); 

?>

<a href="<?php echo get_permalink($post->post_parent); ?>" rev="attachment">&larr; back to &#8220;<?php echo get_the_title($post->post_parent); ?>&#8221;</a>


<a href="<?php echo wp_get_attachment_url($post->ID); ?>"><?php echo wp_get_attachment_image( $post->ID, 'full' ); ?></a>

<h1><?php the_title(); ?></h1>

<?php 

if ( !empty($post->post_excerpt) ) the_excerpt(); // this is the "caption"

the_content();

if (cfct_get_adjacent_image_link(false) != '') {
	next_image_link();
}
if (cfct_get_adjacent_image_link(true) != '') {
	previous_image_link();
}
	
?>

<?php endwhile; else: ?>

<p>Sorry, no attachments matched your criteria.</p>

<?php endif; ?>

<?php 

wp_footer();

get_footer();

?>