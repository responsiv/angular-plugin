# Angular Plugin

Tools useful for creating websties with AngularJS and OctoberCMS.

## High level design consideration

Angular is an excellent front-end framework for building Single Page Applications (SPAs) and is also fantastic as a templating engine that binds HTML and JavaScript together. With this plugin you can do the following:

- Create a complete Single Page Application (SPA).
- Create AJAX-enabled sections of the website that behave like SPA (AJAX sections).
- Leverage AngularJS for your front-end templating.

When using this plugin in October, the page layout acts as the entry page. This allows a website to act as **multiple SPAs** and also as a traditional website. A complete SPA website should use just one layout, whereas a hybrid website could use a layout for each AJAX section along with layouts for the traditional pages. See the Layout component definition below for a technical overview of this approach.

## Templating

It is important to note that Angular's templating engine conflicts with October's Twig engine, although the syntax is pleasingly similar. To work around this use `{% verbatim %}` and `{% endverbatim %}` to wrap your Angular code.

    <p>Hello {{ name }}, this is parsed by Twig</p>

    {% verbatim %}
        <p>Hello {{ name }}, this is parsed by Angular</p>
    {% endverbatim %}

## The $request service|provider

By injecting the `$request` dependancy in to your Angular controller, you can access to October's AJAX framework.

    function ($scope, $request) {
        $scope.customers = $request('onGetCustomers')
    }

In almost all cases the AJAX function should return a JSON object or array for use in JavaScript.

    function onGetCustomers()
    {
        return Customers::all()->toJson();
    }

## Layout component

The Layout component should be attached to a layout, it is not recommended to attach it to pages. This allocates the layout as having the intended use of being a single-page-application (SPA). The Angular route table will be comprised of all pages that belong to the layout.

It should define a master page that will act as the primary HTML template and should contain will have the **ng-view** declaration inside. The master page should use a base url, all other pages that use the layout must be prefixed with this url. So if the master page URL is `/submit` then all other pages must have a url that starts with `/submit`, for example, `/submit/step1`.

When the component is rendered, it will define a JavaScript object using the same name of the component alias, this defaults to `appLayout`. It will also generate a route table for all the pages that are assigned to the layout.

#### Example structure

Here is an example file structure:

    layouts/
        submit.htm  <== description: Submission process

    pages/
        start.htm    <== url: /submit, layout: submit
        step1.htm     <== url: /submit/step1, layout: submit
        step2.htm     <== url: /submit/step2, layout: submit
        finish.htm    <== url: /submit/finish, layout: submit

Here is an example of the layouts/submit.htm contents:

    description: Submission process

    [appLayout]
    masterPage = "submit"
    ==
    <html ng-app="appLayout">
    <head>
        [...]
    </head>
    <body>
        <ng-view></ng-view>

        {% component 'appLayout' %}
    </body>
    </html>

In this example the Layout component is attached to the **layouts/submit.htm** layout with the master page being set to **pages/start.htm**. The component will render a route table similar to this:

    var appLayout = angular.module('appLayout', ['ngRoute'])

    appLayout.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/submit', { templateUrl: 'submit', controller: '...' });
        $routeProvider.when('/submit/step1', { templateUrl: 'submit/step1', controller: '...' });
        $routeProvider.when('/submit/step2', { templateUrl: 'submit/step2', controller: '...' });
        $routeProvider.when('/submit/finish', { templateUrl: 'submit/finish', controller: '...' });
        $routeProvider.otherwise({ redirectTo: '/submit' });
    })

> **Note:** When angular accesses the **templateUrl**, October will automatically provide the Page content without the Layout.

## Page controllers

Each page is extended to include a **Script** tab inside the CMS that is defined as an anonymous function.

    function ($scope) {
        //
        // Page logic
        //
    }

This translates to

    october.controllers['page/filename'] = function($scope) { ... }

