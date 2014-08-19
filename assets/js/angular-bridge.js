/* ========================================================================
 * October CMS: AngularJS bridge script
 * http://octobercms.com
 * ========================================================================
 * Copyright 2014 Alexey Bobkov, Samuel Georges
 *
 * ======================================================================== */

if (typeof angular == 'undefined')
    throw new Error('The AngularJS library is not loaded. The October-Angular bridge cannot be initialized.');

+function (angular, window) { "use strict";

    var OctoberAngular = function() {

        var o = {

            app: null,

            controllers: {},

            assets: {},

            bootApp: function (app) {
                o.app = app
            },

            //
            // This function will load the assets for a page, including the controller
            // script and execute onComplete function once everything is good to go.
            //
            loadPage: function (baseFilename, onComplete){
                // This function should:
                // - Load X_OCTOBER_ASSETS definition
                // - Definition should include the page controller function,
                //   eg: /themes/website/assets/js/controllers/page-filename.js
                // - Keep an array of Stylesheet elements used

                // The appending of the assets should be recorded by the page-id
                // so they can be removed from the DOM (stylesheets, JS, etc)

                setTimeout(function(){
                    o.app.register.controller(baseFilename, o.controllers[baseFilename])
                    onComplete()
                }, 2000)
            }

            // leavePage: function (baseFilename) {

            //     // This function should:
            //     // - Remove all Stylesheet elements from the page

            // }

        }

        return o
    }

    window.ocNg = new OctoberAngular

}(angular, window);



/*
 * October-Angular Services
 */

+function (angular, october) { "use strict";

    var services = angular.module('ocServices', [])

    /*
     * AJAX framework
     */
    services.service('$request', function(){
        return function(handler, option) {

            // return $.request(handler, option)
            return handler + "name"
        }
    })

    /*
     * CMS Router
     */
    services.provider('$cmsRouter', function () {

        this.$get = function () {
            return this
        }

        this.routeConfig = function () {
            var viewsDirectory = '/app/views/',
                controllersDirectory = '/app/controllers/',

            setBaseDirectories = function (viewsDir, controllersDir) {
                viewsDirectory = viewsDir;
                controllersDirectory = controllersDir;
            },

            getViewsDirectory = function () {
                return viewsDirectory;
            },

            getControllersDirectory = function () {
                return controllersDirectory;
            }

            return {
                setBaseDirectories: setBaseDirectories,
                getControllersDirectory: getControllersDirectory,
                getViewsDirectory: getViewsDirectory
            }
        }()

        this.route = function (routeConfig) {

            var resolve = function (baseName, url) {
                var routeDef = {};
                routeDef.templateUrl = function(params) { return makeTemplateUrl(url, params) }
                routeDef.controller = baseName
                routeDef.resolve = {
                    load: ['$q', '$rootScope', function ($q, $rootScope) {
                        return resolveDependencies($q, $rootScope, baseName);
                    }]
                };

                return routeDef;
            },

            resolveDependencies = function ($q, $rootScope, baseName) {
                var defer = $q.defer()

                october.loadPage(baseName, function(){
                    defer.resolve()
                    $rootScope.$apply()
                })

                return defer.promise;
            },

            makeTemplateUrl = function (url, params) {
                // This function should apply the parameters
                // values to the URL string
                // url "/blog/:postId"
                // params { postId: 7}
                // returns "/blog/7"
                // 

                return url + '?ng-page'
            }

            return {
                resolve: resolve
            }
        }(this.routeConfig)

    })

}(angular, window.ocNg);


/*
 * Asset Manager
 *
 * Usage: assetManager.load({ css:[], js:[], img:[] }, onLoadedCallback)
 */

AssetManager = function() {

    var o = {

        load: function(collection, callback) {
            var jsList = (collection.js) ? collection.js : [],
                cssList = (collection.css) ? collection.css : [],
                imgList = (collection.img) ? collection.img : []

            jsList = $.grep(jsList, function(item){
                return $('head script[src="'+item+'"]').length == 0
            })

            cssList = $.grep(cssList, function(item){
                return $('head link[href="'+item+'"]').length == 0
            })

            var cssCounter = 0,
                jsLoaded = false,
                imgLoaded = false

            if (jsList.length === 0 && cssList.length === 0 && imgList.length === 0) {
                callback && callback()
                return
            }

            o.loadJavaScript(jsList, function(){
                jsLoaded = true
                checkLoaded()
            })

            $.each(cssList, function(index, source){
                o.loadStyleSheet(source, function(){
                    cssCounter++
                    checkLoaded()
                })
            })

            o.loadImage(imgList, function(){
                imgLoaded = true
                checkLoaded()
            })

            function checkLoaded() {
                if (!imgLoaded)
                    return false

                if (!jsLoaded)
                    return false

                if (cssCounter < cssList.length)
                    return false

                callback && callback()
            }
        },

        /*
         * Loads StyleSheet files
         */
        loadStyleSheet: function(source, callback) {
            var cssElement = document.createElement('link')

            cssElement.setAttribute('rel', 'stylesheet')
            cssElement.setAttribute('type', 'text/css')
            cssElement.setAttribute('href', source)
            cssElement.addEventListener('load', callback, false)

            if (typeof cssElement != 'undefined') {
                document.getElementsByTagName('head')[0].appendChild(cssElement)
            }

            return cssElement
        },

        /*
         * Loads JavaScript files in sequence
         */
        loadJavaScript: function(sources, callback) {
            if (sources.length <= 0)
                return callback()

            var source = sources.shift(),
                jsElement = document.createElement('script');

            jsElement.setAttribute('type', 'text/javascript')
            jsElement.setAttribute('src', source)
            jsElement.addEventListener('load', function() {
                o.loadJavaScript(sources, callback)
            }, false)

            if (typeof jsElement != 'undefined') {
                document.getElementsByTagName('head')[0].appendChild(jsElement)
            }
        },

        /*
         * Loads Image files
         */
        loadImage: function(sources, callback) {
            if (sources.length <= 0)
                return callback()

            var loaded = 0
            $.each(sources, function(index, source){
                var img = new Image()
                img.onload = function() {
                    if (++loaded == sources.length && callback)
                        callback()
                }
                img.src = source
            })
        }

    };

    return o;
};

assetManager = new AssetManager();

/*
 * Inverse Click Event
 *
 * Calls the handler function if the user has clicked outside the object 
 * and not on any of the elements in the exception list.
 */

 $.fn.extend({
    clickOutside: function(handler, exceptions) {
        var $this = this;

        $('body').on('click', function(event) {
            if (exceptions && $.inArray(event.target, exceptions) > -1) {
                return;
            } else if ($.contains($this[0], event.target)) {
                return;
            } else {
                handler(event, $this);
            }
        });

        return this;
    }
})
