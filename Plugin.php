<?php namespace Responsiv\Angular;

use Input;
use Event;
use Request;
use System\Classes\PluginBase;
use Responsiv\Angular\Classes\PageScript;

/**
 * Angular Plugin Information File
 */
class Plugin extends PluginBase
{

    /**
     * Returns information about this plugin.
     *
     * @return array
     */
    public function pluginDetails()
    {
        return [
            'name'        => 'Angular',
            'description' => 'Tools for working with AngularJS',
            'author'      => 'Responsiv Internet',
            'icon'        => 'icon-leaf'
        ];
    }

    public function boot()
    {
        // sleep(1);
        Event::listen('cms.page.beforeDisplay', function($controller, $url, $page) {
            if ($params = post('X_OCTOBER_NG_PARAMS'))
                $controller->getRouter()->setParameters($params);
        });

        Event::listen('cms.page.display', function($controller, $url, $page) {
            if (array_key_exists('ng-page', Input::all())) {
                if ($content = $controller->renderPage())
                    return $content;

                // If we don't return something, this will cause an infinite loop
                return '<!-- No content -->';
            }
        });

        Event::listen('cms.page.init', function($controller, $url, $page) {
            if ($partial = post('ng-partial'))
                return $controller->renderPartial($partial);
        });

        Event::listen('backend.form.extendFields', function($widget) {
            if (!$widget->getController() instanceof \Cms\Controllers\Index) return;
            if (!$widget->model instanceof \Cms\Classes\Page) return;

            PageScript::fromTemplate($widget->model)->populate();

            $widget->addFields([
                'script' => [
                    'tab' => 'Script',
                    'stretch' => 'true',
                    'type' => 'codeeditor',
                    'language' => 'javascript',
                ]
            ], 'secondary');
        });

        Event::listen('cms.template.save', function($controller, $template, $type){
            if ($type != 'page') return;

            PageScript::fromTemplate($template)->save(post('script'));
        });
    }

    public function registerComponents()
    {
        return [
           '\Responsiv\Angular\Components\Layout'     => 'appLayout',
        ];
    }

}

