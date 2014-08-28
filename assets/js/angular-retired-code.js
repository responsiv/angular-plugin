/*
 * This is code that could be useful in future but is not
 * included in the name of K.I.S.S.
 */

    /*
     * Filters
     */
    services.filter('page', function($cmsRouter){
        return function (input, params, routePersistence) {
            return $cmsRouter.route.pageUrl(input, params);
        }
    })

    /*
     * Blocks
     */
    services.service('$cmsBlocks', function($rootScope, $compile, $animate){

        var o = {}

        o.names = []
        o.map = {}
        o.puts = {}

        o.put = function (name, element) {
            o.puts[name] = element

            if (o.map[name] !== undefined)
                o.replaceContent(o.map[name], element, name)
        }

        o.placeholder = function (name, element) {
            o.names.push(name)
            o.map[name] = element

            if (o.puts[name] !== undefined)
                o.replaceContent(element, o.puts[name], name)
        }

        o.replaceContent = function($element, src, name) {
            var clone = $element.clone().html(src.html()).removeClass('ng-leave')
            $compile(clone.contents())($rootScope)

            $animate.enter(clone, null, $element);
            $animate.leave($element)
            o.map[name] = clone

            $rootScope.$emit('$cmsBlocksReplceContent', name)
        }

        $rootScope.$on('$routeChangeSuccess', function(){
            o.puts = {}
            for (var i = 0; i < o.names.length; ++i) {
                var name = o.names[i]
                if (o.map[name] !== undefined) {
                    var $element = o.map[name],
                        clone = $element.clone().empty().removeClass('ng-leave')

                    $element.after(clone)
                    $animate.leave($element)
                    o.map[name] = clone
                }
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
     * CMS Router
     */
    services.provider('$cmsRouter', function () {


        this.helper = function (routeConfig) {

            var normalizeUrl = function(url) {
                if (url.substring(0, 1) != '/')
                    url = '/' + url

                if (url.substring(-1) == '/')
                    url = url.substring(0, -1)

                if (!url)
                    url = '/'

                return url
            },

            segmentizeUrl = function(url) {
                url = normalizeUrl(url)
                var parts = url.split('/'),
                    result = []

                angular.forEach(parts, function(segment){
                    if (segment)
                        result.push(segment)
                })

                return result
            },

            getParamName = function(segment) {
                var name = segment.substring(1),
                    optMarkerPos = name.indexOf('?'),
                    regexMarkerPos = name.indexOf('|')

                if (optMarkerPos != -1 && regexMarkerPos != -1) {
                    if (optMarkerPos < regexMarkerPos)
                        return name.substring(0, optMarkerPos)
                    else
                        return name.substring(0, regexMarkerPos)
                }

                if (optMarkerPos != -1)
                    return name.substring(0, optMarkerPos)

                if (regexMarkerPos != -1)
                    return name.substring(0, regexMarkerPos)

                return name
            },

            segmentIsOptional = function(segment) {
                var name = segment.substring(1),
                    optMarkerPos = name.indexOf('?'),
                    regexMarkerPos = name.indexOf('|')

                if (optMarkerPos == -1)
                    return false

                if (regexMarkerPos == -1)
                    return false

                if (optMarkerPos != -1 && regexMarkerPos != -1)
                    return optMarkerPos < regexMarkerPos

                return false
            },

            getSegmentDefaultValue = function(segment) {
                var name = segment.substring(1),
                    optMarkerPos = name.indexOf('?'),
                    regexMarkerPos = name.indexOf('|'),
                    value = false

                if (optMarkerPos == -1)
                    return false

                if (regexMarkerPos != -1)
                    value = segment.substring(optMarkerPos + 1, regexMarkerPos - optMarkerPos - 1)
                else
                    value = segment.substring(optMarkerPos + 1)

                return value ? value : false
            },

            urlFromPattern = function (pattern, params) {
                var url = [],
                    cleanParams = {},
                    segments = segmentizeUrl(pattern),
                    segmentCount = segments.length,
                    params = params ? params : {},
                    paramCount = params.length

                angular.forEach(params, function(value, param) {
                    var newValue = (param.charAt(0) == ':')
                        ? param.substring(1)
                        : param

                    cleanParams[param] = value
                })

                params = cleanParams

                angular.forEach(segments, function(segment, index){
                    if (segment.charAt(0) != ':') {
                        url.push(segment)
                    }
                    else {
                        var paramName = getParamName(segment),
                            optional = segmentIsOptional(segment)

                        if (params[paramName]) {
                            url.push(params[paramName])
                        }
                        else if (optional) {
                            url.push(getSegmentDefaultValue(segment))
                        }
                        else {
                            url.push('default')
                        }
                    }
                })

                var lastPopulatedIndex = 0
                angular.forEach(url, function(segment, index) {
                    if (segment)
                        lastPopulatedIndex = index
                    else
                        url[index] = 'default'
                })
                url = url.slice(0, lastPopulatedIndex + 1)

                return normalizeUrl(url.join('/'))
            }

            return {
                urlFromPattern: urlFromPattern
            }

        }(this.routeConfig)

        this.route = function (routeConfig, helper) {

            pageUrl = function(name, params) {
                var pattern = routeConfig.getPagePattern(name),
                    url = helper.urlFromPattern(pattern, params)

                return routeConfig.getBaseUrl() + url
            }

            return {
                pageUrl: pageUrl
            }
        }(this.routeConfig, this.helper)


    })

