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

function cfct_die($str = '') {
	if (!empty($str)) {
		if (file_exists(CFCT_PATH.'error/exit.php')) {
			include(CFCT_PATH.'error/exit.php');
			die();
		}
		else {
			wp_die($str);
		}
	}
}

function cfct_banner($str = '') {
	if (!empty($str)) {
		if (file_exists(CFCT_PATH.'misc/banner.php')) {
			include(CFCT_PATH.'misc/banner.php');
		}
		else {
			echo '<!-- '.$str.' -->';
		}
	}
}

function cfct_get_option($name) {
	$defaults = array(
		'cfct_credit' => 'yes',
		'cfct_lightbox' => 'yes',
		'cfct_header_image' => 0,
	);
	$defaults = apply_filters('cfct_option_defaults', $defaults);
	$value = get_option($name);
	if ($value == '' && isset($defaults[$name])) {
		$value = $defaults[$name];
	}
	return $value;
}

function cfct_load_plugins() {
	$files = cfct_files(CFCT_PATH.'plugins');
	if (count($files)) {
		foreach ($files as $file) {
			if (file_exists(CFCT_PATH.'plugins/'.$file)) {
				include_once(CFCT_PATH.'plugins/'.$file);
			}
// child theme support
			if (file_exists(STYLESHEETPATH.'/plugins/'.$file)) {
				include_once(STYLESHEETPATH.'/plugins/'.$file);
			}
		}
	}
}

function cfct_default_file($dir) {
	$fancy = $dir.'-default.php';
	file_exists(CFCT_PATH.$dir.'/'.$fancy) ? $default = $fancy : $default = 'default.php';
	return $default;
}

function cfct_context() {
	$context = 'home';
	if (is_home()) {
		$context = 'home';
	}
	else if (is_page()) {
		$context = 'page';
	}
	else if (is_single()) {
		$context = 'single';
	}
	else if (is_category()) {
		$context = 'category';
	}
	else if (is_tag()) {
		$context = 'tag';
	}
	else if (is_author()) {
		$context = 'author';
	}
	else if (is_archive()) {
// possible future abstraction for:
// 	is_month()
// 	is_year()
// 	is_day()
		$context = 'archive';
	}
	else if (is_search()) {
		$context = 'search';
	}
	else if (is_404()) {
		$context = '404';
	}
	return apply_filters('cfct_context', $context);
}

/**
 * @param $template = folder name of file
 * @param $type = file name of file
 * @param $keys = keys that could be used for additional filename params
 * returns false if file does not exist
 *
 */
function cfct_filename($dir, $type = 'default', $keys = array()) {
	switch ($type) {
		case 'author':
			if (count($keys)) {
				$file = 'author-'.$keys[0];
			}
			else {
				$file = 'author';
			}
			break;
		case 'category':
			if (count($keys)) {
				$file = 'cat-'.$keys[0];
			}
			else {
				$file = 'category';
			}
			break;
		case 'tag':
			if (count($keys)) {
				$file = 'tag-'.$keys[0];
			}
			else {
				$file = 'tag';
			}
			break;
		case 'meta':
			if (count($keys)) {
				foreach ($keys as $k => $v) {
					if (!empty($v)) {
						$file = 'meta-'.$k.'-'.$v;
					}
					else {
						$file = 'meta-'.$k;
					}
					break;
				}
			}
			break;
		case 'user':
			if (count($keys)) {
				$file = 'user-'.$keys[0];
			}
			break;
		case 'role':
			if (count($keys)) {
				$file = 'role-'.$keys[0];
			}
			break;
		case 'parent':
			if (count($keys)) {
				$file = 'parent-'.$keys[0];
			}
			break;
		default:
		// handles page, etc.
			$file = $type;
	}
	// fallback for category, author, tag, etc.
	// child theme path
	$path = STYLESHEETPATH.'/'.$dir.'/'.$file.'.php';
	// check for child theme first
	if (!file_exists($path)) {
		// use parent theme if no child theme file found
		$path = CFCT_PATH.$dir.'/'.$file.'.php';
	}
	if (!file_exists($path)) {
		switch ($type) {
			case 'author':
			case 'category':
			case 'tag':
				// child theme path
				$path = STYLESHEETPATH.'/'.$dir.'/archive.php';
				if (!file_exists($path)) {
					// use parent theme if no child theme file found
					$path = CFCT_PATH.$dir.'/archive.php';
				}
		}
	}
	$default = CFCT_PATH.$dir.'/'.cfct_default_file($dir);
	if (file_exists($path)) {
		$path = $path;
	}
	else if (file_exists($default)) {
		$path = $default;
	}
	else {
		$path = false;
	}
	return apply_filters('cfct_filename', $path);
}

