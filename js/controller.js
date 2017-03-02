/* simonMenuiserie Controllers v.0.1 */
'use strict';
(function () {

    // Creation of module with its depends
    var thisModule = angular.module('simonMenuiserie.controller', ['ngCookies','simonMenuiserie.Core', 'simonMenuiserie.UX']);

    var jQ = jQuery;  // jQuery shortcut

    //#region Engine Controller
    function engineController(
        $window,
        $scope,
        $log,
        $location,
        $timeout,
        $q,
        $cookies,
        menuiserieEnv,
        menuiserieUXFactory,
        menuiserieWebService,
        menuiserieDataFactory,
        menuiserieClosetFactory,
        menuiserieCompoundFactory,
        menuiseriePanelFactory,
        menuiserieProjectFactory,
        menuiserieZoneFactory,
        menuiserieSerializer,
        vcRecaptchaService) {

        //$scope.testMin = 1;
        //$scope.testMax = 200;

        var i;
        var menuiserieUXMgr;

        $scope.busyMsg = "Veuillez patentier ...";
        $scope.isBusy = true;
        $scope.canEditProject = true;
        $scope.freeAccessAllowed = false;
        $scope.confId = 0;
        $scope.currentClosetModel;
                
        $scope.closetWidth = 100;
        $scope.closetHeight = 100;
        $scope.closetDepth = 50;
        $scope.moduleCount = 1;

        $scope.showBgDialog = false;
        $scope.showLoginDialog = false;
        $scope.showBOMDialog = false;
        $scope.showSaveDialog = false;
        $scope.showProjectDialog = false;

        $scope.project;

        // Environment initialization
        menuiserieEnv.init({
            menuiserieKey: __menuiserieCtxt__.key,
            menuiserieUmbPageNodeId: __menuiserieCtxt__.umbPageNodeId,
            threeEnv: { sceneSelector: '.scene3d' }
        });
        
        // UX manager initialization
        menuiserieUXMgr = menuiserieUXFactory.initUXManager($scope, __menuiserieCtxt__.debug);

        // To avoid close window without saving
        window.onbeforeunload = function (event) {
            if (!$scope.isSaved) {
                var msg = "Si vous fermer cette page vous allez perdre toute vos modifications !";
                if (angular.isUndefined(event)) {
                    event = window.event;
                }
                if (event) {
                    event.returnValue = msg;
                }
                return msg;
            }
        }
        
        // Initialize closet compound and return it. Useful on project read.
        var initClosetCompound = function () {
            var C = $scope.project.getCompound();
            if (C) { // Hide all
                menuiserieUXMgr.hideTree(C.gzone);
                menuiserieUXMgr.hideTree(C.zone);
            }
            else { // Create compound
                C = menuiserieClosetFactory.createEmpty($scope.project, $scope.selectedColour, $scope.selectedMaterial);
            }
            return C;
        }

        // Load the closet model
        var loadClosetModel = function (closetModelId) {
            
            menuiserieWebService.getClosetModel(closetModelId).then(function (response) {
                var closetModel = response.data;

                //initClosetRules(closetModel);
                menuiserieUXMgr.setClosetModel(closetModel);

                if (closetModel.JsonData === '') { // Start new model

                    // Default closet dimension
                    $scope.closetWidth = (closetModel.MinClosetWidth + closetModel.MaxClosetWidth) / 2;
                    $scope.closetHeight = (closetModel.MinClosetHeight + closetModel.MaxClosetHeight) / 2;
                    $scope.closetDepth = (closetModel.MinClosetDepth + closetModel.MaxClosetDepth) / 2;

                    // Load selected coulour. Required because no read is done (JsonData are empty)
                    $scope.selectedColour.load().then(function () {
                        var compound = menuiserieClosetFactory.createFromModel(closetModel, $scope.project, $scope.closetWidth, $scope.closetHeight, $scope.closetDepth, $scope.selectedColour, $scope.selectedMaterial);
                        $scope.project.getGround().update();

                        // Init the UX
                        menuiserieUXFactory.setCurrentCompound(compound);

                        // Active closet in UI
                        $scope.project.getGround().display();
                        menuiserieUXMgr.displayTree(compound.gzone); // Display parts
                        menuiserieUXMgr.displayTree(compound.zone); // Display tree
                        //menuiserieUXMgr.selectZone(menuiserieUXMgr.get1stModuleZone()); // select 1st module zone

                        //menuiserieUXMgr.updateBOMAndPrice();

                        $scope.isBusy = false;
                        if (!$scope.currentMember && !$scope.freeAccessAllowed)
                            $scope.openLoginDialog(true);
                        else { // Start closet configuration !
                            getProjectShop($scope.currentMember ? $scope.currentMember.ShopId : $scope.uxMgr.shop.Id); // because shop id come from current member if any FIX #104
                            menuiserieUXMgr.updateBOMAndPrice();
                            doActionOnStart(__menuiserieCtxt__.action);
                        }
                    })

                }
                else { // Read compound with serializer
                    var C = initClosetCompound();

                    // Read closetModel JsonData
                    menuiserieSerializer.loadClosetModel(closetModel, $scope.project).then(function () {

                        // Can edit project
                        $scope.canEditProject = true;

                        // Update scope
                        $scope.projectTitle = $scope.project.getTitle();

                        // Get new loaded compound and update
                        C.update();
                        $scope.project.getGround().setClosetHeight(C.getHeight());
                        $scope.project.getGround().update();

                        // Init the UX
                        menuiserieUXFactory.setCurrentCompound(C);

                        // Set closet compound to UI
                        $scope.project.getGround().display();
                        menuiserieUXMgr.displayTree(C.gzone); // Display parts
                        menuiserieUXMgr.displayTree(C.zone); // Display tree
                        //menuiserieUXMgr.selectZone(menuiserieUXMgr.get1stModuleZone()); // select 1st module zone
                        $scope.uxCloset.notifyChange(); // FIX BUG70

                        //menuiserieUXMgr.updateBOMAndPrice();

                        $scope.isBusy = false;
                        if (!$scope.currentMember && !$scope.freeAccessAllowed)
                            $scope.openLoginDialog(true);
                        else { // Start closet configuration ! 
                            getProjectShop($scope.currentMember ? $scope.currentMember.ShopId : $scope.uxMgr.shop.Id); // because shop id come from current member if any FIX #104
                            menuiserieUXMgr.updateBOMAndPrice();
                            doActionOnStart(__menuiserieCtxt__.action);
                        }
                    },
                    function (err) {
                        $scope.isBusy = false;
                        throw new Error("[" + applicationName + "] Cannot set closet model to current project.")
                    });
                }
            },
            function (err) {
                $scope.isBusy = false;
                alert("Impossible de démarrer le configurateur. Vérifier l'existence d'au moins un modèle de placard. Vérifier que le modèle demandé est actif.");
            });
        }

        //#endregion
        
        //#region Initialization from server (starting point)
        menuiserieWebService.getConfigurator().then(function (response) {
            var confOptions = response.data;

            $scope.confId = confOptions.Id;

            // Default closet model dimensions
            $scope.closetWidth = confOptions.DefaultWidth;
            $scope.closetHeight = confOptions.DefaultHeight;
            $scope.closetDepth = confOptions.DefaultDepth;

            // Free-access
            $scope.freeAccessAllowed = confOptions.FreeAccessAllowed;
            
            // Work color
            menuiserieEnv.setWorkPanelColor(parseInt(confOptions.WorkPanelColor, 16));
            menuiserieEnv.setFixedZoneColor(parseInt(confOptions.ZoneColor, 16));
            menuiserieEnv.setAutoZoneColor(parseInt(confOptions.ZoneColor, 16));
            menuiserieEnv.setZoneSelectionColor(parseInt(confOptions.ZoneSelectionColor, 16));
            menuiserieEnv.setGroundWorkColor(parseInt(confOptions.GridColor, 16));

            // Options
            menuiserieUXMgr.setHasAutoVSeparator(confOptions.HasAutoVSeparatorEnabled);
            menuiserieUXMgr.setHasAutoHSeparator(confOptions.HasAutoHSeparatorEnabled);

            // Order behavior and brand id
            menuiserieUXMgr.brandId = confOptions.BrandId;
            menuiserieUXMgr.setHasOrderRedirection(confOptions.HasOrderRedirection);

            // closet start function : check if miminal assets are loaded before starting
            var noAccessory = false, noDrawers = false, noDrawerFacade = false, noHangingBar = false;
            var thicksLoaded = false;
            function _startCloset() {
                if ($scope.selectedColour
                    && $scope.groundTexture
                    && (noAccessory || $scope.selectedAccessory)
                    && (noHangingBar || $scope.hangingBars)
                    && thicksLoaded
                    && $scope.materials
                    && $scope.backPanels
                    && (noDrawers || $scope.drawers)
                    && (noDrawerFacade || $scope.drawerFacades)
                    && $scope.shops) {

                    $log.info("Start closet.")
                    $scope.uxMgr.prepareComponentTools(($scope.drawers && $scope.drawers.length > 0), ($scope.hangingBars && $scope.hangingBars.length > 0));
                    $scope.project = menuiserieProjectFactory.create('Nouveau projet', $scope.groundTexture, confOptions.GroundGridSize, confOptions.GroundGridStep);
                    $scope.project.setVATRate(confOptions.Brand.VATRate); // VAT Rate
                    menuiserieUXFactory.setCurrentProject($scope.project);

                    if (__menuiserieCtxt__.openProjectId > 0) // Open exiting project
                    {
                        $scope.open(__menuiserieCtxt__.openProjectId);
                    }
                    else // Start new project
                    {
                        loadClosetModel(__menuiserieCtxt__.closetModelId);
                    }
                }
                else
                    $log.debug("Cannot start closet yet ...")
            }

            // Load shops
            menuiserieDataFactory.loadShops().then(function (shopTable) {
                if (!shopTable || shopTable.length === 0)
                    alert("Il faut au moins un point de vente associé à l'enseigne. Créer un point de vente dans dans le backend avant de lancer le configurateur.");

                $scope.shops = shopTable;
                $scope.uxMgr.shop = $scope.shops[0];
                menuiserieDataFactory.setPriceCoef($scope.uxMgr.shop.Discount, $scope.uxMgr.shop.Coef);
                $log.info("shops are loaded.");
                _startCloset();
            });
           
            // Get the ground texture
            menuiserieDataFactory.getTextureById(confOptions.GroundTextureId).then(function (texture) {
                $scope.groundTexture = texture;
                $log.info("ground texture is loaded.");
                _startCloset();
            });

            // load colours
            menuiserieDataFactory.loadColours().then(function (colourTable) {
                $scope.colours = colourTable;
                $scope.coloursWithNone = menuiserieDataFactory.getColourTableWithNone();

                // Try to get default colour
                $scope.selectedColour = menuiserieDataFactory.getColourById(confOptions.DefaultColourId);
                if (!$scope.selectedColour)
                    $scope.selectedColour = colourTable[0];

                $log.info("Default colour is : " + $scope.selectedColour.Id + ".");

                $log.info("Coulours are loaded.");
                _startCloset();
            });

            // load accessories
            menuiserieDataFactory.loadAccessoryModels().then(function (accessoryTable) {
                $scope.accessories = accessoryTable;
                if (accessoryTable.length > 0) {
                    $scope.selectedAccessory = accessoryTable[0];
                    $log.info("Default accessory is : " + $scope.selectedAccessory.Id + ".");
                }
                else {
                    noAccessory = true;
                    $log.info("No accessory defined. Loading ok.");
                }

                $log.info("Accessories are loaded.");
                _startCloset();
            });

            // load hanging-bars
            menuiserieDataFactory.loadHangingBarModels().then(function (barTable) {
                $scope.hangingBars = barTable;
                if (barTable.length === 0)
                    noHangingBar = true;

                $log.info("Hanging-bars are loaded.");
                _startCloset();
            });
            
            // load drawer-groups
            menuiserieDataFactory.loadDrawerModels().then(function (drawerModelTable) {
                $scope.drawers = drawerModelTable;
                if (drawerModelTable.length === 0) {
                    noDrawers = true;
                    $log.info("No Drawer-goups defined. Loading ok.");
                }
                
                // load table of drawer-facades
                menuiserieDataFactory.loadFacadeModels().then(function (facadeTable) {
                    $scope.drawerFacades = facadeTable;

                    if (facadeTable.length > 0) {
                        if ($scope.selectedDrawer)
                            $scope.selectedDrawerFacade = menuiserieDataFactory.getMaterialModelById($scope.selectedDrawer.DefaultFacadeId);
                        if (!$scope.selectedDrawerFacade) // Not found in map
                            $scope.selectedDrawerFacade = facadeTable[0];
                    }
                    else {
                        noDrawerFacade = true;
                        $log.info("No Drawer-facade defined. Loading ok.");
                    }

                    $log.info("Drawer-goups are loaded.");
                    _startCloset();
                });
            });

            // load map of thicknesses
            menuiserieDataFactory.loadThickModels().then(function () {
                thicksLoaded = true;
                $log.info("Thicknesses are loaded.");
                _startCloset();
            });
            
            // load table of panel models
            menuiserieDataFactory.loadPanelModels().then(function (modelTable) {

                $scope.materials = modelTable;

                // Try to find default material
                $scope.selectedMaterial = menuiserieDataFactory.getMaterialModelById(confOptions.DefaultMaterialId);
                if (!$scope.selectedMaterial)
                    $scope.selectedMaterial = modelTable[0];

                $log.info("Panel models are loaded.");
                $log.info("Default panel material is : " + $scope.selectedMaterial.Id + ".");
                _startCloset();
            });

            // load table of back-panel models
            menuiserieDataFactory.loadBackPanelModels().then(function (modelTable) {

                $scope.backPanels = modelTable;

                $log.info("Back-panel models are loaded.");
                _startCloset();
            });

            // laod eco-taxes
            menuiserieDataFactory.loadEcoTaxes().then(function () {
                $log.info("Eco-taxes are loaded.");
                _startCloset();
            });
        },
        function (err) {
            $scope.isBusy = false;
            throw new Error(err);
        });        
        //#endregion
               
        //#region Shop of Project 

        // Get the current shop name
        $scope.getProjectShopName = function () {
            if (!$scope.shops) return "";

            return $scope.uxMgr.shop ? $scope.uxMgr.shop.Title : $scope.shops[0].Title
        }

        // When shop selection change
        $scope.shopChange = function () {
            menuiserieDataFactory.setPriceCoef($scope.uxMgr.shop.Discount, $scope.uxMgr.shop.Coef);
            $scope.uxMgr.updateBOMAndPrice();
        }

        // Get the project shop by shop id. Load all brand shops if necessary
        var getProjectShop = function (shopId) {            
            if (!shopId || !$scope.shops) shopId = 0; // Undefined shopId

            for (var i = 0 ; i < $scope.shops.length ; i++) {
                if ($scope.shops[i].Id === shopId) {
                    $scope.uxMgr.shop = $scope.shops[i];
                    menuiserieDataFactory.setPriceCoef($scope.uxMgr.shop.Discount, $scope.uxMgr.shop.Coef);
                    return;
                }
            }

            $scope.uxMgr.shop = $scope.shops[0];
            menuiserieDataFactory.setPriceCoef($scope.uxMgr.shop.Discount, $scope.uxMgr.shop.Coef);
        }

        //#endregion

        //#region Action on start
        var doActionOnStart = function (action) {
            if (action === 'OpenProjectDialog')
                $scope.open();
            else if (__menuiserieCtxt__.helpUrl !== '') { // Open help on first configurator opening
                var val = $cookies.get('EZHelpAlreadyOpened');
                if (!val) {
                    var exp = new Date(); exp.setTime(exp.getTime() + (365 * 24 * 60 * 60 * 1000));
                    $cookies.put('EZHelpAlreadyOpened', 'true', { expires: exp });
                    $scope.openHelp(__menuiserieCtxt__.helpUrl);
                }
            }
        }
        //#endregion

        //#region Account management 

        $scope.currentMember = menuiserieWebService.getCurrentUserProfileData( __menuiserieCtxt__ ).data;
        $scope.loginEmail = "";
        $scope.loginPassWord = "";
        $scope.loginFailed = false;
        $scope.loginFailedMsg = "";

        $scope.registerFirstName = "";
        $scope.registerLastName = "";
        $scope.registerEmail = "";
        $scope.registerPassword = "";
        $scope.registerPasswordConfirm = "";
        $scope.registerFailed = false;
        $scope.registerFailedMsg = "";

        $scope.getCurrentMemberName = function () {
            if ($scope.currentMember) return $scope.currentMember.LastName + " " + $scope.currentMember.FirstName;
            else return "";
        }

        // open login dialog
        $scope.openLoginDialog = function (open) {
            $scope.loginFailed = false;
            $scope.registerFailed = false;
            $scope.registerEmail = "";

            $scope.showBgDialog = open;
            $scope.showLoginDialog = open;
        }

        // login
        $scope.login = function () {
            if (menuiserieUXMgr.hasPendingOp) return;

            if ($scope.myLoginForm.$invalid) {
                return; // Not valid form
            }

            $scope.loginFailed = false;
            $scope.registerFailed = false;

            menuiserieUXMgr.startPendingOp();

            menuiserieWebService.login(menuiserieEnv.getMenuiserieKey(), $scope.loginEmail, $scope.loginPassword, __menuiserieCtxt__.useSSL === 'on').then(function (response) {
                menuiserieUXMgr.stopPendingOp();
                $scope.loginPassword = "";

                if (response.data) {
                    $scope.openLoginDialog(false);
                    $scope.currentMember = response.data;
                    getProjectShop($scope.currentMember.ShopId);
                    $scope.uxMgr.updateBOMAndPrice(); // To update price according to discount and coef FIX #104
                }
                else {
                    $scope.loginFailedMsg = "Vérifiez votre identifiant et mot de passe.";
                    $scope.loginFailed = true;
                }
            },
            function (err) {
                menuiserieUXMgr.stopPendingOp();
                $scope.loginPassword = "";

                throw new Error("[" + applicationName + "] Login webservice failed.");
            })
        }

        // logout
        $scope.logout = function () {
            if (menuiserieUXMgr.hasPendingOp) return;

            menuiserieUXMgr.startPendingOp();
            menuiserieWebService.logout().then(function (response) {
                menuiserieUXMgr.stopPendingOp();

                $scope.currentMember = null;
                $scope.uxMgr.shop = undefined;
                if (!$scope.freeAccessAllowed)
                    $scope.openLoginDialog(true);
            },
            function (err) {
                menuiserieUXMgr.stopPendingOp();
                throw new Error("[" + applicationName + "] Logout webservice failed.");
            })
        }

        // register
        $scope.register = function () {
            if (menuiserieUXMgr.hasPendingOp) return;

            if (!$scope.reCaptchaResponse) {
                $scope.registerFailed = true;
                $scope.registerFailedMsg = "Veuillez cocher la case 'je ne suis pas un robot'";
                return; // Not valid form
            }
            
            if ($scope.myRegisterForm.$invalid) {
                vcRecaptchaService.reload($scope.widgetId);
                $scope.reCaptchaResponse = null;
                return; // Not valid form
            }

            $scope.loginFailed = false;
            $scope.registerFailed = false;

            menuiserieUXMgr.startPendingOp();
            menuiserieWebService.register($scope.confId, $scope.registerFirstName, $scope.registerLastName, $scope.registerEmail, $scope.reCaptchaResponse).then(function (response) {
                menuiserieUXMgr.stopPendingOp();
                $scope.loginPassWord = "";

                // Reinit captcha
                vcRecaptchaService.reload($scope.widgetId);
                $scope.reCaptchaResponse = null;

                if (response.data.errCode === '') {
                    $scope.registerFirstName = "";
                    $scope.registerLastName = "";
                    $scope.registerEmail = "";

                    $scope.showLoginDialog = false;
                    $scope.showBgDialog = false;
                    $scope.currentMember = response.data.member;

                    menuiserieUXMgr.openMsgDialog("Vous allez bientôt recevoir un email avec vos informations de compte. Vous êtes désormais connecté et pouvez continuer à travailler.");
                }
                else {
                    $scope.registerFailed = true;
                    $scope.registerFailedMsg = response.data.errCode === 'reCAPTCHA' ? "Erreur de vérification du reCAPTCHA" : "Il existe déjà un compte avec cet email";
                }
            },
            function (err) {
                // Reinit captcha
                vcRecaptchaService.reload($scope.widgetId);
                $scope.reCaptchaResponse = null;

                menuiserieUXMgr.stopPendingOp();
                $scope.loginPassWord = "";

                throw new Error("[" + applicationName + "] Register webservice failed.");
            })
        }

        // ReCAPTCHA methods
        $scope.setReCaptchaWidgetId = function (widgetId) { $scope.reCaptchaWidgetId = widgetId };
        $scope.cbReCaptchaExpiration = function () {
            vcRecaptchaService.reload($scope.reCaptchaWidgetId);
            $scope.reCaptchaResponse = null;
        };

        // reset password
        $scope.resetPassword = function () {
            if (menuiserieUXMgr.hasPendingOp) return;

            $scope.loginFailed = false;
            $scope.registerFailed = false;

            menuiserieUXMgr.startPendingOp();
            menuiserieWebService.resetPassword($scope.loginEmail).then(function (response) {
                menuiserieUXMgr.stopPendingOp();
                $scope.loginPassWord = "";

                if (response.data) {
                    $scope.showLoginDialog = false;
                    $scope.showBgDialog = false;

                    menuiserieUXMgr.openMsgDialog("Votre mot de passe a été réinitialisé. Vous allez bientôt recevoir un email avec votre nouveau mot de passe.");
                }
                else {
                    $scope.loginFailedMsg = "Aucun compte trouvé pour '" + $scope.loginEmail + "'.";
                    $scope.loginFailed = true;
                }
            },
            function (err) {
                menuiserieUXMgr.stopPendingOp();
                $scope.loginPassWord = "";

                throw new Error("[" + applicationName + "] Reset password webservice failed.");
            })
        }

        //#endregion

        //#region Save/open/delete project

        $scope.projectTitle = "Mon projet";
        $scope.saveAsTitle = "";
        $scope.myProjects = [];
        $scope.saveAsMode = false;

        $scope.openSaveDialog = function (saveAsMode) {
            //jQ('#saveAsDialog').modal('hide');
            $scope.saveAsMode = saveAsMode || false;

            menuiserieWebService.isAuthenticate().then(function (response) {
                if (!response.data) {
                    $scope.saveAsMode = false;
                    $scope.openLoginDialog(true);
                    return;
                }

                if (saveAsMode && !$scope.project.isNew()) // It is not a new project : it's a copy
                    $scope.projectTitle = 'Copie de ' + $scope.projectTitle;

                // open save as dialog
                //jQ('#saveAsDialog').modal('show');
                $scope.showBgDialog = true;
                $scope.showSaveDialog = true;

                // Unselect current zone if any
                if ($scope.uxMgr.hasSelectedZone())
                    $scope.uxMgr.selectZone(null);
            },
            function (err) {
                $scope.saveAsMode = false;
                throw new Error("[" + applicationName + "] Authentication checking before project opening raise an error.")
            })
        }

        $scope.closeSaveDialog = function () {
            //$scope.saveAsMode = false;
            $scope.showBgDialog = false;
            $scope.showSaveDialog = false;
        }

        $scope.save = function () {
            if (menuiserieUXMgr.hasPendingOp) return;

            if (!$scope.currentMember)
                throw new Error("[" + applicationName + "] Cannot save project because user is not logged in.");

            var shopId = $scope.uxMgr.shop ? $scope.uxMgr.shop.Id : $scope.currentMember.ShopId; // depend on POS activation mode
            $scope.project.setTitle($scope.projectTitle);

            menuiserieEnv.getThreeEnv().takeScreenShot().then(function (dataUrl) { // Get project image
                menuiserieUXMgr.startPendingOp();

                menuiserieSerializer.saveProject($scope.project, shopId, dataUrl, $scope.saveAsMode).then(function (response) {
                    menuiserieUXMgr.stopPendingOp();

                    $scope.project.setId(response.data.Id);
                    alert("Le projet a été sauvergardé avec l'ID " + $scope.project.getId());
                    $scope.closeSaveDialog();
                    $scope.isSaved = true;
                    if ($scope.saveAsMode) {
                        $scope.canEditProject = true;
                        $scope.project.getRecord().StatusTitle = 'Created';
                    }
                    else
                        $scope.project._record = response.data;
                },
                function (err) {
                    menuiserieUXMgr.stopPendingOp();
                    $scope.saveAsMode = false;
                    throw new Error("[" + applicationName + "] Save project raise an error.")
                })

            })
        }

        $scope.open = function (projectId) {
            if (menuiserieUXMgr.hasPendingOp) return;

            $scope.myProjects = {
                items: [],
                getStatusClass: function (item) {
                    if (item.StatusTitle === 'Ordered') return 'zmdi-shopping-cart';
                    if (item.StatusTitle === 'Processing') return 'zmdi-time-restore';
                    if (item.StatusTitle === 'Finalized') return 'zmdi-check-circle ez-green';
                    if (item.StatusTitle === 'Canceled') return 'zmdi-close-circle ez-red';
                    return '';
                },
                getStatusText: function (item) {
                    if (item.StatusTitle === 'Ordered') return 'Commandé';
                    if (item.StatusTitle === 'Processing') return 'En fabrication';
                    if (item.StatusTitle === 'Finalized') return 'Finalisé';
                    if (item.StatusTitle === 'Canceled') return 'Annulé';
                    return '';
                }
            };

            if (!projectId) { // Must select the project
                menuiserieWebService.isAuthenticate().then(function (response) {
                    if (!response.data) {
                        $scope.openLoginDialog(true);
                        return;
                    }

                    // Current project is not saved : confirm close
                    if (!$scope.isSaved && !confirm("Voulez-vous fermer le projet en cours sans enregistrer vos modifications ?"))
                        return;

                    menuiserieUXMgr.startPendingOp();
                    menuiserieWebService.getMyProjects(menuiserieEnv.getMenuiserieKey()).then(function (response) {
                        menuiserieUXMgr.stopPendingOp();

                        $scope.myProjects.items = response.data;

                        // open project select dialog
                        //jQ('#selectProjectDialog').modal('show');
                        $scope.openProjectDialog(true);
                    },
                    function (err) {
                        menuiserieUXMgr.stopPendingOp();
                        throw new Error("[" + applicationName + "] Get my projects raise an error.")
                    });
                });                             
            }
            else { // Open the project by id
                // Unselect current zone if any
                if ($scope.uxMgr.hasSelectedZone())
                    $scope.uxMgr.selectZone(null);

                var C = initClosetCompound();

                $scope.openProjectDialog(false); // close current open project dialog if any
                $scope.busyMsg = "Ouverture projet en cours ..."
                $scope.isBusy = true;
                menuiserieUXMgr.startPendingOp();
                menuiserieSerializer.loadProject($scope.project, projectId).then(function (dto) {
                    menuiserieUXMgr.stopPendingOp();

                    //initClosetRules($scope.project.getCompound().getClosetModel());
                    menuiserieUXMgr.setClosetModel($scope.project.getCompound().getClosetModel());

                    // Get project shop
                    getProjectShop(dto.ShopId);

                    // Can edit project
                    // - Must be the creator
                    // - Is developpers or partners, or project has just created status.   
                    $scope.canEditProject = $scope.currentMember.Id === dto.CreatorId && ($scope.currentMember.RoleWeight > 50 || dto.StatusTitle === 'Created');

                    // Update project title
                    $scope.projectTitle = $scope.project.getTitle();

                    // Update the colour
                    $scope.selectedColour = C.defaultColour;

                    // Get new loaded compound and update
                    C.update();
                    $scope.project.getGround().setClosetHeight(C.getHeight());
                    $scope.project.getGround().update();

                    // Init the UX
                    menuiserieUXFactory.setCurrentCompound(C);
                    $scope.uxCloset.notifyChange(); // To have slider with valid bounds.

                    // Set closet compound to UI
                    $scope.project.getGround().display();
                    menuiserieUXMgr.displayTree(C.gzone); // Display parts
                    menuiserieUXMgr.displayTree(C.zone); // Display tree
                    //menuiserieUXMgr.selectZone(menuiserieUXMgr.get1stModuleZone()); // select 1st module zone

                    menuiserieUXMgr.updateBOMAndPrice();

                    var now = new Date();
                    $scope.projectImgUrl = menuiserieWebService.getServiceUrl("projectimage/" + menuiserieEnv.getMenuiserieKey() + "/" + projectId + "?" + now.getMilliseconds());
                    $scope.isSaved = true;
                    $scope.isBusy = false;
                },
                function (err) {
                    menuiserieUXMgr.stopPendingOp();
                    $scope.isBusy = false;
                    throw new Error("[" + applicationName + "] Open project raise an error.")
                });
            }
        }

        // open project dialog
        $scope.openProjectDialog = function (open) {
            $scope.showBgDialog = open;
            $scope.showProjectDialog = open;
        }

        // can delete project
        $scope.canDeleteProject = function (projectItem) {
            if (projectItem.Id === $scope.project.getId()) // Current project cannot be deleted
                return false;

            return $scope.currentMember.Id === projectItem.CreatorId && ($scope.currentMember.RoleWeight > 50 || projectItem.StatusTitle === 'Created');
        }

        // can order project
        $scope.canOrderProject = function () {
            if (!$scope.project) return false; // No ready project
            if (!$scope.currentMember || $scope.project.isNew()) return true; // To have a chance to click on order button

            return $scope.currentMember.Id === $scope.project.getRecord().CreatorId && $scope.project.getRecord().StatusTitle === 'Created';
        }

        // Delete project
        $scope.deleteProject = function (projectItem) {
            if (menuiserieUXMgr.hasPendingOp) return;

            if (!confirm("Voulez-vous vraiment supprimer le projet " + projectItem.Id + " '" + projectItem.Title + "'."))
                return;

            menuiserieWebService.isAuthenticate().then(function (response) {
                if (!response.data) {
                    $scope.openLoginDialog(true);
                    return;
                }

                menuiserieUXMgr.startPendingOp();
                menuiserieWebService.deleteProject(projectItem.Id).then(function (response) {
                    menuiserieUXMgr.stopPendingOp();
                    $scope.myProjects.items = response.data;
                },
                function (err) {
                    menuiserieUXMgr.stopPendingOp();
                    throw new Error("[" + applicationName + "] Delete a projects raise an error.")
                });
            });

        }

        //#endregion

        //#region Print project

        // Get print url
        $scope.getPrintUrl = function () {
            if (!$scope.project) return '';
            return __menuiserieCtxt__.printUrl + "?menuiserieKey=" + __menuiserieCtxt__.key + "&ProjectId=" + $scope.project.id;
        }

        $scope.canPrint = function () {
            return $scope.project && $scope.project.id > 0;
        }
        //#endregion

        //#region Save closet model

        $scope.canSaveClosetModel = function () {
            if (!$scope.currentMember) return false;

            if ($scope.currentMember.RoleWeight < 50)
                return false;
            else
                return true;
        };

        $scope.saveClosetModel = function () {
            menuiserieWebService.isAuthenticate().then(function (response) {
                if (!response.data) {
                    $scope.openLoginDialog(true);
                    return;
                }

                if (confirm("Le modèle de placard '" + $scope.project.getCompound().getClosetModel().Title + "' va être modifié. Voulez-vous vraiment enregistrer ?")) {

                    menuiserieSerializer.saveClosetModel($scope.project).then(function (response) {
                        alert("Le modèle de placard #" + response.data.Id + " a été sauvegardé.");
                    },
                    function (err) {
                        throw new Error("[" + applicationName + "] Save closet model raise an error.")
                    })
                }
            })
        }

        //#endregion

        //#region Screen shot

        $scope.projectImgUrl = "";

        $scope.screenShot = function () {
            menuiserieEnv.getThreeEnv().takeScreenShot().then(function (dataUrl) {
                var now = new Date();
                menuiserieWebService.saveProjectImg($scope.project.getId(), dataUrl).then(function(response) {
                    alert("L'image est sauvegardée. Sa taille est de " + response.data + " octets.");
                    $scope.projectImgUrl = menuiserieWebService.getServiceUrl("projectimage/" + menuiserieEnv.getMenuiserieKey() + "/" + $scope.project.getId() + "?" + now.getMilliseconds());
                },
                function (err) {
                    throw new Error(err);
                })
            });
        }

        //#endregion

        //#region Further dialogs

        $scope.stopClickPropagation = function (e) {
            e.stopPropagation();
        }

        $scope.closeDialogs = function () {
            if ($scope.showLoginDialog && !$scope.freeAccessAllowed) return; // Cannot close

            $scope.showBgDialog = false;
            $scope.showLoginDialog = false;
            $scope.showBOMDialog = false;
            $scope.showSaveDialog = false;
            $scope.showProjectDialog = false;
            $scope.uxAddon.showDialog = false;
            $scope.uxMgr.errorMsg = '';
        }

        // open BOM dialog
        $scope.openBOMDialog = function (open) {
            $scope.BOM = menuiserieUXMgr.BOM;
            $scope.showBgDialog = open;
            $scope.showBOMDialog = open;
        }

        // open Addon dialog
        $scope.openAddonDialog = function (open) {
            $scope.uxAddon.lazyLoadItems();
            $scope.showBgDialog = open;
            $scope.uxAddon.showDialog = open;
        }

        // close message dialog
        $scope.closeMsgDialog = function () {
            $scope.uxMgr.errorMsg = '';
        }

        // Help dialog
        var _lightBox;
        $scope.openHelp = function (url) {
            if (!_lightBox) _lightBox = $window.lity();
            _lightBox(url);
        }

        //#endregion

        //#region Debug Dump
        $scope.dumpClosetTree = function (ind, zone) {
            var i;

            if (!zone) zone = menuiserieUXMgr.getCompound().zone;
            if (!ind) ind = '';

            $log.info(ind + "+ Zone (" + (zone.isOff ? 'off' : 'on') + "): " + zone.title + " - XDim=" + (zone.hasXDimAuto ? 'Auto' : 'Free') + " YDim=" + (zone.hasYDimAuto ? 'Auto' : 'Free'));
            if (zone.splitter) {
                $log.info(ind + '  + Splitter : ' + zone.splitter.getOrientation());
                for (i = 0 ; i < zone.splitter.getSubZoneCount() ; i++)
                    $scope.dumpClosetTree(ind + '    ', zone.splitter.getSubZone(i));
            }

            if (zone.subItems) {
                for (i = 0 ; i < zone.subItems.length ; i++)
                    $log.info(ind + '  + Item : ' + zone.subItems[i].title);
            }
        }
        //#endregion
    }

    //registration
    thisModule.controller('menuiserieEngineController', [
        "$window",
        "$scope",
        "$log",
        "$location",
        "$timeout",
        "$q",
        "$cookies",
        "menuiserieEnv",
        "menuiserieUXFactory",
        "menuiserieWebService",
        "menuiserieDataFactory",
        "menuiserieClosetFactory",
        "menuiserieCompoundFactory",
        "menuiseriePanelFactory",
        "menuiserieProjectFactory",
        "menuiserieZoneFactory",
        "menuiserieSerializer",
        "vcRecaptchaService",
        engineController
    ]);

    //#endregion

})();
