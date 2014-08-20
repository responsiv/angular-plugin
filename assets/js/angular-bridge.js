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
            loadPage: function (baseFilename, url, params, onComplete){
                // This function should:
                // - Load X_OCTOBER_ASSETS definition
                // - Definition should include the page controller function,
                //   eg: /themes/website/assets/js/controllers/page-filename.js
                // - Keep an array of Stylesheet elements used

                // The appending of the assets should be recorded by the page-id
                // so they can be removed from the DOM (stylesheets, JS, etc)

                var options = {}
                options.url = url
                options.success = function(data) {
                    this.success(data).done(function(){
                        if (!o.controllers[baseFilename])
                            o.controllers[baseFilename] = function(){}

                        o.app.register.controller(baseFilename, o.controllers[baseFilename])
                        onComplete()
                    })
                }

                $.request('onGetPageDependencies', options)
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
     * Blocks
     */
    services.service('$cmsBlocks', function($rootScope, $compile, $animate){

        var o = {}

        o.blocks = []
        o.map = {}
        o.puts = {}
        o.previousElement = null

        o.put = function (name, element) {
            o.puts[name] = element

            if (o.map[name] !== undefined)
                o.replaceContent(o.map[name], element)
        }

        o.placeholder = function (name, element) {
            o.blocks.push(element)
            o.map[name] = element

            if (o.puts[name] !== undefined)
                o.replaceContent(element, o.puts[name])
        }

        o.replaceContent = function($element, src) {
            if (o.previousElement) {
                $animate.leave(o.previousElement)
                o.previousElement = null
            }

            var clone = $element.clone().html(src.html())
            $compile(clone.contents())($rootScope)

            $animate.enter(clone, null, $element);
            o.previousElement = clone
        }

        $rootScope.$on('$routeChangeSuccess', function(){
            o.puts = {}
            for (var i = 0; i < o.blocks.length; ++i) {
                o.blocks[i].empty()
            }
        })

        return o
    })

    services.directive('ocPut', ['$cmsBlocks', function ($cmsBlocks) {
        return {
            link: function(scope, element, attr, controllers) {
                $cmsBlocks.put(attr.ocPut, element.clone())
                element.remove()
            }
        }
    }])

    services.directive('ocPlaceholder', ['$cmsBlocks', function ($cmsBlocks) {
        return {
            link: function(scope, element, attr, controllers) {
                $cmsBlocks.placeholder(attr.ocPlaceholder, element)
            }
        }
    }])

    /*
     * Partial loading
     */
    services.directive('ocPartial', [function () {
        return {
            link: function(scope, element, attr, controllers) {
                scope.partialUrl = '?ng-partial='+attr.ocPartial
            },
            transclude: true,
            template: '<div ng-include="partialUrl"></div>'
        }
    }])

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
            var pageViewMap = {},
                baseDirectory = '/',

            setBaseDirectory = function (baseDir) {
                baseDirectory = baseDir;
            },

            getBaseDirectory = function () {
                return baseDirectory;
            },

            mapPage = function(pageName, viewUrl) {
                pageViewMap[pageName] = viewUrl
            },

            getPageView = function(pageName) {
                return pageViewMap[pageName]
            }

            return {
                setBaseDirectory: setBaseDirectory,
                getBaseDirectory: getBaseDirectory,
                mapPage: mapPage,
                getPageView: getPageView
            }
        }()

        this.route = function (routeConfig) {

            var resolve = function (baseName) {
                var routeDef = {}

                routeDef.templateUrl = function(params) { return makeTemplateUrl(baseName, params) }
                routeDef.controller = baseName
                routeDef.resolve = {
                    load: ['$q', '$rootScope', '$route', function ($q, $rootScope, $route) {
                        return resolveDependencies($q, $rootScope, $route, baseName)
                    }]
                }

                return routeDef
            },

            resolveDependencies = function ($q, $rootScope, $route, baseName) {
                var url = routeConfig.getPageView(baseName),
                    params = $route.current.params,
                    defer = $q.defer()

                october.loadPage(baseName, url, params, function(){
                    defer.resolve()
                    $rootScope.$apply()
                })

                return defer.promise;
            },

            makeTemplateUrl = function (baseName, params) {
                var url = routeConfig.getPageView(baseName)
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