function cfct_template($dir, $keys = array()) {
	$context = cfct_context();
	$file = cfct_filename($dir, $context, $keys);
	if ($file) {
		include($file);
	}
	else {
		cfct_die('Error loading '.$dir.' '.__LINE__);
	}
}

function cfct_template_file($dir, $file, $data = null) {
	$path = '';
	if (!empty($file)) {
		$file = basename($file, '.php');
		// child theme support
		$path = STYLESHEETPATH.'/'.$dir.'/'.$file.'.php';
		if (!file_exists($path)) {
			$path = CFCT_PATH.$dir.'/'.$file.'.php';
		}
	}
	if (file_exists($path)) {
		include($path);
	}
	else {
		cfct_die('Error loading '.$file.' '.__LINE__);
	}
}

function cfct_choose_general_template($dir) {
	$exec_order = array(
		'author',
		'role',
		'category',
		'tag',
		'single',
		'default'
	);
	$exec_order = apply_filters('cfct_general_match_order', $exec_order);
	$files = cfct_files(CFCT_PATH.$dir);
	foreach ($exec_order as $func_name) {
		if (!function_exists($func_name)) {
			$func_name = 'cfct_choose_general_template_'.$func_name;
		}
		if (function_exists($func_name)) {
			$filename = $func_name($dir, $files);
			if ($filename != false) {
				break;
			}
		}
	}
	return apply_filters('cfct_choose_general_template', $filename, $dir);
}

function cfct_choose_general_template_author($dir, $files) {
	$files = cfct_author_templates($dir, $files);
	if (count($files)) {
		$username = get_query_var('author_name');
		if (empty($username)) {
			$user = new WP_User(get_query_var('author'));
			$username = $user->user_login;
		}
		$filename = 'author-'.$username.'.php';
		if (in_array($filename, $files)) {
			$keys = array($username);
			return cfct_filename($dir, 'author', $keys);
		}
 	}
	return false;
}

function cfct_choose_general_template_category($dir, $files) {
	$files = cfct_cat_templates($dir, $files);
	if (count($files)) {
		global $cat;
		$slug = cfct_cat_id_to_slug($cat);
		if (in_array('cat-'.$slug.'.php', $files)) {
			$keys = array($slug);
			return cfct_filename($dir, 'category', $keys);
		}
 	}
	return false;
}

function cfct_choose_general_template_tag($dir, $files) {
	$files = cfct_tag_templates($dir, $files);
	if (count($files)) {
		$tag = get_query_var('tag');
		if (in_array('tag-'.$tag.'.php', $files)) {
			$keys = array($tag);
			return cfct_filename($dir, 'tag', $keys);
		}
 	}
	return false;
}

function cfct_choose_general_template_role($dir, $files) {
	$files = cfct_role_templates($dir, $files);
	if (count($files)) {
		$username = get_query_var('author_name');
		$user = new WP_User(cfct_username_to_id($username));
		if (!empty($user->user_login)) {
			if (count($user->roles)) {
				foreach ($user->roles as $role) {
					$role_file = 'role-'.$role.'.php';
					if (in_array($role_file, $files)) {
						return $role_file;
					}
				}
			}
		}
 	}
	return false;
}

function cfct_choose_general_template_single($dir, $files) {
	if (cfct_context() == 'single') {
		$files = cfct_single_templates($dir, $files);
		if (count($files)) {
// check to see if we're in the loop.
			global $post;
			$orig_post = $post;
			while (have_posts()) {
				the_post();
				$filename = cfct_choose_single_template($files, 'single-*');
				if (!$filename) {
					if (file_exists(CFCT_PATH.$dir.'/single.php')) {
						$filename = 'single.php';
					}
				}
			}
			rewind_posts();
			$post = $orig_post;
			return $filename;
		}
	}
	return false;
}

