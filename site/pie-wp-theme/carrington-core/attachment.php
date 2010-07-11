<?php

// This file is part of the Carrington Theme Framework for WordPress
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

function cfct_get_adjacent_image_link($prev = true) {
	global $post;
	$post = get_post($post);
	$attachments = array_values(get_children( array('post_parent' => $post->post_parent, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => 'ASC', 'orderby' => 'menu_order ID') ));

	foreach ( $attachments as $k => $attachment )
		if ( $attachment->ID == $post->ID )
			break;

	$k = $prev ? $k - 1 : $k + 1;

	if ( isset($attachments[$k]) )
		return wp_get_attachment_link($attachments[$k]->ID, 'thumbnail', true);
}

function cfct_post_gallery($unused, $attr) {
	global $post;

	// We're trusting author input, so let's at least make sure it looks like a valid orderby statement
	if ( isset( $attr['orderby'] ) ) {
		$attr['orderby'] = sanitize_sql_orderby( $attr['orderby'] );
		if ( !$attr['orderby'] )
			unset( $attr['orderby'] );
	}

	extract(shortcode_atts(array(
		'order'      => 'ASC',
		'orderby'    => 'menu_order ID',
		'id'         => $post->ID,
		'itemtag'    => 'dl',
		'icontag'    => 'dt',
		'captiontag' => 'dd',
		'columns'    => 3,
		'size'       => 'thumbnail'
	), $attr));

	$id = intval($id);
	$attachments = get_children( array('post_parent' => $id, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby) );

	if ( empty($attachments) )
		return '';

	if ( is_feed() ) {
		$output = "\n";
		foreach ( $attachments as $id => $attachment )
			$output .= wp_get_attachment_link($id, $size, true) . "\n";
		return $output;
	}

	$itemtag = tag_escape($itemtag);
	$captiontag = tag_escape($captiontag);
	$columns = apply_filters('cfct_post_gallery_columns', intval($columns));
	$itemwidth = $columns > 0 ? floor(100/$columns) : 100;

	$output = apply_filters('gallery_style', '
		<style type="text/css">
			.post-'.$id.' .gallery {
				margin: auto;
			}
			.post-'.$id.' .gallery-item {
				float: left;
				margin-top: 10px;
				text-align: center;
				width: '.$itemwidth.'%;			}
			.post-'.$id.' .gallery img {
				border: 2px solid #cfcfcf;
			}
			.post-'.$id.' .gallery-caption {
				margin-left: 0;
			}
		</style>
		<!-- see cfct_post_gallery() in carrington-core/attachment.php -->
		<div class="gallery">');

	$i = 0;
	foreach ( $attachments as $id => $attachment ) {
// get full item src
		$item_src = wp_get_attachment_image_src($id, 'full', false);

		$link = isset($attr['link']) && 'file' == $attr['link'] ? wp_get_attachment_link($id, $size, false, false) : wp_get_attachment_link($id, $size, true, false);
		
// add full item src as rel
		$link = str_replace('><img', ' class="thickbox" rel="'.$item_src[0].'"><img', $link);

		$output .= "<{$itemtag} class='gallery-item'>";
		$output .= "
			<{$icontag} class='gallery-icon'>
				$link
			</{$icontag}>";
		if ( $captiontag && trim($attachment->post_excerpt) ) {
			$output .= "
				<{$captiontag} class='gallery-caption'>
				{$attachment->post_excerpt}
				</{$captiontag}>";
		}
		$output .= "</{$itemtag}>";
		if ( $columns > 0 && ++$i % $columns == 0 )
			$output .= '<br style="clear: both" />';
	}

	$output .= "
			<br style='clear: both;' />
		</div>\n";

	return $output;
}
add_filter('post_gallery', 'cfct_post_gallery', 10, 2);

?>