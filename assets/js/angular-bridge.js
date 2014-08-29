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

            useStripeLoadIndicator: true,

            bootApp: function (app) {
                o.app = app

                app.run(['$rootScope','$location', '$routeParams', function($rootScope, $location, $routeParams) {

                    $rootScope.$on('$routeChangeSuccess', function(e, current, pre) {
                        console.log('Current route name: ' + $location.path());
                    })

                    /*
                     * Loading indicator
                     */
                    $rootScope.$on('$routeChangeSuccess', function(e, current, pre) {
                        if (o.useStripeLoadIndicator && jQuery.oc.stripeLoadIndicator !== undefined)
                            jQuery.oc.stripeLoadIndicator.hide()
                    })
                    $rootScope.$on('$routeChangeStart', function(e, current, pre) {
                        if (o.useStripeLoadIndicator && jQuery.oc.stripeLoadIndicator !== undefined)
                            jQuery.oc.stripeLoadIndicator.show()
                    })

                }])
            },

            //
            // This function will load the assets for a page, including the controller
            // script and execute onComplete function once everything is good to go.
            //
            loadPage: function (baseFilename, url, params, onComplete){
                var options = {}
                options.url = url
                options.data = {
                    X_OCTOBER_NG_PARAMS: params
                }
                options.success = function(data) {
                    this.success(data).done(function(){
                        if (!o.controllers[baseFilename])
                            o.controllers[baseFilename] = function(){}

                        o.app.register.controller(baseFilename, o.controllers[baseFilename])
                        onComplete(data)
                    })
                }

                $.request('onGetPageDependencies', options)
            }

        }

        return o
    }

    window.october = new OctoberAngular

}(angular, window);

/*
 * October-Angular Services
 */

+function (angular, october) { "use strict";

    var services = angular.module('ocServices', [])

    /*
     * AJAX framework
     */
    services.service('$request', ['$rootScope', '$route', function($rootScope, $route){
        return function(handler, option) {

            var requestOptions = {
                url: $route.current.loadedTemplateUrl,
                data: {
                    X_OCTOBER_NG_PARAMS: $route.current.params
                }
            }

            /*
             * Short hand call
             */
            if (typeof option == 'function') {
                return $.request(handler, requestOptions).done(function(data, textStatus, jqXHR){
                    var singularData = data.result  ? data.result : data
                    option(singularData, data, textStatus, jqXHR)
                    $rootScope.$apply()
                })
            }

            /*
             * Standard call
             */
            return $.request(handler, $.extend(true, requestOptions, option)).done(function(){
                // Make lowest priority
                setTimeout(function(){ $rootScope.$apply() }, 0)
            })
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
     * CMS Router
     */
    services.provider('$cmsRouter', function () {

        this.$get = function () {
            return this
        }

        this.routeConfig = function () {
            var baseUrl = '/',
                routeMap = [],

            setBaseUrl = function (url) {
                baseUrl = url
            },

            getBaseUrl = function () {
                return baseUrl
            },

            mapPage = function(pageName, routePattern, viewUrl) {
                routeMap.push({
                    name: pageName,
                    pattern: routePattern,
                    view: viewUrl
                })
            },

            getPageName = function(routePattern) {
                return fetchValueWhere('name', 'pattern', routePattern)
            },

            getPageView = function(pageName) {
                return fetchValueWhere('view', 'name', pageName)
            },

            getPagePattern = function(pageName) {
                return fetchValueWhere('pattern', 'name', pageName)
            },

            fetchValueWhere = function(fetch, key, value) {
                var count = routeMap.length
                for (var i = 0; i < count; ++i) {
                    if (routeMap[i][key] == value)
                        return routeMap[i][fetch]
                }

                return null
            }

            return {
                setBaseUrl: setBaseUrl,
                getBaseUrl: getBaseUrl,
                mapPage: mapPage,
                getPageName: getPageName,
                getPageView: getPageView,
                getPagePattern: getPagePattern
            }
        }()


        this.route = function (routeConfig, helper) {

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

                october.loadPage(baseName, url, params, function(data){
                    defer.resolve()
                    $rootScope.$apply(function($scope){
                        $scope = angular.extend($scope, angular.copy(data.scope))
                    })
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

}(angular, window.october);


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