function cfct_choose_general_template_default($dir, $files) {
	$context = cfct_context();
	return cfct_filename($dir, $context);
}

function cfct_choose_single_template($files = array(), $filter = '*') {
// must be called within the_loop - cfct_choose_general_template_single() approximates a loop for this reason.
	$exec_order = array(
		'author',
		'meta',
		'category',
		'type',
		'role',
		'tag',
		'parent', // for pages
	);
	$exec_order = apply_filters('cfct_single_match_order', $exec_order);
	$filename = false;
	foreach ($exec_order as $func_name) {
		if (!function_exists($func_name)) {
			$func_name = 'cfct_choose_single_template_'.$func_name;
		}
		if (function_exists($func_name)) {
			$filename = $func_name($dir, $files, $filter);
			if ($filename != false) {
				break;
			}
		}
	}
	return apply_filters('cfct_choose_single_template', $filename);
}

function cfct_choose_single_template_type($dir, $files, $filter) {
	$type_files = cfct_type_templates('', $files);
	if (count($type_files)) {
		global $post;
		$file = cfct_filename_filter('type-'.$post->post_type.'.php', $filter);
		if (in_array($file, $type_files)) {
			return $file;
		}
	}
	return false;
}

function cfct_choose_single_template_author($dir, $files, $filter) {
	$author_files = cfct_author_templates('', $files);
	if (count($author_files)) {
		$author = get_the_author_login();
		$file = cfct_filename_filter('author-'.$author.'.php', $filter);
		if (in_array($file, $author_files)) {
			return $file;
		}
	}
	return false;
}

function cfct_choose_single_template_meta($dir, $files, $filter) {
	global $post;
	$meta_files = cfct_meta_templates('', $files);
	if (count($meta_files)) {
		$meta = get_post_custom($post->ID);
		if (count($meta)) {
// check key, value matches first
			foreach ($meta as $k => $v) {
				$val = $v[0];
				$file = cfct_filename_filter('meta-'.$k.'-'.$val.'.php', $filter);
				if (in_array($file, $meta_files)) {
					return $file;
				}
			}
// check key matches only
			if (!$filename) {
				foreach ($meta as $k => $v) {
					$file = cfct_filename_filter('meta-'.$k.'.php', $filter);
					if (in_array($file, $meta_files)) {
						return $file;
					}
				}
			}
		}
	}
	return false;
}

function cfct_choose_single_template_category($dir, $files, $filter) {
	$cat_files = cfct_cat_templates($type, $files);
	if (count($cat_files)) {
		foreach ($cat_files as $file) {
			$file = cfct_filename_filter($file, $filter);
			$cat_id = cfct_cat_filename_to_id($file);
			if (in_category($cat_id)) {
				return $file;
			}
		}
	}
	return false;
}

function cfct_choose_single_template_role($dir, $files, $filter) {
	$role_files = cfct_role_templates($type, $files);
	if (count($role_files)) {
		$user = new WP_User(get_the_author_meta('ID'));
		if (count($user->roles)) {
			foreach ($role_files as $file) {
				$file = cfct_filename_filter($file, $filter);
				foreach ($user->roles as $role) {
					if (cfct_role_filename_to_name($file) == $role) {
						return $file;
					}
				}
			}
		}
	}
	return false;
}

function cfct_choose_single_template_tag($dir, $files, $filter) {
	global $post;
	$tag_files = cfct_tag_templates($type, $files);
	if (count($tag_files)) {
		$tags = get_the_tags($post->ID);
		if (is_array($tags) && count($tags)) {
			foreach ($tag_files as $file) {
				$file = cfct_filename_filter($file, $filter);
				foreach ($tags as $tag) {
					if ($tag->slug == cfct_tag_filename_to_name($file)) {
						return $file;
					}
				}
			}
		}
	}
	return false;
}

