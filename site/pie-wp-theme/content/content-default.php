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

$headerTag = is_single() ? "h1" : "h2";

?>
<article class="post">

    <<?php echo $headerTag ?>>
        <a href="<?php the_permalink() ?>"><?php the_title() ?></a>
    </<?php echo $headerTag ?>>

    <div class="content">
        <?php
        the_content();
        ?>
    </div>

    <footer>
        <?php
        wp_link_pages();

        echo "<p>Posted on ";
        the_date();
        echo " by ";
        the_author();
        echo "</p>";

        the_category(', ');

        the_tags(__('Tagged with ', 'carrington-jam'), ', ', '');

        comments_popup_link(__('No comments', 'carrington-jam'), __('1 comment', 'carrington-jam'), __('% comments', 'carrington-jam'));

        edit_post_link(__('Edit This', 'carrington-jam'), '', '');
        ?>
    </footer>

</article>