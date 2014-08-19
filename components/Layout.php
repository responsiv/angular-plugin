<?php namespace Responsiv\Angular\Components;

use Auth;
use Request;
use Redirect;
use Cms\Classes\Page;
use Cms\Classes\ComponentBase;

/**
 * Angular Layout
 * 
 * Allocates a layout to work for angular.
 */
class Layout extends ComponentBase
{
    public function componentDetails()
    {
        return [
            'name'           => 'Angular Layout',
            'description'    => 'Allocate a layout for use with AngularJS.',
        ];
    }

    public function defineProperties()
    {
        return [
            'idParam' => [
                'title'       => 'Slug param name',
                'description' => 'The URL route parameter used for looking up the channel by its slug. A hard coded slug can also be used.',
                'default'     => ':slug',
                'type'        => 'string',
            ],

        ];
    }

    public function onRun()
    {
        $this->page['pages'] = Page::all();
    }

}