function cfct_choose_single_template_parent($dir, $files, $filter) {
	global $post;
	$parent_files = cfct_parent_templates($type, $files);
	if (count($parent_files) && $post->post_parent > 0) {
		$parent = cfct_post_id_to_slug($post->post_parent);
		$file = cfct_filename_filter('parent-'.$parent.'.php', $filter);
		if (in_array($file, $parent_files)) {
			return $file;
		}
	}
	return false;
}

function cfct_choose_content_template($type = 'content') {
	$files = cfct_files(CFCT_PATH.$type);
	$filename = cfct_choose_single_template($files);
	if (!$filename && cfct_context() == 'page' && file_exists(CFCT_PATH.$type.'/page.php')) {
		$filename = 'page.php';
	}
	if (!$filename) {
		$filename = cfct_default_file($type);
	}
	return apply_filters('cfct_choose_content_template', $filename, $type);
}

function cfct_choose_comment_template() {
	$exec_order = array(
		'ping',
		'author',
		'user',
		'meta',
		'role',
		'default',
	);
	$exec_order = apply_filters('cfct_comment_match_order', $exec_order);
	$files = cfct_files(CFCT_PATH.'comment');
	foreach ($exec_order as $func_name) {
		if (!function_exists($func_name)) {
			$func_name = 'cfct_choose_comment_template_'.$func_name;
		}
		if (function_exists($func_name)) {
			$filename = $func_name($files);
			if ($filename != false) {
				break;
			}
		}
	}
	return apply_filters('cfct_choose_comment_template', $filename);
}

function cfct_choose_comment_template_ping($files) {
	global $comment;
	if (in_array('ping.php', $files)) {
		switch ($comment->comment_type) {
			case 'pingback':
			case 'trackback':
				return 'ping';
				break;
		}
	}
	return false;
}

function cfct_choose_comment_template_meta($files) {
	global $comment;
	$meta_files = cfct_meta_templates('', $files);
	if (count($meta_files)) {
		$meta = get_metadata('comment', $comment->comment_ID);
		if (count($meta)) {
// check key, value matches first
			foreach ($meta as $k => $v) {
				$val = $v[0];
				$file = 'meta-'.$k.'-'.$val.'.php';
				if (in_array($file, $meta_files)) {
					return $file;
				}
			}
// check key matches only
			if (!$filename) {
				foreach ($meta as $k => $v) {
					$file = 'meta-'.$k.'.php';
					if (in_array($file, $meta_files)) {
						return $file;
					}
				}
			}
		}
	}
	return false;
}

function cfct_choose_comment_template_author($files) {
	global $post, $comment;
	if (!empty($comment->user_id) && $comment->user_id == $post->post_author && in_array('author.php', $files)) {
		return 'author';
 	}
	return false;
}

function cfct_choose_comment_template_user($files) {
	global $comment;
	$files = cfct_comment_templates('user', $files);
	if (count($files) && !empty($comment->user_id)) {
		$user = new WP_User($comment->user_id);
		if (!empty($user->user_login)) {
			$user_file = 'user-'.$user->user_login.'.php';
			if (in_array($user_file, $files)) {
				return $user_file;
			}
		}
 	}
	return false;
}

function cfct_choose_comment_template_role($files) {
	global $comment;
	$files = cfct_comment_templates('role', $files);
	if (count($files) && !empty($comment->user_id)) {
		$user = new WP_User($comment->user_id);
		if (!empty($user->user_login)) {
			if (count($user->roles)) {
				foreach ($user->roles as $role) {
					$role_file = 'role-'.$role.'.php';
					if (in_array($role_file, $files)) {
						return $role_file;
					}
				}
			}
		}
 	}
	return false;
}

function cfct_choose_comment_template_default($files) {
	return cfct_default_file('comment');
}

function cfct_filename_filter($filename, $filter) {
	// check for filter already appended
	if (substr($filename, 0, strlen($filter) - 1) == str_replace('*', '', $filter)) {
		return $filename;
	}
	return str_replace('*', $filename, $filter);
}

