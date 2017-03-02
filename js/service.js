/* simonMenuiserie Services v.0.1 */
'use strict';

function getCurrentUserId() {
    var firebase_user = firebase.auth().currentUser;
    return firebase_user ? firebase_user.uid : null;
}

(function () {

    // Creation of module with its depends
    var thisModule = angular.module('simonMenuiserie.Service', []);

    function getCurrentUserDataRoot ( menuiserieEnv ) {

	var user_database_path_root = [ 'users' , menuiserieEnv.getMenuiserieKey() , getCurrentUserId() ].join( '/' );
	return firebase.database().ref( user_database_path_root );
	
    }

    // TODO : should this go back inside webService's definition ?
    function getCurrentUserProfileData ( menuiserieEnv , profile_data_base = null ) {
	
	var userId = menuiserieEnv.currentUserID;
	
	if ( profile_data_base == null ) {
	    profile_data_base = firebase.database().ref('user/' + menuiserieEnv.getMenuiserieKey() ).once('value');
	}
	
	var profile_data = $.extend( { userId : userId } , profile_data_base );
	return { data : profile_data };
	
    }
    
    //#region webService
    function webService($http, $location, menuiserieEnv) {

        var _baseSvc = config.databaseURL + '/';

        return {

	    // TODO : can we do better ?
	    getCurrentUserProfileData: function ( profile_data_base = null )  {
		return getCurrentUserProfileData ( menuiserieEnv , profile_data_base );		
	    },
	    
            // Get service url concatenating base-svc and s parameters
            getServiceUrl: function (s) { return _baseSvc + s },

	    // TODO : introduce an additional path component so that only one rule is needed to control access to the part of the database storing non-user-specific resources
	    getDatabaseUrl: function ( domain , id = null ) {

		var path_elements = [ domain , menuiserieEnv.getMenuiserieKey() ];
		if ( id != null ) {
		    path_elements.push( id );
		}

		return this.getServiceUrl( path_elements.join( '/' ) ) + '.json';
		
	    },
	    
            // Get texture according its id
            getTexture: function (id) {
                return $http.get( this.getDatabaseUrl( 'textures' , id ) );
            },

            // Get 3D materials according its id
            get3DMaterial: function (id) {
                return $http.get( this.getDatabaseUrl( '3dmaterials' , id ) );
            },

            // Get mesh according its id
            getMesh: function (id) {
                return $http.get(_baseSvc + "meshes/" + menuiserieEnv.getMenuiserieKey() + "/" + id);
            },

            // Get all panel colours for current brand
            getColours: function () {
                return $http.get( this.getDatabaseUrl( 'colours' ) );
            },

            // Get all thicnkess for current brand
            getPanels: function () {
                return $http.get( this.getDatabaseUrl( 'panels' ) );
            },

            // Get all panel materials for current brand
            getThicks: function () {
                return $http.get( this.getDatabaseUrl( 'thicks' ) );
            },

            // Get all back-panel materials for current brand
            getBackPanels: function () {
                return $http.get( this.getDatabaseUrl( 'backpanels' ) );
            },

            // Get all drawer facades materials for current brand
            getDrawerFacades: function () {
                return $http.get( this.getDatabaseUrl( 'drawerfacades' ) );
            },

            // Get all drawer facades groups model for current brand
            getDrawerGroups: function () {
                return $http.get( this.getDatabaseUrl( 'drawergroups' ) );
            },

            // Get all accessories models for current brand
            getAccessories: function () {
                return $http.get( this.getDatabaseUrl( 'accessories' ) );
            },

            // Get all hanging-bars models for current brand
            getHangingBars: function () {
                return $http.get( this.getDatabaseUrl( 'hangingbars' ) );
            },

            // Get eco-taxes
            getEcoTaxes: function() {
                return $http.get( this.getDatabaseUrl( 'ecotaxes' ) );
            },

            // Get the configurator options
            getConfigurator: function () {

		var configuration;

		// Note : not sure this needs to be user-dependent
/*		
		if (user != null) {

		    //return $http.get(_baseSvc + "configurator/" + menuiserieEnv.getMenuiserieKey() + "/" + menuiserieEnv.getMenuiserieUmbPageNodeId());
		    //angular.fromJson(
		    configuration = firebase.database().ref('user/' + menuiserieEnv.getMenuiserieKey() + '/configuration/' + menuiserieEnv.getMenuiserieUmbPageNodeId()).once('value');
		    
		}
		else {
*/		    
		    configuration = new Promise(
			function( resolve , reject ) {
			    var configuration_response = { data :
							   {
							       Id: 2,
							       BrandId: 2,
							       UmbConfiguratorNodeId: 1118,
							       HomeUrl: "http://simon-menuiserie.fr",
							       DefaultWidth: 150,
							       DefaultHeight: 200,
							       DefaultDepth: 50,
							       DefaultColourId: 9,
							       DefaultMaterialId: 4,
							       FreeAccessAllowed: true,
							       PriceDisplayMode: 2,
							       HasOrderRedirection: true,
							       CanAddItem: true,
							       HelpUrl: "",
							       UmbLogoId: 1149,
							       UmbDesktopBgId: 0,
							       PrimaryColor: "231f20 ",
							       BtnClrAutoZone: "3f51b5 ",
							       BtnClrFreeZone: "3f51b5 ",
							       BtnClrDivideZone: "3f51b5 ",
							       BtnClrUndivideZone: "f44336 ",
							       BtnClrOrder: "4caf50 ",
							       WorkPanelColor: "bfbfc0 ",
							       ZoneColor: "6fb8d7 ",
							       ZoneSelectionColor: "ffffff ",
							       GridColor: "cac9ca ",
							       GroundTextureId: 6,
							       GroundGridSize: 600,
							       GroundGridStep: 30,
							       Brand: {
								   Title: "Simon Menuiserie",
								   VATRate: 20
							       }
							   }
							 };
			    resolve( configuration_response );
			}
		    );
/*		
		}
*/

		return configuration;
		
            },

            // Make customer identification
            login: function (menuiserieKey, email, password, useSSL) {

                //if (useSSL)
                //    return $http.post(_getHttpsBaseSvc() + "login", { MenuiserieKey: menuiserieKey, Email: email, Password: password });
                //else
                /* original => return $http.post(_baseSvc + "login", { MenuiserieKey: menuiserieKey, Email: email, Password: password }); */

		return new Promise( function( resolve , reject ) {

		    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			console.warn( errorMessage );
			reject( { data : errorMessage } );
		    });

		    resolve( getCurrentUserProfileData( menuiserieEnv ) );

		});
		    
            },

            // Sign out customer
            logout: function () {
                return firebase.auth().signOut();
		//$http.post(_baseSvc + "logout");
	    },

            // Register customer
            register: function (confId, firstName, lastName, email, reCaptchaResponse) {

		return new Promise( function( resolve , reject ) {

		    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			reject( { data : error } );
		    });

		    var user = firebase.auth().currentUser;
		    
		    resolve(
			getCurrentUserProfileData( menuiserieEnv ,
			    { MenuiserieKey: menuiserieEnv.getMenuiserieKey(), ConfiguratorId: confId, FirstName: firstName, LastName: lastName, Email: email, reCaptchaResponse: reCaptchaResponse })
		    );
		
//$http.post(_baseSvc + "registermember", { MenuiserieKey: menuiserieEnv.getMenuiserieKey(), ConfiguratorId: confId, FirstName: firstName, LastName: lastName, Email: email, reCaptchaResponse: reCaptchaResponse

		});
		    
            },

            // Check member authentication
            isAuthenticate: function () {
		return new Promise( function( resolve , reject ) {
		    var user = firebase.auth().currentUser;
		    resolve( { data : ( user == null ) ? 'false' : 'true' } );
		});
            },

            // Reset password member
            resetPassword: function (email) {
                return $http.post(_baseSvc + "resetpasswordmember", { MenuiserieKey: menuiserieEnv.getMenuiserieKey(), ConfiguratorId: 0, FirstName: null, LastName: null, Email: email });
            },

            // Save project
            saveProject: function(closetModelId, shopId, id, title, price, ecoTax, vatRate, weight, jsonData, imgDataUrl, addons) {

		// Note : seems necessary to emulate project id generation if the project id is equal to 0
		
		// TODO : is it necessary to check whether the user is currently logged in ? => move this check to getCurrentUserId ?
		
		// TODO : reconcile with getDatabaseUrl
		var project_record = {
                    MenuiserieKey: menuiserieEnv.getMenuiserieKey(),
                    ShopId: shopId,
                    Id: id,
                    Title: title,
                    Price: price,
                    EcoTax: ecoTax,
                    VATRate: vatRate,
                    Weight: weight,
                    ClosetModelId: closetModelId,
                    JsonData: angular.toJson(jsonData),
                    ImgDataUrl: imgDataUrl,
                    Addons: addons
                };

		var projects_database_path_root = [ 'users' , menuiserieEnv.getMenuiserieKey() , getCurrentUserId() , 'projects' ].join( '/' );
		var projects_database_path_root_reference = firebase.database().ref( projects_database_path_root );
		
		if ( id == 0 ) {
		    //var push_response = projects_database_path_root_reference.push( project_record );
		    //project_record.Id = push_response.key;
		    project_record.Id = title;
		}
		
		var project_database_path = [ projects_database_path_root , project_record.Id ].join( '/' );
		var project_database_path_reference = firebase.database().ref( project_database_path );

		// in all cases we set/overwrite the entry corresponding to the provided project title
		project_database_path_reference.set( project_record );
		
		return new Promise( function( resolve , reject ) {
		    var project_entry = project_database_path_reference.once('value');
		    // TODO : account for possible failures
		    resolve( { data : project_record } );		    
		} );
		
            },

            // Save project image
            saveProjectImg: function (id, dataUrl) {
                return $http.post(_baseSvc + "saveprojectimage", { MenuiserieKey: menuiserieEnv.getMenuiserieKey(), ProjectId: id, DataUrl: dataUrl });
            },

            // Open project
            openProject: function(id) {
                return $http.get(_baseSvc + "openproject/" + menuiserieEnv.getMenuiserieKey() + "/" + id);
            },

            // Get my projects
            getMyProjects: function() {
		// TODO : can we avoid code redundancy with getServiceUrl ?
		return $http.get( [ getCurrentUserDataRoot( menuiserieEnv ) , 'projects' ].join( '/' ) + '.json' );
            },

            // Delete a project
            deleteProject: function (id) {
                return $http.get(_baseSvc + "deleteproject/" + menuiserieEnv.getMenuiserieKey() + "/" + id);
            },

            // Get the shops of brand
            getShops: function () {
                return $http.get( this.getDatabaseUrl( 'shops' ) );
            },

            // Get the shop by id
            getShop: function (shopId) {
                return $http.get(_baseSvc + "shop/" + menuiserieEnv.getMenuiserieKey() + "/" + shopId);
            },

            // addoncategories
            getAddonCategories: function() {
                return $http.get(_baseSvc + "addoncategories/" + menuiserieEnv.getMenuiserieKey());
            },

            // Get the addon collection
            getAddons: function (categoryId) {
                if (categoryId && categoryId > 0)
                    return $http.get(_baseSvc + "addonsbycategory/" + menuiserieEnv.getMenuiserieKey() + "/" + categoryId);                   
                else
                    return $http.get(_baseSvc + "addons/" + menuiserieEnv.getMenuiserieKey());
            },

            // Get closet model. If closet model id is null, return the default closet model of brand.
            getClosetModel: function (closetModelId) {
                if (closetModelId)
                    return $http.get( this.getDatabaseUrl( 'closetmodel' , closetModelId ) );
                else
                    return $http.get( this.getDatabaseUrl( 'closetmodel' ) );
            },

            // Save closet model
            saveClosetModel: function (id, jsonData) {
                return $http.post(_baseSvc + "saveclosetmodel", { MenuiserieKey: menuiserieEnv.getMenuiserieKey(), Id: id, JsonData: angular.toJson(jsonData) });
            },

            // Get Order redirection service url
            getOrderRedirectionSvcUrl: function(projectId) {
                return _baseSvc + "RedirectProjectOrder/" + menuiserieEnv.getMenuiserieKey() + "/" + projectId;
            }

        }

    }

    //registration
    thisModule.factory('menuiserieWebService', [
        "$http",
        "$location",
        "menuiserieEnv",
        webService
    ]);
    //#endregion

})();
