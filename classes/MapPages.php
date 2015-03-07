<?php
namespace Responsiv\Angular\Classes;

use Cms\Classes\Theme;
use Event;

class MapPages
{

    public static function hasStaticPage()
    {
        $apiResult = Event::fire('pages.menuitem.listTypes');
        $hasStaticPage = false;
        foreach ($apiResult as $api) {
            if (array_get($api, 'static-page')) {

                $hasStaticPage = true;
            }
        }

        return $hasStaticPage;
    }

    public function listPages($skipCache = false)
    {
        $static_routes = array();
        $theme = Theme::getEditTheme();
        $static_pages = \RainLab\Pages\Classes\Page::all($theme, $skipCache);
        foreach ($static_pages as $page) {

            $static_routes[] = array(
                'title' => $page->viewBag['title'],
                'url' => $page->viewBag['url'],
                'file' => 'content/static-pages/' . $page->baseFilename,
            );
        }

        return $static_routes;

    }

}
