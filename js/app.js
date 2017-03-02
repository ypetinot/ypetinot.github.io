/* simonMenuiserie Core v.0.1 */
'use strict';

var applicationName = 'simonMenuiserieApp';

function SpecialTab() {
    return {
	restrict: 'A',
	controller: function ($scope) {
	    console.log('Special tab ctrl, runs on start.');
	    $scope.hello = 'hello from special tab controller';
	}
    }
}

(function () {
    
    /* register the modules that will be used in our application */
    var app = angular.module( applicationName,
			      [
				  'firebase',
				  'simonMenuiserie.Service',
				  'simonMenuiserie.Core',
				  'simonMenuiserie.UX',
				  'simonMenuiserie.controller',
				  'ngAnimate',
				  'ngMaterial',
				  'vcRecaptcha'
			      ]
			    ).directive('sepecialTab', SpecialTab);
    
    // TODO - remove private network domain from list of OAuth domains
/*
    app.controller("authenticationController", function($scope, $firebaseAuth) {
	var auth = $firebaseAuth();
	
	// login with Google
	auth.$signInWithPopup("google").then(function(firebaseUser) {
	    console.log("Signed in as:", firebaseUser.uid);
	}).catch(function(error) {
	    console.log("Authentication failed:", error);
	});
	
    });
*/

    app.run(function ($rootScope, $timeout) {
	$rootScope.$on('$viewContentLoaded', function() {
	    $timeout(function () {
		// http://stackoverflow.com/questions/31278781/material-design-lite-integration-with-angularjs
		componentHandler.upgradeAllRegistered();
	    })
	})
    });

})();
