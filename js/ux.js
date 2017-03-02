/* simonMenuiserie UX v.0.2 */
'use strict';
(function () {

	var thisModule = angular.module('simonMenuiserie.UX', ['simonMenuiserie.Core']);

	var jQ = jQuery; // jQuery shortcut

    //#region Directives

    // On enter key press directive
	thisModule.directive('ngEnter', function () {
	    return function (scope, element, attrs) {
	        element.bind("keydown keypress", function (event) {
	            if (event.which === 13) {
	                scope.$apply(function () {
	                    scope.$eval(attrs.ngEnter);
	                });

	                event.preventDefault();
	            }
	        });
	    };
	});

    // To convert value of slider to float
	/*thisModule.directive('input', function () {
	    return {
	        restrict: 'E',
	        require: '?ngModel',
	        link: function (scope, element, attrs, ngModel) {
	            if ('type' in attrs && attrs.type.toLowerCase() === 'range') {
	                ngModel.$parsers.push(parseFloat);
	            }
	        }
	    };
	});*/
    //registration

    // To manage material design lite slider
    // ez-slider-val
	function sliderVal($log, $timeout, $parse) {

	    return {
	        restrict: 'A',
	        //replace: true,
	        //template: '<input type="range"></input>',
	        //require: '?ngModel',
	        link: function (scope, elem, attrs) {

	            // HACK BUG85 : Slider handle not seen on edge browser
	            var user_agent = navigator.userAgent;
	            var edge = /(edge)\/((\d+)?[\w\.]+)/i;
	            var isEdge = edge.test(user_agent);
	            if (isEdge) {
	                jQ(elem).removeClass("mdl-slider mdl-js-slider");
	            }
	            // End of HACK BUG85

	            var slider = elem[0].MaterialSlider;
	            //if (slider)
	              //  var x = 1;

	            var valProp = attrs.ezSliderVal;
	            var _getVal = function () { return scope.$eval(valProp); }

	            // Binding watcher
	            scope.$watch(valProp, function () {
	                $timeout(function () {
	                    var val = _getVal();
	                    //$log.debug("ezSliderVal: value setted with '" + valProp + "' has value '" + val + "'");

	                    if (val && elem.length > 0 && elem[0].MaterialSlider) {
	                        elem[0].MaterialSlider.change(val);
	                    }
	                    else if (isEdge && val && elem.length > 0) { // HACK BUG85
	                        // $log.debug("$$$$ ezSliderVal: " + elem[0].nodeName);
	                        jQ(elem).val(val);
	                    }
	                });
	            });

	            // IE or Edge
	            if (!isEdge) { // HACK BUG85
	                jQ(elem).change(function (e) {
	                    // $log.debug("[change] ezSliderVal: set model with '" + jQ(e.target).val() + "'");
	                    scope.$apply(function () {
	                        $parse(valProp).assign(scope, parseFloat(jQ(e.target).val()));
	                        if (attrs.ezSliderChange)
	                            scope.$eval(attrs.ezSliderChange);
	                    })
	                });
	            }

	            // Chrome or FF
	            jQ(elem).on('input', function (e) {
	                // $log.debug("[input] ezSliderVal: set model with '" + jQ(e.target).val() + "'");
	                scope.$apply(function () {
	                    $parse(valProp).assign(scope, parseFloat(jQ(e.target).val()));
	                    if (attrs.ezSliderChange)
	                        scope.$eval(attrs.ezSliderChange);
	                })
	            });

	            // Cleaner
	            elem.on('$destroy', function () {
	                jQ(elem).unbind("change");
	                jQ(elem).unbind("input");
	            })

	        }

	    }

	}

    //registration
	thisModule.directive('ezSliderVal', [
        "$log",
        "$timeout",
        "$parse",
        sliderVal]);


    //#endregion

	//#region UXFactory
	function UXFactory(
        $timeout,
        $filter,
        $log,
        $sce,
        $window,
		menuiserieEnv,
        menuiserieWebService,
        menuiserieDataFactory,
        menuiserieClosetBrowser,
        menuiserieClosetFactory,
        menuiseriePanelFactory,
        menuiserieCompoundFactory,
        menuiserieHangingBarFactory,
        menuiserieProjectFactory,
        menuiserieBoundValidator,
        menuiserieClosetValidator) {

	    //#region UXCloset class
		var UXCloset = function (uxmgr) {
		    var me = this;
		    this.uxmgr = uxmgr;
		    this.scope = uxmgr.scope;
		    this.compound = uxmgr.getCompound();

		    // setup scope UX properties
		    me.isEnabled = false;
		    
		    me.minWidth = uxmgr.getClosetWidthRule().mini;
		    me.minHeight = uxmgr.getClosetHeightRule().mini;
		    me.minDepth = uxmgr.getClosetDepthRule().mini;
		    me.maxWidth = uxmgr.getClosetWidthRule().maxi;
		    me.maxHeight = uxmgr.getClosetHeightRule().maxi;
		    me.maxDepth = uxmgr.getClosetDepthRule().maxi;

		    me.closetWidth = 0;
		    me.closetHeight = 0;
		    me.closetDepth = 0;

            // HACK : to have sliders up-to-date
		    //$timeout(function () {
		        me.closetWidth = me.compound.width;
		        me.closetHeight = me.compound.height;
		        me.closetDepth = me.compound.depth;
		    //}, 250);
		    

		    // setup watchers 
		    me.scope.$watch(
                function () { return me.compound && !uxmgr.hasSelectedZone() },
                function (newValue) {
                    me.isEnabled = newValue;                        
                });
		}

	    // Notify change to the view
	    UXCloset.prototype.notifyChange = function () {
	        var me = this;
	        var uxmgr = this.uxmgr;

	        var a = uxmgr.createClosetValidatorDimArgs();
	        var bounds = menuiserieClosetValidator.getClosetDimensionBounds(a);

	        me.minWidth = bounds.minWidth;
	        me.minHeight = bounds.minHeight;
	        me.minDepth = bounds.minDepth;
	        me.maxWidth = bounds.maxWidth;
	        me.maxHeight = bounds.maxHeight;
	        me.maxDepth = bounds.maxDepth;
	    },

        // Update dimension of closet
		UXCloset.prototype.update = function () {
		    var me = this;

		    var compound = me.compound;
		    var ground = me.uxmgr.getProject().getGround();

		    var scope = me.uxmgr.scope;
		    if (scope.myClosetForm.closetWidth.$invalid ||
                scope.myClosetForm.closetHeight.$invalid ||
                scope.myClosetForm.closetDepth.$invalid) {
		        me.updPromise = undefined;
		        me.invalidated = false;
		        return; // Cancel dimension changes
		    }

		    compound.width = me.closetWidth;
		    compound.height = me.closetHeight;
		    compound.depth = me.closetDepth;

		    compound.update();

		    ground.setClosetHeight(me.closetHeight);
		    ground.update();

		    me.scope.uxZone.notifyChange();

		    me.uxmgr.mustBeSaved();
		    me.uxmgr.updateBOMAndPrice();
		    me.uxmgr.errorMsg = "";
		    me.updPromise = undefined;
		}

	    // Change colour of closet
		UXCloset.prototype.changeColour = function (colour) {
		    var me = this;
		    if (me.scope.selectedColour === colour) return; // no change

		    me.scope.selectedColour = colour;
		    me.scope.selectedColour.load().then(function () {
		        if (menuiserieClosetFactory.setDefaultColour(me.compound, me.scope.selectedColour)) {
		            me.uxmgr.mustBeSaved();
		            me.uxmgr.updateBOMAndPrice();
		        }
		    });

		    me.uxmgr.errorMsg = "";
		}

	    // Change panel of closet
		UXCloset.prototype.changePanel = function () {
		    var uxmgr = this.uxmgr;
		    var me = this;
		    var oldPanelModel = this.compound.defaultPanelModel;

		    var a = uxmgr.createClosetValidatorDimArgs();
		    a.forcedThickness = me.scope.selectedMaterial.Thickness;
		    var bounds = menuiserieClosetValidator.getClosetDimensionBounds(a);

		    //var rule = menuiserieRuleFactory.createDimRule(bounds.minWidth, bounds.maxWidth);
		    if (!menuiserieBoundValidator.isValid(me.compound.getWidth(), bounds.minWidth, bounds.maxWidth)) {
		        uxmgr.errorMsg = "La largeur des zones n'est plus valide. La matière ne peut pas être changée.";
		        me.scope.selectedMaterial = oldPanelModel;
		        return;
		    }

		    //rule.setBounds(bounds.minHeight, bounds.maxHeight);
		    if (!menuiserieBoundValidator.isValid(me.compound.getHeight(), bounds.minHeight, bounds.maxHeight)) {
		        uxmgr.errorMsg = "La hauteur des zones n'est plus valide. La matière ne peut pas être changée.";
		        me.scope.selectedMaterial = oldPanelModel;
		        return;
		    }

		    if (menuiserieClosetFactory.setDefaultPanelModel(me.compound, me.scope.selectedMaterial)) {
		        me.notifyChange();
		        me.uxmgr.mustBeSaved();
		        me.uxmgr.updateBOMAndPrice();
		    }

		    uxmgr.errorMsg = "";
		}

        //#endregion

	    //#region UXDrawer class
		var UXDrawer = function (uxmgr, uxzone) {
		    this.uxmgr = uxmgr;
		    this.uxzone = uxzone;

		    // setup scope UX properties
		    this.isEnabled = false;
		    this.currentDrawer;
		    this.selectedDrawerModel;
		    this.selectedFacadeModel = menuiserieDataFactory.getFacadeModelTable()[0];
		    this.selectedFacadeColour = menuiserieDataFactory.getFacadeModelTable()[0];
		    this.selectedAccessoryModel = menuiserieDataFactory.getAccessoryModelTable()[0];
		}

	    // Notify view change.
        // drawer : the drawer to manage
		UXDrawer.prototype.notifyChange = function (drawer) {
		    this.currentDrawer = drawer;

		    this.isEnabled = drawer ? true : false;
		    this.selectedDrawerModel = drawer ? drawer.getDrawerModel() : undefined;
		    this.selectedFacadeModel = drawer ? drawer.getFacadeModel() : menuiserieDataFactory.getFacadeModelTable()[0];
		    this.selectedFacadeColour = drawer && drawer.getFacadeColour() ? drawer.getFacadeColour() : menuiserieDataFactory.getColourTableWithNone()[0];
		    this.selectedAccessoryModel = drawer ? drawer.getHandleModel() : menuiserieDataFactory.getAccessoryModelTable()[0];
		}

	    // Check add drawer in zone. Return true if adding is possible. Use it before add drawwer in zone.
	    // args : {
	    //  zone : IN (Zone) The zone that will contain the drawer
	    //  drawerModel: IN (DrawerModel) The drawer model
	    //  vSeparatorRequired: OUT (bool) If true a vertical separator is required.
	    //  hSeparatorRequired: OUT (bool) If true an horizontal separator is required.
	    //  zoneWidth: OUT (Number) the zone width of module.
	    //  zoneHeight: OUT (Number) the zone height of section.
	    // }
		UXDrawer.prototype.checkAddDrawer = function (args) {
		    var uxmgr = this.uxmgr;
		    var zone = this.uxzone.zones.selected;
		    var drawerModel = args.drawerModel;

		    // The default panel thickness
		    var thickness = uxmgr.getCompound().getDefaultThickness();

		    // The zone rules
		    var zoneWidthRule = uxmgr.getZoneWidthRule();
		    var zoneHeightRule = uxmgr.getZoneHeightRule();

		    // The drawer-group behaviors
		    var widthBehavior = uxmgr.getDGWidthBehavior();
		    var heightBehavior = uxmgr.getDGHeightBehavior();

		    // Initialization of OUT parameter
		    args.vSeparatorRequired = false;
		    args.hSeparatorRequired = false;

		    // The more restrictive rule for minimum constraint
		    // Choose the more restrictive dimension rule between drawer and zone.
		    var miniWidthConstraint = drawerModel.MinWidth > zoneWidthRule.mini ? drawerModel.MinWidth : zoneWidthRule.mini;
		    var miniHeightConstraint = drawerModel.MinHeight > zoneHeightRule.mini ? drawerModel.MinHeight : zoneHeightRule.mini;
		    var miniDepthConstraint = drawerModel.MinDepth;

		    // Check if zone width is NOT too small
		    if (zone.getWidth() < miniWidthConstraint) {
		        uxmgr.errorMsg = "La zone est trop petite en largeur. Ajout impossible.";
		        return false;
		    }

		    // Check if zone depth is NOT too small
		    if (zone.getDepth() < miniDepthConstraint) {
		        uxmgr.errorMsg = "La zone est trop petite en profondeur. Ajout impossible.";
		        return false;
		    }

		    if (widthBehavior === 'ValidMiniMaxi') {
		        // Check if zone width is NOT too large
		        if (menuiserieBoundValidator.isTooLarge(zone.getWidth(), drawerModel.MaxWidth)) {
		            uxmgr.errorMsg = "La zone est trop grande en largeur. Ajout impossible.";
		            return false;
		        }
		    }

		    // Check if zone heigth is NOT too small
		    // The zone height cannot be less than maxi height zone of configurator constraint.
		    if (zone.getHeight() < miniHeightConstraint) {
		        uxmgr.errorMsg = "La zone est trop petite en hauteur. Ajout impossible.";
		        return false;
		    }

		    if (heightBehavior === 'ValidMiniMaxi') {
		        // Check if zone height is NOT too large
		        if (menuiserieBoundValidator.isTooLarge(zone.getHeight(), drawerModel.MaxHeight)) {
		            uxmgr.errorMsg = "La zone est trop grande en hauteur. Ajout impossible.";
		            return false;
		        }
		    }

		    // Check if vertical separator is required
		    if (menuiserieBoundValidator.isTooLarge(zone.getWidth(), drawerModel.MaxWidth)) {
		        if (widthBehavior === 'ValidMiniWithAutoSeparator') {

		            // The zone width cannot be less than mini zone width of configurator options constraint.
		            args.zoneWidth = drawerModel.MaxWidth < zoneWidthRule.mini ? zoneWidthRule.mini : drawerModel.MaxWidth;

		            if (zone.getWidth() - args.zoneWidth - thickness > zoneWidthRule.mini) { // The mini zone width was respected
		                args.vSeparatorRequired = true;
		            }
		        }
		    }

		    // Check if horizontal separator is required
		    if (menuiserieBoundValidator.isTooLarge(zone.getHeight(), drawerModel.MaxHeight)) {
		        if (heightBehavior === 'ValidMiniWithAutoSeparator') {

		            // The zone height cannot be less than mini zone height of configurator options constraint.
		            args.zoneHeight = drawerModel.MaxHeight < zoneHeightRule.mini ? zoneHeightRule.mini : drawerModel.MaxHeight;

		            if (zone.getHeight() - args.zoneHeight - thickness > zoneHeightRule.mini) { // The mini zone height was respect
		                args.hSeparatorRequired = true;
		            }
		        }
		    }

		    uxmgr.errorMsg = "";
		    return true;
		}

	    // Prepare the drawer zone according to splitting specification.
        // Return the content zone of drawer.
	    // args : {
	    //  zone : IN (Zone) The zone that will contain the drawer
	    //  drawerModel: IN (DrawerModel) The drawer model
	    //  vSeparatorRequired: IN (bool) If true a vertical separator is required.
	    //  hSeparatorRequired: IN (bool) If true an horizontal separator is required.
	    //  zoneWidth: IN (Number) the zone width of created module.
	    //  zoneHeight: IN (Number) the zone height of created section.
	    // }
		UXDrawer.prototype.prepareDrawerZone = function (args) {
		    var uxmgr = this.uxmgr;
		    var zone = args.zone; // this.uxzone.zones.hsplittable; //menuiserieClosetBrowser.getSplittableZone(args.zone);
		    var drawerModel = args.drawerModel;

		    // The default panel thickness
		    var thickness = uxmgr.getCompound().getDefaultThickness();

            // The selected zone
		    var selectedZone = args.zone;

		    if (args.vSeparatorRequired) { // Add vertical separator
		        var zWidth = args.zoneWidth;
		        var splitInfo = {};
		        var adjZ;
		                
                // The adjacent zone width
		        var adjWidth = zone.getWidth() - zWidth - thickness;
		                
		        zone = menuiserieClosetFactory.splitZone(2, this.uxzone.zones.hsplittable, 'horizontal', splitInfo);
		        var dimZone = menuiserieClosetBrowser.getWZone(zone);
		        dimZone.setXDimAuto(false);
		        dimZone.setWidth(zWidth);
		        selectedZone = zone;

		        adjZ = splitInfo.splitter.getSubZone(splitInfo.firstZoneIndex + 1);
		        adjZ.title = 'adj-widthBehavior';
		        if (!adjZ.hasXDimAuto)
		            adjZ.setWidth(adjWidth); // Adjust adjacent zone according to separator thickness and dimension of drawer

		        args.separatorRequired = true;
		    }

		    if (args.hSeparatorRequired) { // Add horizontal separator
		        var zHeight = args.zoneHeight;
		        var splitInfo = {};
		        var adjZ;

		        // The adjacent zone height
		        var adjHeight = zone.getHeight() - zHeight - thickness;

		        zone = menuiserieClosetFactory.splitZone(2, menuiserieClosetBrowser.getHZone(zone), 'vertical', splitInfo);
		        var dimZone = menuiserieClosetBrowser.getHZone(zone);
		        dimZone.setYDimAuto(false);
		        dimZone.setHeight(zHeight);
		        selectedZone = zone;

		        adjZ = splitInfo.splitter.getSubZone(splitInfo.firstZoneIndex + 1);
		        if (!adjZ.hasYDimAuto)
		            adjZ.setHeight(adjHeight); // Adjust adjacent zone according to separator thickness and dimension of drawer

		        args.separatorRequired = true;
		    }

		    uxmgr.errorMsg = "";
		    return selectedZone;
		}

	    // Set the drawer model in current selected zone. Use as combobox change handler.
		UXDrawer.prototype.setDrawerModel = function (drawerModel) {
		    if (!this.uxmgr.hasSelectedZone()) return; // no zone selected

		    var me = this;
		    var uxmgr = this.uxmgr;
		    var selZone = uxmgr.getSelectedZone();
		    var rootOfDisplay = uxmgr.compound.zone; // menuiserieClosetFactory.getSizableZone(selZone).parentZone;

		    if (drawerModel !== me.selectedDrawerModel)
		        me.selectedDrawerModel = drawerModel;
		    else
		        me.selectedDrawerModel = undefined;

		    if (me.selectedDrawerModel) { // A drawer model is selected
		        var facadeModel = this.selectedFacadeModel;
		        var facadeColour = this.selectedFacadeColour;
		        var handleModel = this.selectedAccessoryModel;

		        // Check to add drawer
		        var a = {
		            zone: selZone,
		            drawerModel: drawerModel
		        };
		        if (!this.checkAddDrawer(a)) {
		            // restore old selected drawer
		            if (this.currentDrawer)
		                this.selectedDrawerModel = this.currentDrawer.getDrawerModel();
		            else
		                this.selectedDrawerModel = undefined;
		            return; // Cannot add.
		        }

		        uxmgr.hideTree(rootOfDisplay);

		        if (this.currentDrawer) // Has already drawer in zone
		            selZone.removeSubItem(this.currentDrawer); // remove it

		        // prepare drawer adding and get the new selected zone
		        selZone = this.prepareDrawerZone(a);
                
                // Add action need zone splitting
		        if (a.vSeparatorRequired || a.hSeparatorRequired) {
		            rootOfDisplay.update(); // Must compute the tree
		        }

		        var _addDrawer = function () {
		            handleModel.load().then(function () {
		                var DG = menuiserieCompoundFactory.createDrawerGroup1(selZone, drawerModel, facadeModel, handleModel);
		                selZone.add(DG);

		                if (facadeColour.Id !== 0)
		                    DG.facadeColour = facadeColour;

		                me.currentDrawer = DG;
		                me.isEnabled = true;
		                DG.update();

		                if (a.vSeparatorRequired || a.hSeparatorRequired)
		                    uxmgr.selectZone(selZone);

		                uxmgr.scope.uxZone.notifyChange();
		                uxmgr.scope.uxCloset.notifyChange();
		                uxmgr.displayTree(rootOfDisplay);
		                uxmgr.mustBeSaved();
		                uxmgr.updateBOMAndPrice();
		            })
		        }

		        if (facadeColour.Id !== 0) // Load texture and 3D material from server
		            facadeColour.load().then(function () { _addDrawer() })
		        else
		            _addDrawer();
		    }
		    else { // Removing
		        uxmgr.hideTree(rootOfDisplay);

		        if (this.currentDrawer) { // Has already drawer in zone
		            selZone.removeSubItem(this.currentDrawer); // remove it
		            this.currentDrawer = undefined;
		        }

		        this.isEnabled = false;
		        uxmgr.scope.uxZone.notifyChange();
		        uxmgr.scope.uxCloset.notifyChange();
		        uxmgr.displayTree(rootOfDisplay);
		        uxmgr.updateBOMAndPrice();
		    }

		    uxmgr.errorMsg = "";
		}

	    // Set the facade colour. Use as combobox change handler
		UXDrawer.prototype.setFacadeColour = function (colour) {
		    var me = this;

		    if (colour !== me.selectedFacadeColour)
		        me.selectedFacadeColour = colour;
		    else
		        me.selectedFacadeColour = undefined;

		    if (me.currentDrawer) {
		        if (!me.selectedFacadeColour) { // Restore colour of closet
		            me.currentDrawer.cancelFacadeColour();
		            me.uxmgr.mustBeSaved();
		            me.uxmgr.updateBOMAndPrice();
		        }
		        else { // Set custom facade colour
		            colour.load().then(function () {
		                me.currentDrawer.setFacadeColour(colour);
		                me.uxmgr.mustBeSaved();
		                me.uxmgr.updateBOMAndPrice();
		            });
		        }
		    }

		    me.uxmgr.errorMsg = "";
		}

	    // Set the handle model in current selected zone. Use as combobox change handler.
		UXDrawer.prototype.setHandleModel = function (handle) {
		    var me = this;

		    if (handle === me.selectedAccessoryModel) return; // no change

		    var uxmgr = me.uxmgr;

		    this.selectedAccessoryModel = handle;

		    if (me.currentDrawer) {
		        uxmgr.hideTree(me.currentDrawer);

		        if (handle.Id === 0) { // No Handle
		            throw new Error("[" + applicationName + "] not implemented.");//drawer.removeHandle();
		        }
		        else { // Set handle
		            handle.load().then(function () {
		                me.currentDrawer.setHandleModel(handle);
		                uxmgr.displayTree(me.currentDrawer);
		                me.uxmgr.mustBeSaved();
		                me.uxmgr.updateBOMAndPrice();
		            });
		        }
		    }

		    uxmgr.errorMsg = "";
		}

	    //#endregion

	    //#region UXHangingBar class
		var UXHangingBar = function (uxmgr, uxzone) {
		    this.uxmgr = uxmgr;
		    this.uxzone = uxzone;

		    // setup scope UX properties
		    this.isEnabled = false;
		    this.currentHangingBar;
		    this.selectedModel;
		}

	    // Notify view change.
	    // hangingBar : the hangingBar to manage
		UXHangingBar.prototype.notifyChange = function (hangingBar) {
		    this.currentHangingBar = hangingBar;

		    this.isEnabled = hangingBar ? true : false;
		    this.selectedModel = hangingBar ? hangingBar.getModel() : undefined;
		}

	    // Check add hanging-bar in zone. Return true if adding is possible. Use it before add hanging-bar in zone.
	    // args : {
	    //  zone : IN (Zone) The zone that will contain the drawer
	    //  model: IN (HangingBarModel) The hanging-bar model
	    //  zoneWidth: OUT (Number) the zone width of module.
	    //  zoneHeight: OUT (Number) the zone height of section.
	    // }
		UXHangingBar.prototype.checkAddHangingBar = function (args) {
		    // TODO
		    return true;
		}

	    // Set the hanging-bar model in current selected zone. Use as combobox change handler.
		UXHangingBar.prototype.setModel = function (hangingBarModel) {
		    if (!this.uxmgr.hasSelectedZone()) return; // no zone selected

		    var me = this;
		    var uxmgr = this.uxmgr;
		    var selZone = uxmgr.getSelectedZone();
		    var rootOfDisplay = uxmgr.compound.zone;

		    if (hangingBarModel !== me.selectedModel)
		        me.selectedModel = hangingBarModel;
		    else
		        me.selectedModel = undefined;

		    if (me.selectedModel) { // A model is selected

		        // Check to add drawer
		        var a = {
		            zone: selZone,
		            model: hangingBarModel
		        };
		        if (!me.checkAddHangingBar(a)) {
		            // restore old selected drawer
		            if (me.currentHangingBar)
		                me.selectedModel = this.currentHangingBar.getModel();
		            else
		                me.selectedModel = undefined;
		            return; // Cannot add.
		        }

		        uxmgr.hideTree(rootOfDisplay);

		        if (me.currentHangingBar) // Has already hanging-bar in zone
		            selZone.removeSubItem(me.currentHangingBar); // remove it

		        // prepare drawer adding and get the new selected zone
		        //selZone = this.prepareDrawerZone(a);

		        // Add action need zone splitting
		        /*if (a.vSeparatorRequired || a.hSeparatorRequired) {
		            rootOfDisplay.update(); // Must compute the tree
		        }*/

		        //var hbModel = menuiserieDataFactory.getHangingBarModelTable()[0];
		        me.selectedModel.load().then(function () {
		            var HB = menuiserieHangingBarFactory.create(selZone, me.selectedModel);
		            selZone.add(HB);
		            HB.update();

		            uxmgr.scope.uxZone.notifyChange();
		            uxmgr.scope.uxCloset.notifyChange();
		            uxmgr.displayTree(rootOfDisplay);
		            uxmgr.mustBeSaved();
		            uxmgr.updateBOMAndPrice();
		        });
		    }
		    else { // Removing
		        uxmgr.hideTree(rootOfDisplay);

		        if (me.currentHangingBar) { // Has already hanging-bar in zone
		            selZone.removeSubItem(me.currentHangingBar); // remove it
		            me.currentHangingBar = undefined;
		        }

		        me.isEnabled = false;
		        uxmgr.scope.uxZone.notifyChange();
		        uxmgr.scope.uxCloset.notifyChange();
		        uxmgr.displayTree(rootOfDisplay);
		        uxmgr.updateBOMAndPrice();
		    }

		    uxmgr.errorMsg = "";
		}

	    //#endregion

	    //#region UXZone class
		var UXZone = function (uxmgr) {
		    var me = this;
		    this.uxmgr = uxmgr;
		    this.scope = uxmgr.scope;

		    // setup scope UX properties
		    me.isEnabled = false;
		    me.title = "";
		    me.width;
		    me.height;
		    me.canSetWidth;
		    me.canSetHeight;
		    me.widthAutoSize;
		    me.heightAutoSize;
		    me.canSetWidthAutoSize;
		    me.canSetHeightAutoSize;
		    me.minWidth;
		    me.maxWidth;
		    me.minHeight;
		    me.maxHeight;
		    me.canChangeBackPanel;
		    me.selectedBackModel = menuiserieDataFactory.getBackPanelModelTable()[0];
		    me.selectedBackColour = null; // default coulour
		    me.lockDimUpdate = false; // To avoid unexpected updateDimension() raising.

		    me.uxDrawer = new UXDrawer(uxmgr, me);
		    me.uxHangingBar = new UXHangingBar(uxmgr, me);

		    me.zones = {
                selected: undefined,
		        module: undefined,
		        section: undefined,
		        fillable: undefined,
		        hsplittable: undefined,
		        vsplittable: undefined,
		        backPanelRoot: undefined
		    }
		}

	    // Resolve the zones according to current selected zone.
		UXZone.prototype._resolvesZones = function () {
		    var me = this;
		    me.zones.selected = me.uxmgr.getSelectedZone();
		    me.zones.module = me.zones.selected ? menuiserieClosetBrowser.getWZone(me.zones.selected) : undefined;
		    me.zones.section = me.zones.selected ? menuiserieClosetBrowser.getHZone(me.zones.selected) : undefined;
		    me.zones.fillable = me.zones.selected;
		    me.zones.hsplittable = me.zones.module;
		    me.zones.vsplittable = me.zones.section;
		    me.zones.backPanelRoot = me.zones.selected ? menuiserieClosetBrowser.getRootOfBackPanel(me.zones.selected) : undefined;
		}

	    // Notify change of width to the view
		UXZone.prototype._notifyWidthChange = function (zone) {
		    if (zone) this.width = Math.round(zone.xdim * 10) / 10;
		    this.canSetWidth = this.canSetWidthAutoSize && !this.widthAutoSize;
		}

	    // Notify change of heigth to the view
		UXZone.prototype._notifyHeightChange = function (zone) {
		    if (zone) this.height = Math.round(zone.ydim * 10) / 10;
		    this.canSetHeight = this.canSetHeightAutoSize && !this.heightAutoSize;
		}

	    // Notify dimension bounds change to the view
		UXZone.prototype._notifyDimBoundsChange = function (zone) {
		    if (!zone) return;
		    var bounds = menuiserieClosetValidator.getZoneDimensionBounds(zone, this.uxmgr.getZoneWidthRule(), this.uxmgr.getZoneHeightRule())
		    this.minWidth = bounds.minWidth;
		    this.maxWidth = bounds.maxWidth;
		    this.minHeight = bounds.minHeight;
		    this.maxHeight = bounds.maxHeight;
		}

        // Return true if can delete left separator
		UXZone.prototype.canDeleteLeftSeparator = function (WZone) {
		    if (!WZone || !WZone.parentZone) return false;

		    var PSp = WZone.parentZone.splitter;
		    var zidx = PSp.getSubZoneIndex(WZone);
		    return PSp && PSp.getSubZoneIndex(WZone) > 0; // not first zone
		}

	    // Return true if can delete right separator
		UXZone.prototype.canDeleteRightSeparator = function (WZone) {
		    if (!WZone || !WZone.parentZone) return false;

		    var PSp = WZone.parentZone.splitter;
		    var zidx = PSp.getSubZoneIndex(WZone);
		    var zc = PSp.getSubZoneCount();
		    return PSp && PSp.getSubZoneIndex(WZone) < PSp.getSubZoneCount() - 1; // not last zone
		}

	    // Return true if can delete bottom separator
		UXZone.prototype.canDeleteBottomSeparator = function (HZone, zoneBelow) {
		    if (!HZone || !HZone.parentZone) return false;

		    //var zoneBelow = menuiserieClosetBrowser.getZoneBelow(HZone);
		    return zoneBelow && !zoneBelow.isOff;
		}

	    // Return true if can delete top separator
		UXZone.prototype.canDeleteTopSeparator = function (HZone, zoneAbove) {
		    if (!HZone || !HZone.parentZone || menuiserieClosetBrowser.isFirstZone(HZone)) return false;

		    //var zoneAbove = menuiserieClosetBrowser.getZoneAbove(HZone);
		    return zoneAbove && !zoneAbove.isOff;
		}

	    // Get the module zone. Return undefined if no selected zone
		UXZone.prototype.getModuleZone = function () {
		    return menuiserieClosetBrowser.getWZone(this.uxmgr.getSelectedZone()); // menuiserieClosetFactory.getModuleZone(this.uxmgr.getSelectedZone());
		}

	    // Get the section zone. Return undefined if no selected zone
		UXZone.prototype.getSectionZone = function () {
		    return menuiserieClosetBrowser.getHZone(this.uxmgr.getSelectedZone());
		    //return menuiserieClosetFactory.getSectionZone(this.uxmgr.getSelectedZone());
		    //return this.uxmgr.getSelectedZone();
		}

	    // Get the current drawer of zone. Return undefined if no drawer in zone
	    // [DEPRECATED] see _getSubItemByType().
		/*UXZone.prototype._getDrawerOf = function (zone) {
		    if (zone.getSubCount() > 0 && zone.getSub(0).getEzType && zone.getSub(0).getEzType() === 'DrawerGroup')
		        return zone.getSub(0);
		    else
		        return undefined;
		}*/

	    // Get sub-item of zone by type
	    // zone : (Zone) The owner of sub-items
	    // typOfItem : (String) ezType as is returned by getEzType() methods. Ex: 'DrawerGroup'
		UXZone.prototype._getSubItemByType = function (zone, typOfItem) {
		    var i, n = zone.getSubCount();
		    for (i = 0 ; i < n ; i++) {
		        if (zone.getSub(i).getEzType && zone.getSub(i).getEzType() === typOfItem)
		            return zone.getSub(i);
		    }

	        return undefined;
		}

        // Notify change to the view
		UXZone.prototype.notifyChange = function () {
		    //$log.debug(">> notifyChange")
		    var me = this;
		    var uxmgr = this.uxmgr;
		    var FHBackPanelMode = _UXMgr.compound.getClosetModel().FHBackPanelMode;
		    me._resolvesZones();
		    me.lockDimUpdate = true;

		    var zonBelow = me.zones.section ? menuiserieClosetBrowser.getZoneBelow(me.zones.section) : undefined;
		    var zonAbove = me.zones.section ? menuiserieClosetBrowser.getZoneAbove(me.zones.section) : undefined;

		    me.isEnabled = me.zones.selected && !me.zones.selected.isOff;

            // Zone title
		    me.title = me.zones.selected ? me.zones.selected.title : '(no zone)';		        

		    // Dimension of zone
		    me.canSetWidthAutoSize = me.zones.module && !menuiserieClosetBrowser.isFirstZone(me.zones.module);
		    me.widthAutoSize = me.zones.module && me.zones.module.hasXDimAuto;
		    me.canSetHeightAutoSize = me.isEnabled && !menuiserieClosetBrowser.isFirstZone(me.zones.section) && ((zonBelow && !zonBelow.isOff) || (zonAbove && !zonAbove.isOff));
		    me.heightAutoSize = me.isEnabled && me.zones.section && me.zones.section.hasYDimAuto;
            		    
		    me._notifyDimBoundsChange(me.zones.selected);
		    me._notifyWidthChange(me.zones.module);
		    me._notifyHeightChange(me.zones.section);
		    		    		    
		    // Splitting
		    me.canSplitVerticaly = me.isEnabled && me.zones.hsplittable && me.zones.hsplittable.isEmpty();
		    if (!FHBackPanelMode)
		        me.canSplitHorizontaly = me.isEnabled && me.zones.vsplittable && me.zones.vsplittable.isEmpty();
		    else
		        me.canSplitHorizontaly = me.isEnabled && me.zones.vsplittable && me.zones.selected.isEmpty();

		    // Deleting
		    me.canDeleteLeftSep = me.isEnabled && me.canDeleteLeftSeparator(me.zones.module);
		    me.canDeleteRightSep = me.isEnabled && me.canDeleteRightSeparator(me.zones.module);
		    me.canDeleteBottomSep = me.isEnabled && me.canDeleteBottomSeparator(me.zones.section, zonBelow);
		    me.canDeleteTopSep = me.isEnabled && me.canDeleteTopSeparator(me.zones.section, zonAbove);

		    // Back panel
		    me.canChangeBackPanel = me.isEnabled && me.zones.selected && !me.zones.selected.isSplitted();

		    // Drawer model, back-panel model, zone dimension input
		    if (me.isEnabled && me.zones.selected) {
                // Drawers
		        var drawer = me._getSubItemByType(me.zones.selected, 'DrawerGroup');
		        me.uxDrawer.notifyChange(drawer);

		        // Hanging-bar
		        var hangingBar = me._getSubItemByType(me.zones.selected, 'HangingBar');
		        me.uxHangingBar.notifyChange(hangingBar)

                // Back-panel properties
		        if (me.zones.backPanelRoot) {
		            var C = me.zones.backPanelRoot.getCompound();
		            var BP = menuiserieClosetBrowser.getBackPanel(me.zones.backPanelRoot);
		            me.selectedBackModel = BP.getMaterialModel();
		            me.selectedBackColour = (BP.getColour() === C.defaultColour ? null : BP.getColour());
		        }
		        else {
		            me.selectedBackModel = menuiserieDataFactory.getBackPanelModelTable()[0];
		            me.selectedBackColour = null;
		        }
		    }

		    me.lockDimUpdate = false;
		}

	    // Update dimension. Dimension change handler.
		UXZone.prototype.updateDimension = function () {
		    var me = this;
		    if (!me.uxmgr.hasSelectedZone() || me.lockDimUpdate) return; // no zone selected

		    me._resolvesZones(); // Required because cans be raised on zone selection !

		    var scope = me.uxmgr.scope;
		    var moduleZone = me.zones.module;
		    var sectionZone = me.zones.section; 
		    var wchanged = false;
		    var hchanged = false;

		    if (!me.widthAutoSize && scope.myZoneDimForm.zoneWidth.$valid) { // Not auto size and valid
		        wchanged = menuiserieClosetFactory.setZoneWidth(moduleZone, me.width);
		    }

		    if (!me.heightAutoSize && scope.myZoneDimForm.zoneHeight.$valid) { // Not auto size and valid
		        hchanged = menuiserieClosetFactory.setZoneHeight(sectionZone, me.height);
		    }

		    if (wchanged || hchanged) {
		        me.uxmgr.mustBeSaved();
		        me.uxmgr.updateBOMAndPrice();
		        me.scope.uxCloset.notifyChange();
		    }

		    me.uxmgr.errorMsg = "";
		    //$log.debug(">> updateDimension <<")
		}

	    // Update width auto size. Use as click handler.
		UXZone.prototype.updateWidthAutoSize = function () {
		    var me = this;
		    if (!me.uxmgr.hasSelectedZone()) return; // no zone selected

		    var wzone = me.zones.module; // this.getModuleZone(); // Width auto-size must be setted on module

		    if (menuiserieClosetFactory.setZoneAutoSize(wzone, !me.widthAutoSize, me.maxWidth)) { // reverse auto-size
		        //me.lockDimUpdate = true;
		        me.widthAutoSize = !me.widthAutoSize;
		        me._notifyDimBoundsChange(me.zones.selected);
		        /*$timeout(function () {
		            me._notifyWidthChange(wzone);
		            me.lockDimUpdate = false;
		        }, 200);*/
		        this._notifyWidthChange(wzone);
		        me.scope.uxCloset.notifyChange();
		        me.uxmgr.mustBeSaved();
		    }

		    me.uxmgr.errorMsg = "";
		}

	    // Update height auto size. Use as click handler.
		UXZone.prototype.updateHeightAutoSize = function () {
		    if (!this.uxmgr.hasSelectedZone()) return; // no zone selected

		    var hzone = this.getSectionZone(); // Heigh auto-size must be setted on section

		    if (menuiserieClosetFactory.setZoneAutoSize(hzone, !this.heightAutoSize)) { // reverse auto-size
		        this.heightAutoSize = !this.heightAutoSize;
		        this._notifyHeightChange(hzone);
		        this._notifyDimBoundsChange(this.zones.selected);
		        this.scope.uxCloset.notifyChange();
		        this.uxmgr.mustBeSaved();
		    }

		    this.uxmgr.errorMsg = "";
		}

	    // Split selected zone vertically or horizontally
		UXZone.prototype.split = function (orient) {
		    var me = this;
		    if (!me.zones.selected) return; // no zone selected

		    var C = me.uxmgr.compound;
		    var FHBackPanelMode = C.getClosetModel().FHBackPanelMode;
		    var uxmgr = me.uxmgr;
		    //var zone = uxmgr.getSelectedZone();

		    var isValid;
		    if (orient === 'horizontal') {
		        isValid = menuiserieClosetValidator.canSplit(me.zones.selected, uxmgr.getZoneWidthRule().mini, C.getDefaultThickness(), orient);
		    }
		    else {
		        isValid = menuiserieClosetValidator.canSplit(me.zones.selected, uxmgr.getZoneHeightRule().mini, C.getDefaultThickness(), orient);
		    }

		    if (!isValid) {
		        uxmgr.errorMsg = "La zone ne peut plus être divisée car elle est trop petite.";
		        return;
		    }

		    //var parentSplitter = this.getParentSplitter(zone);

		    uxmgr.hideTree(C.zone);
		    var newSelectedZone;
		    if (orient === 'horizontal')
		        newSelectedZone = menuiserieClosetFactory.splitZone(2, me.zones.hsplittable, orient);
		    else {
		        if (!FHBackPanelMode)
		            newSelectedZone = menuiserieClosetFactory.splitZone(2, me.zones.vsplittable, orient);
		        else
		            newSelectedZone = menuiserieClosetFactory.splitZone(2, me.zones.selected, orient);
		    }
		    uxmgr.displayTree(C.zone);

		    uxmgr.selectZone(newSelectedZone); // new selection
		    uxmgr.scope.uxCloset.notifyChange();
		    uxmgr.mustBeSaved();
		    uxmgr.updateBOMAndPrice();

		    uxmgr.errorMsg = "";
		}

	    // Delete vertical separator
		UXZone.prototype.removeVerticalSeparator = function (separatorSide) {
		    var me = this;
		    if (!me.zones.selected) return; // no zone selected

		    var uxmgr = this.uxmgr;
		    var moduleZone = me.zones.module; // this.getModuleZone(); // For vertical separator, the module zone is required to make adjacent zone checking
		    //var parentSplitter = moduleZone.parentZone.splitter; //this.getParentSplitter(zone);

		    // check if two zone are empty
		    if (!moduleZone.isEmpty()) {
		        var PSp = moduleZone.parentZone.splitter;
		        var zonIdx = PSp.getSubZoneIndex(moduleZone);
		        var adjZonIdx = PSp.getAdjSubZoneIndex(zonIdx, separatorSide);
		        if (!PSp.subZones[adjZonIdx].isEmpty()) {
		            //if (!menuiserieClosetFactory.canMergeVerticalZone(moduleZone, separatorSide)) {
		            alert("Les 2 modules doivent être vide pour pouvoir supprimer le séparateur.");
		            return;
		            //}
		        }
		    }

		    var rootOfDisplay = moduleZone.getCompound().zone; //moduleZone.parentZone;
		    uxmgr.hideTree(rootOfDisplay);
		    var newSelectedZone = menuiserieClosetFactory.removeSeparator(moduleZone, separatorSide);
		    uxmgr.displayTree(rootOfDisplay);

		    uxmgr.selectZone(newSelectedZone);
		    this.scope.uxCloset.notifyChange();
		    uxmgr.mustBeSaved();
		    uxmgr.updateBOMAndPrice();

		    uxmgr.errorMsg = "";
		}

	    // Delete horizontal separator
		UXZone.prototype.removeHorizontalSeparator = function (separatorSide) {
		    var me = this;
		    if (!me.zones.selected) return; // no zone selected

		    var uxmgr = this.uxmgr;
		    var sectionZone = me.zones.section; //this.getSectionZone();
		    var parentSplitter = sectionZone.parentZone.splitter;

		    // check if two zone are empty
		    if (sectionZone.hasContent()) {
		        var zonIdx = parentSplitter.getSubZoneIndex(sectionZone);
		        var adjZonIdx = parentSplitter.getAdjSubZoneIndex(zonIdx, separatorSide);
		        if (parentSplitter.subZones[adjZonIdx].hasContent()) {
		            alert("Les 2 sections doivent être vide pour pouvoir supprimer le séparateur.");
		            return;
		        }
		    }

		    var rootOfDisplay = me.zones.module; // this.getModuleZone(); // Hide module splitter in case of last shelf removing
		    uxmgr.hideTree(rootOfDisplay);
		    var newSelectedZone = menuiserieClosetFactory.removeSeparator(sectionZone, separatorSide);
		    uxmgr.displayTree(rootOfDisplay);

		    uxmgr.selectZone(newSelectedZone); // select section zone
		    this.scope.uxCloset.notifyChange();
		    uxmgr.mustBeSaved();
		    uxmgr.updateBOMAndPrice();

		    uxmgr.errorMsg = "";
		}

	    // Back-panel process in zone
		UXZone.prototype.changeBackModel = function () {
		    var me = this;
		    if (!me.zones.selected) return; // no zone selected

		    var uxmgr = me.uxmgr;
		    var selZone = me.zones.selected;
		    var bpRootZone = me.zones.backPanelRoot;

		    var FHBackPanelMode = selZone.getCompound().getClosetModel().FHBackPanelMode;
		    var rootOfDisplay;
            
		    if (!FHBackPanelMode)
		        rootOfDisplay = bpRootZone || selZone;
		    else
               rootOfDisplay = me.zones.hsplittable;                    

		    var backModel = me.selectedBackModel;

		    var newSelectedZone = selZone;

		    if (backModel.Id > 0) { // set back-model
		        
		        // Check if can change panel according to zone content
		        if (selZone.hasContent()) {
		            if (!menuiserieClosetValidator.canSetBackPanel(selZone, backModel, uxmgr.getClosetDepthRule().mini)) {
		                uxmgr.errorMsg = "La profondeur du placard est trop petite. Le fond ne peut pas être appliqué.";
		                if (bpRootZone)
		                    me.selectedBackModel = menuiserieClosetBrowser.getBackPanel(bpRootZone).getMaterialModel();
		                else
		                    me.selectedBackModel = menuiserieDataFactory.getBackPanelModelTable()[0];
		                return;
		            }
		        }

		        uxmgr.hideTree(rootOfDisplay);

		        if (!bpRootZone) {
		            if (!FHBackPanelMode)
		                newSelectedZone = menuiserieClosetFactory.createBackPanel(selZone, backModel);
		            else {
		                if (selZone.getCompound().getClosetModel().ModelClass !== 'FullVerPrior')
		                    newSelectedZone = menuiserieClosetFactory.createBackPanel(me.zones.hsplittable, backModel);
		                else // Select the middle zone
		                    newSelectedZone = menuiserieClosetFactory.createBackPanel(me.zones.hsplittable, backModel); // FIX#39 full-height Backpanel
		                    //newSelectedZone = menuiserieClosetFactory.createBackPanel(me.zones.hsplittable.splitter.getSubZone(1), backModel); // Does not work if alreay has shelf in zone
		            }
		        }
		        else {
		            var BP = menuiserieClosetBrowser.getBackPanel(bpRootZone);
		            BP.setMaterialModel(backModel);
		            bpRootZone.update();
		        }
		    }
		    else { // remove back-model

		        uxmgr.hideTree(rootOfDisplay);

		        if (bpRootZone) {
		            //newSelectedZone = menuiserieClosetFactory.removeBackPanel(bpRootZone);

		            menuiserieClosetFactory.removeBackPanel(bpRootZone);
		            if (bpRootZone.isSplitted() && bpRootZone.splitter.getOrientation() === 'vertical') // FHBackPanelMode activate
		                newSelectedZone = selZone;
		            else
		                newSelectedZone = bpRootZone;
		        }
		    }

		    me.scope.uxCloset.notifyChange();
		    uxmgr.displayTree(rootOfDisplay);
		    uxmgr.selectZone(newSelectedZone);
		    uxmgr.mustBeSaved();
		    uxmgr.updateBOMAndPrice();
		}

	    // Set back-panel colour
		UXZone.prototype.setBackColour = function (clr) {
		    var me = this;
		    if (!me.zones.backPanelRoot) return; // no zone selected

		    var uxmgr = me.uxmgr;

		    var C = me.zones.backPanelRoot.getCompound();
		    var backPanel = menuiserieClosetBrowser.getBackPanel(me.zones.backPanelRoot);

		    var colour;
		    if (clr && backPanel.getColour().Id !== clr.Id) { // Apply colour
		        colour = clr;
		        me.selectedBackColour = clr;
		        backPanel.hasOwnColour(true);
		    }
		    else { // Default coulour
		        colour = C.defaultColour;
		        me.selectedBackColour = null;
		        backPanel.hasOwnColour(false);
		    }

		    colour.load().then(function () {
		        backPanel.setColour(colour);
		        uxmgr.mustBeSaved();
		        uxmgr.updateBOMAndPrice();
		    });
		}

        //#endregion

	    //#region UXAddon class
		var UXAddon = function (uxMgr) {
		    this.uxMgr = uxMgr;
		    this.items;
		    this.categories;
		    this.selectedCategory;
		    this.showDialog = false;
		    this.cart;
		}

        // Load items from server
		UXAddon.prototype.loadItems = function () {
		    var me = this;

		    //me.isVisible = false;

		    menuiserieWebService.getAddons(me.selectedCategory.Id).then(function (response) {
		        var i, n;

		        me.items = response.data;
		        //me.uxMgr.scope.$digest();

		        n = response.data.length;
		        for (i = 0 ; i < n ; i++) {
		            me.items[i].Description = $sce.trustAsHtml(me.items[i].Description);
		        }

		        //me.isVisible = true;
		    },
            function (error) {
                throw new Error("[" + applicationName + "] Cannot load add-ons list.")
            });
		}

	    // Filter item by category
		UXAddon.prototype.categoryFilter = function (category) {
		    return function(item) {
		        if (category && (category.Id === 0 || item.CategoryId === category.Id))
		            return true;
		        else
		            return false;
		    }
		}

        // Load items from server only if are not loaded.
		UXAddon.prototype.lazyLoadItems = function () {
		    var me = this;

		    if (!me.items) {

		        menuiserieWebService.getAddonCategories().then(function (response) {
		            var i, n;

		            me.categories = [ { Id:0 , Title: "[-- Toutes --]" } ];
		            n = response.data.length;
		            for (i = 0 ; i < n ; i++)
		                me.categories.push(response.data[i]);

		            me.selectedCategory = me.categories[0];
		            me.loadItems();
		        },
                function (error) {
                    throw new Error("[" + applicationName + "] Cannot load add-on categories.")
                });
		    }
		}

	    // Add item in cart
		UXAddon.prototype.addInCart = function (item) {
		    var me = this;
		    me.uxMgr.project.cart.add(item);
		    me.uxMgr.updateBOMAndPrice();
		}

	    // Remove item from cart
		UXAddon.prototype.removeFromCart = function (item) {
		    var me = this;
		    me.uxMgr.project.cart.remove(item.Id);
		    me.uxMgr.updateBOMAndPrice();
		}

        // Update cart item
		UXAddon.prototype.updateCartItem = function (item) {
		    var me = this;
		    if (me.uxMgr.project.cart.updateQty(item))
		        me.uxMgr.updateBOMAndPrice();
		}

	    // Get cart
		UXAddon.prototype.getCart = function () { return this.uxMgr.project ? this.uxMgr.project.cart.items : [] }

	    // Return true if has categories
		UXAddon.prototype.hasCategories = function() { return this.categories && this.categories.length > 1 }

        //#endregion

	    //#region UXManager class
        // Constructor
		var UXManager = function (scope) {
		    var ENV = menuiserieEnv.getThreeEnv();

		    this.debug = 'off';

		    this.scope = scope;
		    this.project;
		    this.compound;
		    this.errorMsg = '';
		    this.shop;
		    this.brandId = 0;

		    this._raycaster = new THREE.Raycaster();
		    this._mousePos = new THREE.Vector3();
		    this._hilightedZone;
		    this._selectedZone;

		    // closet validation rules
		    this._closetWidthRule;
		    this._closetHeightRule;
		    this._closetDepthRule;
		    this._zoneWidthRule;
		    this._zoneHeightRule;

		    // Configurator options
		    this._hasAutoVSeparator = false;
		    this._hasAutoHSeparator = false;
		    this._DGWidthBehavior = 'ValidMiniOnly';
		    this._DGHeightBehavior = 'ValidMiniOnly';
		    this._userCanOperateBackPanel = true;
		    this._userCanColourBackPanel = true;

            // The BOM (set to scope last minute to optimize time)
		    this.BOM = [];

		    // Scope properties : debug 
		    //scope.dbgRayDir = "";
		    //scope.dbgRayPoint = "";
		    //scope.dbgIntersecteds = "";
		    
		    var me = this;
		    var _lastMDTime = 0;
            // Mousedown event handler (for click detection)
		    jQ(ENV.sceneContainer).bind('mousedown', function (e) {
		        _lastMDTime = e.timeStamp;
		    })

            // Click event handler
		    jQ(ENV.sceneContainer).bind('click', function (e) {
		        var deltaT = e.timeStamp - _lastMDTime;

		        if (deltaT < 250) { // Click is valid only if is quick (to do not confuse with OrbitControls event)
		            if (me._hilightedZone) { // do selection
		                me.selectZone(me._hilightedZone);
		                //scope.notifySelectionChange();
		            }
		            else // Do unselection
		                me.selectZone(undefined);

		            scope.$apply();
		        }
		    });

            // Mosemove event handler
		    jQ(ENV.sceneContainer).bind('mousemove', function (e) {
		        var w = ENV.getSceneWidth();
		        var h = ENV.getSceneHeight();
		        var mouse = me._mousePos;
		        var xOffs = ENV.getSceneCssOffs().left;
		        var yOffs = ENV.getSceneCssOffs().top;
		        mouse.x = ((e.clientX - xOffs) / w) * 2 - 1;
		        mouse.y = -((e.clientY - yOffs) / h) * 2 + 1;

		        var raycaster = me._raycaster;
		        raycaster.setFromCamera(mouse, ENV.camera);
		        
		        var intersects = raycaster.intersectObjects(ENV.scene.children);
		        me._hilightedZone = undefined;
		        scope.dbgIntersecteds = "";
		        if (intersects.length > 0) {

		            //var rpnt = intersects[0].point;
		            //scope.dbgRayPoint = "(" + rpnt.x + " ; " + rpnt.y + " ; " + rpnt.z + ")";

		            for (var i = 0 ; i < intersects.length && !me._hilightedZone ; i++) {
		                //scope.dbgIntersecteds = intersects[i].object.name + "; ";
		                if (intersects[i].object.userData.zone) {
		                    me._hilightedZone = intersects[i].object.userData.zone;
		                    jQ(ENV.sceneContainer).css('cursor', 'pointer');
		                }
		            }

		            if (!me._hilightedZone)
		                jQ(ENV.sceneContainer).css('cursor', 'default');
		        }
		        else {
		            jQ(ENV.sceneContainer).css('cursor', 'default');
		        }
		    });

		    // Scope properties
		    scope.colours;
		    scope.selectedColour;
		    scope.selectedMaterial; // Panel
		    scope.coloursWithNone;
		    scope.projectShop;
		    scope.isSaved = true;

		    // Scope properties : tab
		    scope.hasToolPanelShown = false;
		    scope.closetTabActive;
		    scope.zoneTabActive;
		    scope.drawerTabActive;

		    // Component tools in tool panel
		    this.componentTools = [];
		    this.selectedComponentTool;

		    // Dialogs
		    this.msgDialogIsShown = false;
		    this.dialogMsg = "";
            
		    // Pending oeration status
		    this.hasPendingOp = false;

		    this.hasOrderRedirection = false;
		}

	    // Get Compound
		UXManager.prototype.getCompound = function () { return this.compound }

	    // Get current project
		UXManager.prototype.getProject = function () { return this.scope.project }

	    // Get and set drawer-group width behavior
		UXManager.prototype.setDGWidthBehavior = function (behavior) { this._DGWidthBehavior = behavior }
		UXManager.prototype.getDGWidthBehavior = function () { return this._DGWidthBehavior }

	    // Get and set drawer-group height behavior
		UXManager.prototype.setDGHeightBehavior = function (behavior) { this._DGHeightBehavior = behavior }
		UXManager.prototype.getDGHeightBehavior = function () { return this._DGHeightBehavior }

	    // Get and set VAT rate in percent
		//UXManager.prototype.setVATRate = function (rate) { this.vatRate = rate }
	    //UXManager.prototype.getVATRate = function() { return this.vatRate }

        // Set the must-be-saved flag to true.
		UXManager.prototype.mustBeSaved = function () {
		    if (this.debug === 'off')
		        this.scope.isSaved = false;
		}

	    // Update the BOM and price
		UXManager.prototype.updateBOMAndPrice = function () {
		    var scope = this.scope;
		    var bom = menuiserieClosetFactory.getBOM(scope.project);
		    var vatRate = scope.project.getVATRate();
		    this.BOM = bom.getItems();

		    var totalPrice = bom.getTotalPrice();

		    scope.exVattotalPrice = totalPrice;
		    scope.vattotalPrice = totalPrice * (1 + (vatRate / 100));
		}
		
        // Prepare the component tools for tool panel
		UXManager.prototype.prepareComponentTools = function (hasDrawers, hasHangingBars) {
		    this.componentTools = [];

		    if (hasDrawers)
		        this.componentTools.push({ id: 0, title: "Tiroirs", html: "/html/drawer-component.html", isEnabled: true });

		    if (hasHangingBars)
		        this.componentTools.push({ id: 1, title: "Penderies", html: "/html/hangingBar-component.html", isEnabled: true });

		    if (this.componentTools.length > 0)
		        this.selectedComponentTool = this.componentTools[0];
		    else
		        this.selectedComponentTool = undefined;
		}

        //#region Visualization tree methods

        // Display recursively tree from node object o.
		UXManager.prototype.displayTree = function (o) {
		    var i, n;

		    if (!o) return;

		    if (o.display) // IVisualizable
		        o.display();

		    if (o.getSub) { // IContainer
		        n = o.getSubCount();
		        for (i = 0 ; i < n ; i++)
		            this.displayTree(o.getSub(i));
		    }

		    if (o.getSubZone) { // IZoneContainer
		        n = o.getSubZoneCount();
		        for (i = 0 ; i < n ; i++)
		            this.displayTree(o.getSubZone(i));
		    }
		}

	    // Hide recursively tree from node object o.
		UXManager.prototype.hideTree = function (o) {
		    var i, n;

		    if (o.hide) // IVisualizable
		        o.hide();

		    if (o.getSub) { // IContainer
		        n = o.getSubCount();
		        for (i = 0 ; i < n ; i++)
		            this.hideTree(o.getSub(i));
		    }

		    if (o.getSubZone) { // IZoneContainer
		        n = o.getSubZoneCount();
		        for (i = 0 ; i < n ; i++)
		            this.hideTree(o.getSubZone(i));
		    }
		}

	    // Set the scene mode of current env
		UXManager.prototype.setSceneMode = function (mode) {
		    var i;
		    var ENV = menuiserieEnv.getThreeEnv();

		    if (ENV.sceneMode === mode) return; // no change

		    if (mode === 'work') {
		        ENV.sceneMode = mode;
		    }
		    else if (mode === 'rendering') {
		        ENV.sceneMode = mode;
		    }
		    else
		        throw new Error("[" + applicationName + "] Unsupported mode '" + mode + "'. Cannot change the scene mode.");

		    var C = this.compound;
		    var G = this.scope.project.getGround();
		    var exp = menuiserieClosetFactory.getExplorer();

		    // update ground visualisation
		    G.hide(); G.display();

		    // update 3D materials of gzone
		    var f = function (item) {
		        if (item.updateThreeMat)
		            item.updateThreeMat();
		    }
		    exp.doActionOnTree(C.gzone, f);
		    exp.doActionOnTree(C.zone, f);
		}

        //#endregion

	    //#region Selection methods

	    // Select the specified zone
		UXManager.prototype.selectZone = function (zone) {
		    var hasSelectedZone = angular.isDefined(this._selectedZone);

		    if (this._selectedZone) // unselect
		        this._selectedZone.unselect();

		    this._selectedZone = zone;

		    if (zone) { // Selection
		        this.setSceneMode('work');
		        zone.select();
		    }
		    else { // Unselection
		        this.setSceneMode('rendering');
		        this._hilightedZone = undefined;
		        this._selectedZone = undefined;
		    }

		    var nextActiveTab;
		    if (hasSelectedZone) {
		        if (zone)
		            nextActiveTab = '';
		        else
		            nextActiveTab = 'closetTab'
		    }
		    else {
		        if (zone)
		            nextActiveTab = 'zoneTab';
		        else
		            nextActiveTab = '';
		    }
		    this._onSelectionChanged(nextActiveTab);
		}

	    // On selection change
		UXManager.prototype._onSelectionChanged = function (nextActiveTab) {
		    var me = this;
		    var scope = me.scope;
		    var zone = me._selectedZone;

		    if (nextActiveTab !== '')
		        me.toggleToolPanel(nextActiveTab);

		    scope.uxZone.notifyChange();

		    /*if (zone) {
		        $log.debug("Zone '" + zone.title + "' was selected. Is back-panel zone : " + ((zone.parentZone && zone.parentZone.backPanelZone === zone) ? "YES" : "NO"));
		    }*/

		    /*if (!zone) { // unselection
		        me.toggleToolPanel('closetTab');
		    }
		    else {
		        me.toggleToolPanel('zoneTab');
		        scope.uxZone.notifyChange();
		    }*/
		}

        // Return true if has selected zone
		UXManager.prototype.hasSelectedZone = function () { return this._selectedZone ? true : false }

	    // Return the selected zone, or undefined if has no zone selected.
		UXManager.prototype.getSelectedZone = function () { return this._selectedZone }

	    // Get the first module zone
		UXManager.prototype.get1stModuleZone = function () {
		    var zone = this.compound.zone.splitter.subZones[0];
		    if (zone.splitter)
		        return zone.splitter.subZones[0];
		    else
		        return zone;
		}

	    // Active the specified tab
		UXManager.prototype.activeTab = function (tabName) {
		    var scope = this.scope;

		    scope.closetTabActive = (tabName === 'closetTab');
		    scope.zoneTabActive = (tabName === 'zoneTab');
		    scope.drawerTabActive = (tabName === 'drawerTab');
		}

	    // Get current active tab name
		UXManager.prototype.getCurrentTab = function () {
		    var scope = this.scope;

		    if (scope.closetTabActive) return 'closetTab';
		    if (scope.zoneTabActive) return 'zoneTab';
		    if (scope.drawerTabActive) return 'drawerTab';

		    return ''; // No current tab !
		}

	    // Show or hide the tool panel
		UXManager.prototype.toggleToolPanel = function (tabName, canClose) {
		    var scope = this.scope;

		    if (!scope.hasToolPanelShown && scope.canEditProject) // Tool panel is closed
		        scope.hasToolPanelShown = true; // Always open
		    else // Tool panel is opened
		    {
		        if (this.getCurrentTab() === tabName && canClose) // If click on current tab, close it
		            scope.hasToolPanelShown = false;
		    }

		    this.activeTab(tabName);
		}
        //#endregion

	    //#region Closet model

		UXManager.prototype.setClosetModel = function (closetModel) {
		    var me = this;
		    me.setClosetWidthRule(closetModel.MinClosetWidth, closetModel.MaxClosetWidth);
		    me.setClosetHeightRule(closetModel.MinClosetHeight, closetModel.MaxClosetHeight);
		    me.setClosetDepthRule(closetModel.MinClosetDepth, closetModel.MaxClosetDepth);
		    me.setZoneWidthRule(closetModel.MinZoneWidth);
		    me.setZoneHeightRule(closetModel.MinZoneHeight);

		    // Drawer-group behaviour depending on model
		    me.setDGWidthBehavior(closetModel.DGWidthBehaviorLabel);
		    me.setDGHeightBehavior(closetModel.DGHeightBehaviorLabel);

		    me._userCanOperateBackPanel = closetModel.UserCanOperateBackPanel;
		    me._userCanColourBackPanel = closetModel.UserCanColourBackPanel;
		}

		UXManager.prototype.userCanOperateBackPanel = function () {
		    var me = this;
		    if (!me.scope.currentMember) return me._userCanOperateBackPanel;

		    if (me.scope.currentMember.RoleWeight < 50)
		        return me._userCanOperateBackPanel;
		    else
		        return true;
		}

		UXManager.prototype.userCanColourBackPanel = function () {
		    var me = this;
		    if (!me.scope.currentMember) return me._userCanColourBackPanel;

		    if (me.scope.currentMember.RoleWeight < 50)
		        return me._userCanColourBackPanel;
		    else
		        return true;
		}
		
	    // Set closet validations rules
		UXManager.prototype.setClosetWidthRule = function (min, max) { this._closetWidthRule    = { mini: min, maxi: max } }
		UXManager.prototype.setClosetHeightRule = function (min, max) { this._closetHeightRule  = { mini: min, maxi: max } }
		UXManager.prototype.setClosetDepthRule = function (min, max) { this._closetDepthRule    = { mini: min, maxi: max } }
		UXManager.prototype.setZoneWidthRule = function (min) { this._zoneWidthRule             = { mini: min, maxi: Infinity } }
		UXManager.prototype.setZoneHeightRule = function (min) { this._zoneHeightRule           = { mini: min, maxi: Infinity } }

	    // Get closet validations rules
		UXManager.prototype.getClosetWidthRule = function () { return this._closetWidthRule }
		UXManager.prototype.getClosetHeightRule = function () { return this._closetHeightRule }
		UXManager.prototype.getClosetDepthRule = function () { return this._closetDepthRule }
		UXManager.prototype.getZoneWidthRule = function () { return this._zoneWidthRule }
		UXManager.prototype.getZoneHeightRule = function () { return this._zoneHeightRule }

	    // Get and set auto vertical separator statut
		UXManager.prototype.hasAutoVSeparator = function () { return this._hasAutoVSeparator }
		UXManager.prototype.setHasAutoVSeparator = function (enabled) { this._hasAutoVSeparator = enabled }

	    // Get and set auto horizontal separator statut
		UXManager.prototype.hasAutoHSeparator = function () { return this._hasAutoHSeparator }
		UXManager.prototype.setHasAutoHSeparator = function (enabled) { this._hasAutoHSeparator = enabled }

	    // Create args for menuiserieClosetValidator.getClosetDimensionBounds() method.
		UXManager.prototype.createClosetValidatorDimArgs = function () {
		    var a = {
		        compound: this.compound,
		        closetWidthRule: this.getClosetWidthRule(),
		        closetHeightRule: this.getClosetHeightRule(),
		        closetDepthRule: this.getClosetDepthRule(),
		        zoneWidthRule: this.getZoneWidthRule(),
		        zoneHeightRule: this.getZoneHeightRule()
		    }
		    return a;
		}

	    //#endregion

	    //#region Dialog methods

		UXManager.prototype.openMsgDialog = function (msg) {
		    this.scope.showBgDialog = true;
		    this.dialogMsg = msg;
		    this.msgDialogIsShown = true;
		}

		UXManager.prototype.closeMsgDialog = function () {
		    this.msgDialogIsShown = false;
		    this.scope.showBgDialog = false;
		    this.dialogMsg = "";
		}

	    //#endregion

	    //#region Pending operation status

		UXManager.prototype.startPendingOp = function () { this.hasPendingOp = true }
		UXManager.prototype.stopPendingOp = function () { this.hasPendingOp = false }

	    //#endregion

	    //#region Order button

        // Set the state of order redirection behavior. If true redirect to external web site for complete order.
		UXManager.prototype.setHasOrderRedirection = function (b) { this.hasOrderRedirection = b }

	    // Order closet according to current hasOrderRedirection state. use it in clic event handler of ORDER button.
		UXManager.prototype.orderCloset = function () {
		    var me = this;
		    var scope = me.scope;

		    menuiserieWebService.isAuthenticate().then(function (response) {
		        if (!response.data) {
		            scope.openLoginDialog(true);
		            return;
		        }

		        if (!scope.isSaved || me.getProject().getId() === 0) { // Must be save before
		            scope.openSaveDialog();
		        }
		        else {
		            if (me.hasOrderRedirection) {
		                $window.location.href = menuiserieWebService.getOrderRedirectionSvcUrl(scope.project.getId());
		            }
		            else {
		                // TODO : fast order.
		                $window.location.href = "/umbraco#/" + applicationName + "/MainTree/projectList/Projects-" + me.brandId;
		            }
		        }
		    })
		}

        //#endregion

	    //#endregion

	    // The UXMgr
		var _UXMgr;

	    // The models
		var _UXCloset;
		var _UXZone;
		var _UXAddon;

		return {

            // Init UX manager
			initUXManager: function (scope, debug) {
			    _UXMgr = new UXManager(scope);
			    _UXAddon = new UXAddon(_UXMgr);
			    if (debug) _UXMgr.debug = debug;
			    scope.uxMgr = _UXMgr;
			    scope.uxAddon = _UXAddon;
			    return _UXMgr;
			},

		    // Set the current project
			setCurrentProject: function (project) {
			    if (!_UXMgr) throw new Error("[" + applicationName + "] UX manager is not initialized. Call menuiserieUXFactory.initUXManager() method before.");

			    _UXMgr.project = project;
			},

		    // Set the current compound
			setCurrentCompound: function (compound) {
			    if (!_UXMgr) throw new Error("[" + applicationName + "] UX manager is not initialized. Call menuiserieUXFactory.initUXManager() method before.");

			    _UXMgr.compound = compound;

			    // The models in the scope
			    _UXMgr.scope.uxCloset = _UXCloset = new UXCloset(_UXMgr);
			    _UXMgr.scope.uxZone = _UXZone = new UXZone(_UXMgr);
			},

            // Return the current UXMgr
			getUXMgr: function () {
			    if (!_UXMgr) throw new Error("[" + applicationName + "] UX manager is not initialized. Call menuiserieUXFactory.initUXManager() method before.")
			    return _UXMgr;
			},

		}

	}

	//registration
	thisModule.factory('menuiserieUXFactory', [
        "$timeout",
        "$filter",
        "$log",
        "$sce",
        "$window",
		"menuiserieEnv",
        "menuiserieWebService",
        "menuiserieDataFactory",
        "menuiserieClosetBrowser",
        "menuiserieClosetFactory",
        "menuiseriePanelFactory",
        "menuiserieCompoundFactory",
        "menuiserieHangingBarFactory",
        "menuiserieProjectFactory",
        "menuiserieBoundValidator",
        "menuiserieClosetValidator",
        UXFactory
	]);

    //#endregion

    //#region Animations
    
	function toolPanelAnimation()
	{
	    return {
	        addClass: function (element, className, doneFn) {
	            jQ(element).animate({ 'right': 0 }, 'normal', doneFn);
	        },

	        removeClass: function (element, className, doneFn) {
	            jQ(element).animate({ 'right': '-480px' }, 'normal', doneFn);
	        }
	    }
	}

	function pricePanelAnimation() {
	    return {
	        addClass: function (element, className, doneFn) {
	            jQ(element).animate({ 'right': '480px' }, 'normal', doneFn);
	        },

	        removeClass: function (element, className, doneFn) {
	            jQ(element).animate({ 'right': 0 }, 'normal', doneFn);
	        }
	    }
	}

    //registration
	thisModule.animation('.anim-showToolPanel', [toolPanelAnimation]);
	thisModule.animation('.anim-showPricePanel', [pricePanelAnimation]);

    //#endregion

})();
