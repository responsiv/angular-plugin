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
