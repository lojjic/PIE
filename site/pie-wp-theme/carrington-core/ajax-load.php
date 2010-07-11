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

if (__FILE__ == $_SERVER['SCRIPT_FILENAME']) { die(); }

function cfct_ajax_post_content($post_id) {
	global $post, $posts, $wp_query, $wp;
	$posts = get_posts('include='.$post_id);
	$post = $posts[0];
	if (is_null($post)) {
		$posts = get_pages('include='.$post_id);
		$post = $posts[0];
	}
	if (is_null($post)) {
		$posts = get_posts('post_status=private&include='.$post_id);
		$post = $posts[0];
		if ($post) {
			$user = wp_get_current_user();
			if (!$user->ID || $user->ID != $post->post_author) {
				$post = null;
			}
		}
	}
	if (!$post) {
		die('');
	}
	$wp_query->in_the_loop = true;
	setup_postdata($post);
	remove_filter('the_content', 'st_add_widget');
	$wp->send_headers();
	cfct_content();
	echo '<div class="close" id="post_close_'.$post_id.'"><a href="#">'.__('Close', 'carrington').'</a></div>';
}

function cfct_ajax_post_comments($post_id) {
	global $post, $posts, $wp_query, $wp;
	$wp_query->is_single = true;
	$posts = get_posts('include='.$post_id);
	$post = $posts[0];
	if (is_null($post)) {
		$posts = get_pages('include='.$post_id);
		$post = $posts[0];
	}
	setup_postdata($post);
	$wp->send_headers();
	comments_template();
}

function cfct_ajax_load() {
	if (isset($_GET['cfct_action'])) {
		switch ($_GET['cfct_action']) {
			case 'post_content':
			case 'post_comments':
				if (isset($_GET['id'])) {
					$post_id = intval($_GET['id']);
				}
				else if (isset($_GET['url'])) {
					$post_id = url_to_post_id($_GET['url']);
				}
				if ($post_id) {
					call_user_func('cfct_ajax_'.$_GET['cfct_action'], $post_id);
					die();
				}
		}
	}
}

function cfct_ajax_comment_link() {
	global $post;
	echo ' rev="post-'.$post->ID.'" ';
}
add_filter('comments_popup_link_attributes', 'cfct_ajax_comment_link');

function cfct_posts_per_archive_page_setting() {
	$count = get_option('cfct_posts_per_archive_page');
	intval($count) > 0 ? $count = $count : $count = 25;
	return $count;
}

// add a self-removing filter to handle category pages
function cfct_add_posts_per_archive_page() {
	add_filter('pre_get_posts', 'cfct_posts_per_archive_page');
	add_filter('pre_get_posts', 'cfct_posts_per_category_page');
}
add_filter('parse_request', 'cfct_add_posts_per_archive_page');

function cfct_posts_per_archive_page($query) {
	remove_filter('pre_get_posts', 'cfct_posts_per_archive_page');
	$query->set('posts_per_archive_page', cfct_posts_per_archive_page_setting());
	return $query;
}

function cfct_posts_per_category_page($query) {
	remove_filter('pre_get_posts', 'cfct_posts_per_category_page');
	if (is_category()) {
		$query->set('posts_per_page', cfct_posts_per_archive_page_setting());
	}
	return $query;
}

?>