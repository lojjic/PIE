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

global $comments, $comment;

?>
	<ol>
<?php
if (function_exists('wp_list_comments')) {
	wp_list_comments('type=comment&callback=cfct_threaded_comment');
} else {
	foreach ($comments as $comment) {
		if (get_comment_type() == 'comment') {
?>
		<li id="comment-<?php comment_ID(); ?>">
<?php
		cfct_comment();
?>
		</li><!--.hentry-->
<?php
		}
	}
}
?>
	</ol>
	
<?php
if(function_exists('previous_comments_link')){
	previous_comments_link();
	next_comments_link();
}
?>