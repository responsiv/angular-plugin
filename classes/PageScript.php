<?php namespace Responsiv\Angular\Classes;

use File;
use Cms\Classes\Theme;

/**
 * Helper for the Script tab via Page CmsObject
 */
class PageScript
{

    const JS_OBJECT = 'october';

    protected $template;

    public function __construct($template)
    {
        $this->template = $template;
    }

    public static function fromTemplate($template)
    {
        return new static($template);
    }

    /**
     * Populate the template object with the script attribute
     * @return void
     */
    public function populate()
    {
        if (strlen($this->template->script))
            return;

        $this->template->script = $this->readTemplateScript();
    }

    /**
     * Save script content against a template, if the content does
     * not differ from the default, nothing is saved.
     * @param  string $content
     * @return void
     */
    public function save($content)
    {
        if ($content == $this->getDefaultScriptContent())
            return;

        $this->writeTemplateScript($content);
    }

    /**
     * Returns the public path to the template script file.
     * @return string
     */
    public function getPublicPath()
    {
        $path = $this->getTemplateScriptPath();
        if (!File::isFile($path))
            return;

        return File::localToPublic($path);
    }

    protected function getTemplateScriptPath()
    {
        $theme = Theme::getEditTheme();
        $assetPath = $theme->getPath() . '/assets';
        $fileName = $this->template->getBaseFileName();

        $jsPath = $assetPath.'/javascript';
        if (!File::isDirectory($jsPath)) $jsPath = $assetPath.'/js';

        return $jsPath.'/controllers/'.$fileName.'.js';
    }

    protected function readTemplateScript()
    {
        $path = $this->getTemplateScriptPath();
        if (!File::isFile($path))
            return $this->getDefaultScriptContent();

        return $this->removeControllerDefinition(File::get($path));
    }

    protected function writeTemplateScript($content)
    {
        $path = $this->getTemplateScriptPath();
        $dir = dirname($path);
        if (!File::isDirectory($dir))
            File::makeDirectory($dir, 0755, true);

        File::put($path, $this->addControllerDefinition($content));
    }

    protected function getDefaultScriptContent()
    {
        return 'function ($scope, $request) {'.PHP_EOL.'}';
    }

    protected function removeControllerDefinition($content)
    {
        return preg_replace('#^([\s]*'.static::JS_OBJECT.'.controllers\[[^\]]+\][\s]*=[\s]*)#si', '', $content);
    }

    protected function addControllerDefinition($content)
    {
        return sprintf("%s.controllers['%s'] = ", static::JS_OBJECT, $this->template->getBaseFileName()) . $content;
    }

}