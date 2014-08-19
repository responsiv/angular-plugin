<?php namespace Responsiv\Angular;

use Input;
use Event;
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
            'description' => 'No description provided yet...',
            'author'      => 'Responsiv',
            'icon'        => 'icon-leaf'
        ];
    }

    public function boot()
    {
        Event::listen('cms.page.beforeDisplay', function($controller, $url, $page) {
            if (array_key_exists('ng-page', Input::all()))
                $page->layout = null;
        });

        Event::listen('cms.page.render', function($controller, $contents) {
            if (array_key_exists('ng-page', Input::all()))
                return;

            return '<ng-view>'.$contents.'</ng-view>';
            if (array_key_exists('ng-layout', Input::all()))
                return '<ng-view></ng-view>';
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

