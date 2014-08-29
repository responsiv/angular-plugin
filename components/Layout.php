<?php namespace Responsiv\Angular\Components;

use Auth;
use File;
use Request;
use Redirect;
use Cms\Classes\Page;
use Cms\Classes\ComponentBase;
use Responsiv\Angular\Classes\PageScript;
use Responsiv\Angular\Classes\ScopeBag;

/**
 * Angular Layout
 * 
 * Allocates a layout to work for angular.
 */
class Layout extends ComponentBase
{

    /**
     * @var array List of dependencies for the application module.
     */
    public $dependencies = ['ngRoute', 'ngAnimate', 'ngSanitize', 'ocServices'];

    /**
     * @var string A JavaScript array for each dependency.
     */
    public $dependencyString;

    /**
     * @var array Collection of pages that belong to this layout.
     */
    public $pages;

    /**
     * @var ScopeBag Controller scope variables.
     */
    public $scope;

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

    public function init()
    {
        $this->scope = $this->page['scope'] = new ScopeBag;
        // $this->addJs('assets/js/angular-bridge.js');
    }

    public function onRun()
    {
        $this->pages = $this->page['pages'] = Page::all();
        $this->dependencyString = $this->page['dependencyString'] = $this->getModuleDependencies();
    }

    public function onGetPageDependencies()
    {
        $response = [];
        $this->pageCycle();

        /*
         * Add the front-end controller, if available.
         */
        $page = array_get($this->page['this'], 'page');
        $pageScript = PageScript::fromTemplate($page);

        if ($scriptPath = $pageScript->getPublicPath())
            $this->addJs($scriptPath.'?v='.$page->mtime);

        /*
         * Detect assets
         */
        if ($this->controller->hasAssetsDefined()) {
            $response['X_OCTOBER_ASSETS'] = $this->controller->getAssetPaths();
        }

        $response['scope'] = $this->scope;

        return $response;
    }

    public function addModuleDependency($name)
    {
        if (in_array($name, $this->dependencies))
            return false;

        $this->dependencies[] = $name;
        return true;
    }

    public function getModuleDependencies()
    {
        return "['".implode("', '", $this->dependencies)."']";
    }

}