function cfct_files($path) {
	$files = apply_filters('cfct_files_'.$path, false);
	if ($files) {
		return $files;
	}
	$files = wp_cache_get('cfct_files_'.$path, 'cfct');
	if ($files) {
		return $files;
	}
	$files = array();
	$paths = array($path);
	if (STYLESHEETPATH.'/' != CFCT_PATH) {
		// load child theme files
		$paths[] = STYLESHEETPATH.'/'.str_replace(CFCT_PATH, '', $path);
	}
	foreach ($paths as $path) {
		if (is_dir($path) && $handle = opendir($path)) {
			while (false !== ($file = readdir($handle))) {
				$path = trailingslashit($path);
				if (is_file($path.$file) && strtolower(substr($file, -4, 4)) == ".php") {
					$files[] = $file;
				}
			}
			closedir($handle);
		}
	}
	$files = array_unique($files);
	wp_cache_set('cfct_files_'.$path, $files, 'cfct', 3600);
	return $files;
}

function cfct_filter_files($files = array(), $prefix = '') {
	$matches = array();
	if (count($files)) {
		foreach ($files as $file) {
			if (strpos($file, $prefix) !== false) {
				$matches[] = $file;
			}
		}
	}
	return $matches;
}

function cfct_meta_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'meta-');
	return apply_filters('cfct_meta_templates', $matches);
}

function cfct_cat_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'cat-');
	return apply_filters('cfct_cat_templates', $matches);
}

function cfct_tag_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'tag-');
	return apply_filters('cfct_tag_templates', $matches);
}

function cfct_author_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'author-');
	return apply_filters('cfct_author_templates', $matches);
}

function cfct_type_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'type-');
	return apply_filters('cfct_type_templates', $matches);
}

function cfct_role_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'role-');
	return apply_filters('cfct_role_templates', $matches);
}

function cfct_parent_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'parent-');
	return apply_filters('cfct_parent_templates', $matches);
}

function cfct_single_templates($dir, $files = null) {
	if (is_null($files)) {
		$files = cfct_files(CFCT_PATH.$dir);
	}
	$matches = cfct_filter_files($files, 'single');
	return apply_filters('cfct_single_templates', $matches);
}

function cfct_comment_templates($type, $files = false) {
	if (!$files) {
		$files = cfct_files(CFCT_PATH.'comment');
	}
	$matches = array();
	switch ($type) {
		case 'user':
			$matches = cfct_filter_files($files, 'user-');
			break;
		case 'role':
			$matches = cfct_filter_files($files, 'role-');
			break;
	}
	return apply_filters('cfct_comment_templates', $matches);
}

function cfct_cat_filename_to_id($file) {
	$cat = cfct_cat_filename_to_slug($file);
	$cat = get_category_by_slug($cat);
	return $cat->cat_ID;
}

function cfct_cat_filename_to_name($file) {
	$cat = cfct_cat_filename_to_slug($file);
	$cat = get_category_by_slug($cat);
	return $cat->name;
}

function cfct_cat_filename_to_slug($file) {
	return str_replace(array('single-cat-', 'cat-', '.php'), '', $file);
}

function cfct_cat_id_to_slug($id) {
	$cat = &get_category($id);
	return $cat->slug;
}

function cfct_username_to_id($username) {
	return get_profile('ID', $username);
}

function cfct_tag_filename_to_name($file) {
	return str_replace(array('single-tag-', 'tag-', '.php'), '', $file);
}

function cfct_author_filename_to_name($file) {
	return str_replace(array('single-author-', 'author-', '.php'), '', $file);
}

function cfct_role_filename_to_name($file) {
	return str_replace(array('single-role-', 'role-', '.php'), '', $file);
}

function cfct_post_id_to_slug($id) {
	$post = get_post($id);
	return $post->post_name;
}

function cfct_basic_content_formatting($str) {
	$str = wptexturize($str);
	$str = convert_smilies($str);
	$str = convert_chars($str);
	$str = wpautop($str);
	return $str;
}

function cfct_leading_dir($path) {
	$val = array(
		'dir' => '',
		'file' => ''
	);
	if (strpos($path, '/') !== false) {
		$parts = explode('/', $path);
		$val['file'] = $parts[count($parts) - 1];
		$val['dir'] = implode('/', array_slice($parts, 0, count($parts) - 1));
	}
	else {
		$val['file'] = $path;
	}
	return $val;
}

?>