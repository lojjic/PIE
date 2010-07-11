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

function cfct_page($file = '') {
	if (empty($file)) {
		$file = cfct_default_file('pages');
	}
	cfct_template_file('pages', $file);
}

function cfct_header() {
	$file = cfct_choose_general_template('header');
	cfct_template_file('header', $file);
}

function cfct_footer() {
	$file = cfct_choose_general_template('footer');
	cfct_template_file('footer', $file);
}

function cfct_sidebar() {
	$file = cfct_choose_general_template('sidebar');
	cfct_template_file('sidebar', $file);
}

function cfct_posts() {
	$file = cfct_choose_general_template('posts');
	cfct_template_file('posts', $file);
}

function cfct_single() {
	$file = cfct_choose_general_template('single');
	cfct_template_file('single', $file);
}

function cfct_attachment() {
	$file = cfct_choose_general_template('attachment');
	cfct_template_file('attachment', $file);
}

function cfct_loop() {
	$file = cfct_choose_general_template('loop');
	cfct_template_file('loop', $file);
}

function cfct_content() {
	$file = cfct_choose_content_template();
	cfct_template_file('content', $file);
}

function cfct_excerpt() {
	$file = cfct_choose_content_template('excerpt');
	cfct_template_file('excerpt', $file);
}

function cfct_comments() {
	$file = cfct_choose_general_template('comments');
	cfct_template_file('comments', $file);
}

function cfct_comment($data = null) {
	$file = cfct_choose_comment_template();
	cfct_template_file('comment', $file, $data);
}

function cfct_threaded_comment($comment, $args = array(), $depth) {
	$GLOBALS['comment'] = $comment;
	$data = array(
		'args' => $args,
		'depth' => $depth,
	);
	cfct_template_file('comments', 'threaded', $data);
}

function cfct_form($name = '') {
	$parts = cfct_leading_dir($name);
	cfct_template_file('forms/'.$parts['dir'], $parts['file']);
}

function cfct_misc($name = '') {
	$parts = cfct_leading_dir($name);
	cfct_template_file('misc/'.$parts['dir'], $parts['file']);
}

function cfct_error($name = '') {
	cfct_template_file('error', $name);
}

?>