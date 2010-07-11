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
/*
?>

<div id="sidebar">
	<div id="primary-sidebar">
<?php
$post = $orig_post;
if ( !function_exists('dynamic_sidebar') || !dynamic_sidebar('Primary Sidebar') ) {
?>
		<div class="widget">
			<h2 class="title">Archives</h2>
			<ul>
				<?php wp_get_archives(); ?>
			</ul>
		</div><!--.widget-->
		<div class="widget">
			<h2 class="title">Pages</h2>
			<ul>
				<?php wp_list_pages('title_li='); ?>
			</ul>
		</div><!--.widget-->
<?php
}
?>
	</div><!--#primary-sidebar-->
	<div id="secondary-sidebar">
<?php
if ( !function_exists('dynamic_sidebar') || !dynamic_sidebar('Secondary Sidebar') ) { 
?>
		<div class="widget">
			<h2 class="title">Search</h2>
			<?php cfct_form('search'); ?>
		</div><!--.widget-->
		<div class="widget">
			<h2 class="title">Tags</h2>
			<?php wp_tag_cloud('smallest=10&largest=18&unit=px'); ?>
		</div><!--.widget-->
		<?php wp_register('<p>', '</p>'); ?> 
		<p><?php wp_loginout(); ?></p>

<?php
}
?>
	</div><!--#secondary-sidebar-->
</div><!--#sidebar-->

<?php
*/
?>