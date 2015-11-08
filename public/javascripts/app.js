'use strict';

var treedoc = angular.module('treedoc', ['ngSanitize', 'ngRoute', 'treedocCtrls']);

JXON.config({
  valueKey: '_',                // default: 'keyValue'
  attrKey: '$',                 // default: 'keyAttributes'
  attrPrefix: '$',              // default: '@'
  lowerCaseTags: false,         // default: true
  trueIsEmpty: false,           // default: true
  autoDate: false,              // default: true
  ignorePrefixedNodes: false,   // default: true
  parseValues: false            // default: true
});

treedoc.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){

    $routeProvider.when(':path*', {
        templateUrl: '/public/main.html',
        controller: 'TreedocCtrl'
    });

    $locationProvider.html5Mode(true);
}])
.run(['$rootScope', '$http', '$location', function($rootScope, $http, $location){

    //Temporary title until the XML request finishes
    $rootScope.pageTitle = 'Treedoc';

    //Set up indexing
    $rootScope.docPath = [];
    $rootScope.items = [];

    //Number of valid backward requests valid
    $rootScope.backValid = 0;

    //Appends a new segment to the end of the path, adjusting for slashes
    $rootScope.appendPath = function(oldPath, newPath){
        if(oldPath.endsWith('/')){
            if(!newPath.startsWith('/')){
                return oldPath + newPath;
            }else{
                return oldPath + newPath.substring(1);
            }
        }else{
            if(newPath.startsWith('/')){
                return oldPath + newPath;
            }else{
                return oldPath + '/' + newPath;
            }
        }
    };

    //Gets the array of items contained within a subdocument
    //Also returns the index where the actual documents start, for determining
    //whether to render a given item
    $rootScope.getChildArray = function(doc){
        var carr = (doc.category) ? ((Array.isArray(doc.category)) ? doc.category : [doc.category]) : [];
        var iarr = (doc.item) ? ((Array.isArray(doc.item)) ? doc.item : [doc.item]) : [];
        return carr.concat(iarr);
    };

    $rootScope.getItemIndex = function(doc){
        return (doc.category) ? doc.category.length : 0;
    };

    $rootScope.updateData = function(){
        var topDoc = $rootScope.docPath[$rootScope.docPath.length - 1];
        var processor;
        if(topDoc.$format){
            switch(topDoc.$format){
                case 'html':
                    processor = function(data){ return data; };
                    break;
                case 'markdown':
                default:
                    processor = markdown.toHTML;
                    break;
            }
        }else{
            processor = markdown.toHTML;
        }
        if($rootScope.showingItem){
            //external file
            if(topDoc.$src){
                $http.get($rootScope.appendPath('/doc', topDoc.$src)).then(function(response){
                    $rootScope.itemData = processor(response.data);
                }, function(response){
                    $rootScope.error = 'Document doesn\'t exist: ' + topDoc.$src;
                });
            }else{
                var inject = (topDoc._) ? topDoc._ : topDoc;
                console.log(inject);
                $rootScope.itemData = processor(inject);
            }
        }else{
            if(topDoc._){
                $rootScope.items = $rootScope.getChildArray(topDoc._);
            }else{
                $rootScope.items = $rootScope.getChildArray(topDoc);
            }
        }
    };

    //Finds the current resource given the browser path
    //USE FOR NON-DEEP LINKED REQUESTS
    //THROWS: Exception if path doesn't exist
    $rootScope.fromPath = function(){
        delete $rootScope.error;
        //console.log('Full update');
        //If the document hasn't loaded, do nothing
        //INVARIANT: the first element in docPath is the root document
        $rootScope.showingItem = false;
        if($rootScope.docPath.length === 0) return;
        var path = $location.path().split('/');
        var doc = $rootScope.docPath[0];
        //The current document stripped of attributes:
        var rawdoc;
        $rootScope.docPath = [$rootScope.docPath[0]];
        var arr;
        var j;
        for(var i = 0; i < path.length; i++){
            //If 'doc' has attributes
            if(doc._){
                rawdoc = doc._;
            }else{
                rawdoc = doc;
            }
            if(path[i] === ''){
                //No data, ignore it
                continue;
            }else if(i !== path.length - 1){
                //Look for category
                arr = (rawdoc.category) ? rawdoc.category : [];
            }else{
                //Look through all children
                arr = $rootScope.getChildArray(rawdoc);
            }

            //Set it to the old document
            rawdoc = doc;

            //Flag indicating if a child was found
            var valid = false;
            for(j = 0; j < arr.length; j++){
                //If the id is set, check against the path with that
                if(arr[j].$id){
                    if(arr[j].$id === path[i]){
                        doc = arr[j];
                        $rootScope.docPath.push(doc);
                        valid = true;
                        break;
                    }
                }else if(arr[j].$name){
                    if(slug(arr[j].$name) === path[i]){
                        doc = arr[j];
                        $rootScope.docPath.push(doc);
                        valid = true;
                        break;
                    }
                }
            }
            if(!valid){
                $rootScope.error = 'Path doesn\'t exists: ' + path[i];
                return;
            }
            if(j >= $rootScope.getItemIndex(rawdoc)){
                $rootScope.showingItem = true;
            }else{
                $rootScope.showingItem = false;
            }
        }

        $rootScope.updateData();
    };

    //Updates the document stack based on a clicke
    //Should be used when navigating within the document (doesn't refresh the whole stack)
    $rootScope.clicked = function(index){
        delete $rootScope.error;
        //console.log('Clicked');
        //Tells the controller to use the current docPath
        $rootScope.localLink = true;
        $rootScope.showingItem = index >= $rootScope.getItemIndex($rootScope.docPath[$rootScope.docPath.length - 1]);
        var oldItems = $rootScope.items;
        var newItem = oldItems[index];
        //If it has attributes use the data instead
        $rootScope.docPath.push(newItem);
        if(newItem.$id){
            $location.path($rootScope.appendPath($location.path(), newItem.$id));
        }else{
            if(!newItem.$name){
                $rootScope.items = oldItems;
                $rootScope.docPath.pop();
                $rootScope.showingItem = false;
                $rootScope.error = 'Misformatted tag - missing \'name\'';
                return;
            }
            $location.path($rootScope.appendPath($location.path(), slug(newItem.$name)));
        }
        $rootScope.updateData();
    };

    //For going into the parent folder
    $rootScope.back = function(){
        delete $rootScope.error;
        //console.log('Back');
        $rootScope.docPath.pop();
        $rootScope.showingItem = false;
        $rootScope.updateData();
    };

    $rootScope.path = function(){
        var path = '';
        var cdoc;
        for(var i = 1; i < $rootScope.docPath.length; i++){
            cdoc = $rootScope.docPath[i];
            if(cdoc.$id){
                path += '/' + cdoc.$id;
            }else if(!cdoc.$name){
                $rootScope.error = 'Document is misformatted - missing category name';
            }else{
                path += '/' + slug(cdoc.$name);
            }
        }
    };

    //TODO change this (and controllers, and routing) to make more sense
    $rootScope.docLoaded = $http.get('/doc/treedoc.xml').then(function(response){
        //TODO ensure the <treedoc> node exists
        $rootScope.docPath = [JXON.stringToJs(response.data).treedoc];
        console.log($rootScope.docPath[0]);
        //TODO add validation in
        $rootScope.baseTitle = $rootScope.docPath[0].name;
        $rootScope.pageTitle = $rootScope.baseTitle;
    }, function(response){
        $rootScope.error = 'Treedoc doesn\'t exist';
    });
}]);

var treedocCtrls = angular.module('treedocCtrls', []);

treedocCtrls.controller('TreedocCtrl', ['$http', '$routeParams', '$rootScope',
            function($http, $routeParams, $rootScope){
    $rootScope.docLoaded.then(function(){
        //If the initial document hasn't been loaded (needs a full refresh)
        if(!$rootScope.loaded){
            $rootScope.fromPath();
            $rootScope.loaded = true;
            $rootScope.backValid = 0;
        }else if($rootScope.localLink){
            //already updated, just needs to reset flag indicating local link
            $rootScope.localLink = false;
            //Indicate the user can go back easily
            $rootScope.backValid += 1;
        }else{
            //If a simple back action is valid, go back
            if($rootScope.backValid > 0){
                $rootScope.back();
                $rootScope.backValid -= 1;
            }else{
                $rootScope.fromPath();
            }
        }
    });
}]);
