/* simonMenuiserie Core v.0.3 */
'use strict';
(function () {

    var thisModule = angular.module('simonMenuiserie.Core', []);

    var jQ = jQuery; // jQuery shortcut

    // Convenient method to check parameter definition
    var __checkParameterDefined = function (param, name) {
        if (angular.isUndefined(param) || param === null)
            throw new Error("[" + applicationName + "] Parameter '" + name + "' is not defined.");
    }

    //#region Constants

    function constants() {
        return {
            // Closet item kinds
            Kinds: { None: 0, Left: 1, Right: 2, Top: 3, Bottom: 4, Back: 5, Separator: 6, Shelf: 7, DrawerGroup: 8 }
        }
    }

    //registration
    thisModule.factory('menuiserieConst', constants);

    //#endregion

    //#region Core environment

    function environment($log, $q) {

        var _vector = new THREE.Vector3();
        //var _projector = new THREE.Projector();

        //#region ThreeEnvironment class
        // Class definition for 3D ThreeEnvironment. It is a wrapper for ThreeJS components.
        // args: {
        //  sceneSelector : the jQuery selector for the ThreeJS scene. Generaly a div element.
        //  hasAntialias : (optional) true if antialiasing is enabled. Default is true.
        // }
        var ThreeEnvironment = function (args) {

            if (!args.sceneSelector)
                throw new Error("[" + applicationName + "] Missing 'sceneSelector' parameter.");

            this.sceneContainer = jQ(args.sceneSelector);

            if (this.sceneContainer.length == 0)
                throw new Error("[" + applicationName + "] Cannot find DOM element specified with '" + args.sceneSelector + "'.");

            var hasAntialias = true;
            if (!angular.isUndefined(args.hasAntialias))
                hasAntialias = args.hasAntialias;

            // The scene
            this.scene = new THREE.Scene();

            // Global position of scene contaienr
            var _sceneContainerOffs = jQ(this.sceneContainer).offset();
            this.getSceneCssOffs = function () { return _sceneContainerOffs }

            // Scene Size
            //var sw = jQ(this.sceneContainer).width();
            //var sh = jQ(this.sceneContainer).height()
            this.getSceneWidth = function () { return jQ(this.sceneContainer).width() }
            this.getSceneHeight = function () { return jQ(this.sceneContainer).height() } // HACK : use jQ(window).height() to make fluid page

            // The camera
            this.camera = new THREE.PerspectiveCamera(45, this.getSceneWidth() / this.getSceneHeight(), 10, 10000);
            this.camera.position.x = 158;
            this.camera.position.y = 139;
            this.camera.position.z = 453;

            // The renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: hasAntialias });
            this.renderer.setSize(this.getSceneWidth(), this.getSceneHeight());
            this.renderer.shadowMapEnabled = true;
            // this.renderer.shadowMapCullFace = THREE.CullFaceBack;
            this.renderer.setClearColor(0xf1f1f1, 1);
            $(this.renderer.domElement).appendTo(this.sceneContainer);

            //// AO {
            /*
            this.scene.fog = new THREE.Fog(0x000000, 10, 10000);

            this.renderer.gammaInput = true;
            this.renderer.gammaOutput = true;
            this.renderer.physicallyBasedShading = true;

            // depth
            var depthShader = THREE.ShaderLib["depthRGBA"];
            var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);
            this.depthMaterial = new THREE.ShaderMaterial({ fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms });
            this.depthMaterial.blending = THREE.NoBlending;

            // postprocessing
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

            this.depthTarget = new THREE.WebGLRenderTarget(this.getSceneWidth(), this.getSceneHeight(), { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });

            var effect = new THREE.ShaderPass(THREE.SSAOShader);
            effect.uniforms['tDepth'].value = this.depthTarget;
            effect.uniforms['size'].value.set(this.getSceneWidth(), this.getSceneHeight());
            effect.uniforms['cameraNear'].value = this.camera.near;
            effect.uniforms['cameraFar'].value = this.camera.far;
            //effect.uniforms['fogNear'].value = this.scene.fog.near;
            //effect.uniforms['fogFar'].value = this.scene.fog.far;
            //effect.uniforms['fogEnabled'].value = 1;
            effect.uniforms['aoClamp'].value = 0.5;
            effect.renderToScreen = true;
            this.composer.addPass(effect);
            */
            //// } AO

            // Resize management
            var me = this;
            jQ(window).resize(function () {
                var w = me.getSceneWidth();
                var h = me.getSceneHeight();
                me.renderer.setSize(w, h);
                me.camera.aspect = w / h;
                me.camera.updateProjectionMatrix();
            });

            // Global light
            this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
            this.scene.add(this.hemisphereLight);

            // Main spotlight
            this.spotlight = new THREE.SpotLight(0xffffff);
            this.spotlight.position.set(200*6, 280*6, 200*6);            
            this.spotlight.intensity = 0.9;
            this.spotlight.rotationAutoUpdate = false;
            this.spotlight.angle = Math.PI / 12;
            // must enable shadow casting ability for the light
            this.spotlight.castShadow = true;
            this.spotlight.shadowMapWidth = 1024;
            this.spotlight.shadowMapHeight = 1024;
            this.spotlight.shadowBias = 0.0001;
            this.spotlight.shadowCameraVisible = false;
            this.spotlight.shadowDarkness = 0.20;
            this.spotlight.shadowCameraFar = 1000*6;
            this.spotlight.shadowCameraNear = 400;
            //this.scene.add(this.spotlight);
            this.camera.add(this.spotlight);
            this.scene.add(this.camera);

            // Additional spotlight
            /*var spot = new THREE.SpotLight(0xffffff);
            spot.position.set(-200, 280, 200);
            spot.shadowCameraVisible = true;
            spot.shadowDarkness = 0.55;
            spot.intensity = 0.5;
            spot.shadowCameraFar = 800;
            spot.shadowCameraNear = 100;
            spot.rotationAutoUpdate = false;
            spot.angle = Math.PI / 12;
            // must enable shadow casting ability for the light
            spot.castShadow = true;
            this.camera.add(spot);
            //this.scene.add(spot);*/


            // The view control
            this.viewControls = new THREE.OrbitControls(this.camera, this.sceneContainer[0]);
            this.viewControls.target.set(0, 0, 0);
            this.viewControls.noZoom = false;
            this.viewControls.noPan = false;
            this.viewControls.autoRotate = false;
            this.viewControls.staticMoving = false;
            this.viewControls.dynamicDampingFactor = 0.15;
            this.viewControls.minDistance = 250;
            this.viewControls.maxDistance = 700;
            this.viewControls.maxPolarAngle = Math.PI / 2; // Don't go underground

            // The current scene mode 'work' or 'rendering'
            this.sceneMode = 'rendering';

            // The screenshot management
            this._screenShotRequested = false;

            // The frame loop
            var _animate = function () {
                requestAnimationFrame(_animate);

                //// AO {
                //me.scene.overrideMaterial = me.depthMaterial;
                //// } AO
                me.renderer.render(me.scene, me.camera, me.depthTarget);
                if (me._screenShotRequested)
                {
                    me._screenShotRequested = false;
                    me._screenShotDefer.resolve(me.renderer.domElement.toDataURL('image/jpeg', 0.5));
                }

                //// AO {
                /*me.scene.overrideMaterial = null;
                me.composer.render();*/
                //// } AO
            }

            // start
            _animate();
        }

        // Reset the point of view
        ThreeEnvironment.prototype.resetView = function () {
            this.viewControls.reset();
            this.viewControls.update();
        }

        // Convert 3d point to 2d point in canvas
        ThreeEnvironment.prototype.toCanvasCoord = function (pos3d) {
            _vector = pos3d.project(this.camera);
            var halfWidth = this.getSceneWidth() / 2;
            var halfHeight = this.getSceneHeight() / 2;

            _vector.x = (_vector.x * halfWidth) + halfWidth;
            _vector.y = -(_vector.y * halfHeight) + halfHeight;

            return {
                x: _vector.x,
                y: _vector.y
            }
        }

        // Take a screen shot of current 3D view
        ThreeEnvironment.prototype.takeScreenShot = function () {
            this._screenShotDefer = $q.defer();
            this._screenShotRequested = true;
            return this._screenShotDefer.promise;
        }

        //#endregion

        //#region Environment variable
        var _menuiserieKey;
        var _menuiserieUmbPageNodeId;

        // The material of panel in 'work' mode
        var _workPanelMat = new THREE.MeshLambertMaterial({ color: 0x777777 });

        // Material of auto zone
        var _autoZoneMat = new THREE.MeshLambertMaterial({ color: 0x52e700 });
        _autoZoneMat.transparent = true;
        _autoZoneMat.opacity = 0.40;

        // Material of fixed zone
        var _fixedZoneMat = new THREE.MeshLambertMaterial({ color: 0xff1515 });
        _fixedZoneMat.transparent = true;
        _fixedZoneMat.opacity = 0.40;

        // Zone selection color
        var _zoneSelectionColor = new THREE.Color(0xFFFFFF);

        // Color of ground grid in 'work' mode
        var _workGroundGridColor = new THREE.Color(0xFF0000);

        //#endregion

        // ThreeEnvironment variable
        var _ThreeEnv;

        // Return the threeJSHelper
        return {

            // Initialize a new ThreeEnvironment.
            init: function (args) {
                if (!args.menuiserieKey)
                    throw new Error("[" + applicationName + "] The menuiserie key is not defined. Configurator cannot start. Check menuiserieKey args property.");

                if (!args.menuiserieUmbPageNodeId)
                    throw new Error("[" + applicationName + "] The menuiserie page node id is not defined. Configurator cannot start. Check menuiserieUmbPageNodeId args property.");

                _menuiserieKey = args.menuiserieKey;
                _menuiserieUmbPageNodeId = args.menuiserieUmbPageNodeId;
                _ThreeEnv = new ThreeEnvironment(args.threeEnv);
            },

            // Get menuiserie key used in web service authentication
            getMenuiserieKey: function () {
                if (!_menuiserieKey) throw new Error("[" + applicationName + "] The menuiserie key is not defined.");
                return _menuiserieKey
            },

            // Get menuiserie page node id currently used by configurator (content node umbraco)
            getMenuiserieUmbPageNodeId: function () {
                if (!_menuiserieUmbPageNodeId) throw new Error("[" + applicationName + "] The menuiserie page node id is not defined.");
                return _menuiserieUmbPageNodeId;
            },

            // Get the current ThreeEnvironment
            getThreeEnv: function () {
                if (!_ThreeEnv) throw new Error("[" + applicationName + "] ThreeEnvironment is not initialized. Call menuiserieEnv.init() before.");
                return _ThreeEnv
            },

            // Set color of conception.
            setWorkPanelColor: function (colorAsInt) { _workPanelMat.color.setHex(colorAsInt) },
            setFixedZoneColor: function (colorAsInt) { _fixedZoneMat.color.setHex(colorAsInt) },
            setAutoZoneColor: function (colorAsInt) { _autoZoneMat.color.setHex(colorAsInt) },
            setZoneSelectionColor: function (colorAsInt) { _zoneSelectionColor.setHex(colorAsInt) },
            setGroundWorkColor: function (colorAsInt) { _workGroundGridColor.setHex(colorAsInt) },

            // Get color of conception
            getWorkPanelColor: function () { return _workPanelMat.color },
            getWorkGroundColor: function () { return _workGroundGridColor },
            getZoneSelectionColor: function () { return _zoneSelectionColor },

            // Get three material of conception
            getWorkPanelMat: function () { return _workPanelMat },
            getFixedZoneMat: function () { return _fixedZoneMat },
            getAutoZoneMat: function () { return _autoZoneMat },           


            // Make a geometry panel with its three dimensions
            // l : length (x)
            // w : width (y)
            // t : thickness (z)
            createPanel: function (l, w, t) {
                return new THREE.BoxGeometry(l, w, t);
            },

            // Make a mesh based on geometry
            // g: the geometry
            // m: the material
            // shadow: (optional) if true cast shadow is enabled. Default is false.
            createMesh: function (g, m, shadow) {
                var mesh = new THREE.Mesh(g, m);
                mesh.castShadow = angular.isUndefined(shadow) ? false : shadow;
                return mesh;
            }
        }
    }

    //registration
    thisModule.factory('menuiserieEnv', [
        "$log", 
        "$q",
        environment
    ]);

    //#endregion

    //#region Core classes

    //#region Base class for closet item
    var CItem = function () {
        this._initCItem_ = function (d, title) {
            d.id = 0; // not used
            d.title = title ? title : '';
            d.price = 0;
            d.name = '';
            d.kind = 0;
        }
    }

    CItem.prototype.writeTo = function (serializer, node) {
        var srz = serializer;
        var n = node;
        var me = this;

        //srz.write('id', me.id, n);
        srz.write('title', me.title, n);
        srz.write('price', me.price, n);
        srz.write('name', me.name, n);
        srz.write('kind', me.kind, n);
    }

    CItem.prototype.readFrom = function (serializer, node) {
        var srz = serializer;
        var n = node;
        var me = this;

        //me.id = srz.read('id', n);
        me.title = srz.read('title', n);
        me.price = srz.read('price', n);
        me.name = srz.read('name', n);
        me.kind = srz.read('kind', n);
    }

    //#endregion

    //#region Bound validator
    function boundValidator() {

        return {

            // Returne true if value is accepted according to this rule specification
            isValid: function (value, mini, maxi) {

                if (this.isTooSmall(value, mini)) return false;
                if (this.isTooLarge(value, maxi)) return false;

                return true;
            },

            // Returne true (not valid), if value is less than mini of rule specification
            isTooSmall: function (value, mini) {
                if (!isFinite(value)) return true;

                var num = parseFloat(value);
                return (value < mini);
            },

            // Returne true (not valid), if value is greater than maxi of rule specification
            isTooLarge: function (value, maxi) {
                if (!isFinite(value)) return true;

                var num = parseFloat(value);
                return (value > maxi);
            },

            // Return text that give rule information for user
            getUXInfos: function (mini, maxi) {
                var s = "La dimension doit être ";
                s += "supérieure ou égale à ";
                s += bounds.mini;
                s += ", et inférieure ou égale à ";
                s += bounds.maxi;
                s += ".";
                return s;
            }
        }
    }

    //registration
    thisModule.factory('menuiserieBoundValidator', boundValidator);

    //#endregion

    //#region Data factory
    function dataFactory($q, menuiserieEnv, menuiserieWebService) {

        var _colorThreeMatMap = {}; // The THREE material mapped on their color hexa. Optimization : colored THREE material can be shared.

        //#region Class for texture
        var Texture = function () {
        }

        Texture.prototype.createForPanel = function (l, w) {
            var tx = THREE.ImageUtils.loadTexture(this.UmbMediaUrl);
            tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
            tx.repeat.set(l / this.RealLength, w / this.RealWidth);
            return tx;
        }
        //#endregion

        //#region Class for MeshModel
        var MeshModel = function () {
            this._object3D;
        }

        MeshModel.prototype.load = function () {
            var defer = $q.defer();
            var me = this;

            if (this.isLoaded()) defer.resolve(); // already loaded

            // load 3D mesh
            _objLoader.load(me.UmbFileUrl, function (obj3D) {
                obj3D.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.computeVertexNormals();
                    }
                });

                obj3D.rotation.set(THREE.Math.degToRad(me.Rx), THREE.Math.degToRad(me.Ry), THREE.Math.degToRad(me.Rz));
                obj3D.position.set(me.Ox, me.Oy, me.Oz);
                obj3D.scale.set(me.Scale, me.Scale, me.Scale);
                //obj3D.castShadow = true;
                me._object3D = obj3D;

                defer.resolve();
            });

            return defer.promise;
        }

        MeshModel.prototype.isLoaded = function () { return this._object3D ? true : false }

        MeshModel.prototype.getObject3D = function () { return this._object3D }
        //#endregion

        //#region Base class for map
        var Map = function () {
            this._initMap_ = function (me) {
                me._map = {};
            }
        }

        // Set oject o in map. The key is id. If object already exists, it is replaced.
        Map.prototype.set = function (id, o) {
            if (!o)
                throw new Error("[" + applicationName + "] Cannot add item to the map. Check if item is defined.");
            this._map['id' + o.Id] = o;
        }

        // Get object from the map according its id. Return undefined if not found.
        Map.prototype.get = function (id) {
            return this._map['id' + id];
        }

        //#endregion

        //#region Class for Texture map
        var TextureMap = function () {
            this._initMap_(this);
        }

        TextureMap.prototype = new Map();

        // Get a texture from map. If does not exists in map, load from server.
        // return promise. ex : getTexture(...).then(function(Texture class) {...});
        TextureMap.prototype.getTexture = function (textureId) {
            var defer = $q.defer();
            var me = this;

            var T = this.get(textureId);
            if (T) {
                defer.resolve(T); // found in map
            }
            else { // Load from server
                menuiserieWebService.getTexture(textureId).then(function (response) {
                    var dto = response.data;
                    T = new Texture();
                    jQ.extend(T, dto);
                    me.set(T.Id, T); // add in map
                    defer.resolve(T);
                },
                function (err) {
                    throw new Error("[" + applicationName + "] Cannot load texture id=" + textureId + " from server.");
                })
            }

            return defer.promise;
        }

        // The map
        var _textureMap = new TextureMap();

        //#endregion

        //#region Class for Mesh map
        var MeshMap = function () {
            this._initMap_(this);
        }

        MeshMap.prototype = new Map();

        // Get a mesh from map. If does not exists in map, load from server.
        // return promise. ex : getMesh(...).then(function(Mesh class) {...});
        MeshMap.prototype.getMesh = function (meshId) {
            var defer = $q.defer();
            var me = this;

            var M = this.get(meshId);
            if (M) {
                defer.resolve(M); // found in map
            }
            else { // Load from server
                menuiserieWebService.getMesh(meshId).then(function (response) {
                    var dto = response.data;
                    M = new MeshModel();
                    jQ.extend(M, dto);
                    me.set(M.Id, M); // add in map
                    defer.resolve(M);
                },
                function (err) {
                    throw new Error("[" + applicationName + "] Cannot load mesh id=" + meshId + " from server.");
                })
            }

            return defer.promise;
        }

        // The map
        var _mapOfMesh = new MeshMap();

        //#endregion

        //#region Class for 3D Materials map
        var _3DMaterialMap = function () {
            this._initMap_(this);
        }

        _3DMaterialMap.prototype = new Map();

        // Get a 3D material from map. If does not exists in map, load from server.
        // return promise. ex : getTexture(...).then(function(THREE.Material) {...});
        _3DMaterialMap.prototype.get3DMaterial = function (id) {
            var defer = $q.defer();
            var me = this;

            var M = this.get(id);
            if (M) {
                defer.resolve(M); // found in map
            }
            else { // Load from server
                menuiserieWebService.get3DMaterial(id).then(function (response) {
                    M = response.data;
                    me.set(M.Id, M); // add in map
                    defer.resolve(M);
                },
                function (err) {
                    throw new Error("[" + applicationName + "] Cannot load 3D Material id=" + id + " from server.");
                })
            }

            return defer.promise;
        }

        // The map
        var _MapOf3DMaterial = new _3DMaterialMap();

        //#endregion

        //#region Class for thickness model map
        var ThickModelMap = function () {
            this._initMap_(this);
        }

        ThickModelMap.prototype = new Map();

        // The map
        var _MapOfThickModel = new ThickModelMap();
        //#endregion

        //#region Class for material model map
        var MaterialModelMap = function () {
            this._initMap_(this);
        }

        MaterialModelMap.prototype = new Map();

        // The map
        var _MapOfMaterialModel = new MaterialModelMap();

        //#endregion

        //#region Class for drawer model model map
        var DrawerModelMap = function () {
            this._initMap_(this);
        }

        DrawerModelMap.prototype = new Map();

        // The map
        var _MapOfDrawerModel = new DrawerModelMap();

        //#endregion

        //#region Class for accessory model map
        var AccessoryModelMap = function () {
            this._initMap_(this);
        }

        AccessoryModelMap.prototype = new Map();

        // The map
        var _MapOfAccessoryModel = new AccessoryModelMap();

        //#endregion

        //#region Class for hanging-bar model map
        var HangingBarModelMap = function () {
            this._initMap_(this);
        }

        HangingBarModelMap.prototype = new Map();

        // The map
        var _MapOfHangingBarModel = new HangingBarModelMap();

        //#endregion

        //#region Class for colour model map
        var ColourMap = function () {
            this._initMap_(this);
        }

        ColourMap.prototype = new Map();

        // The map
        var _MapOfColour = new ColourMap();

        //#endregion

        //#region Class for shop map
        var ShopMap = function () {
            this._initMap_(this);
        }

        ShopMap.prototype = new Map();

        // The map
        var _MapOfShop = new ShopMap();

        //#endregion

        //#region Class for colour model
        var Colour = function () {
            this._texture;
            this._3DMaterial;
        }

        // Load texture and 3D Material associate with this colour
        // Return promise, ex : load().then(function() {});
        Colour.prototype.load = function () {
            var defer = $q.defer();
            var me = this;

            if ((me._texture || me.HasColor) && me._3DMaterial) defer.resolve(); // already loaded

            if (!me.HasColor) {
                _textureMap.getTexture(this.TextureId).then(function (texture) {
                    me._texture = texture;
                    if (me._texture && me._3DMaterial)
                        defer.resolve(); // end of loading
                });
            }

            _MapOf3DMaterial.get3DMaterial(this._3DMaterialId).then(function (_3DMat) {
                me._3DMaterial = _3DMat;
                if ((me._texture || me.HasColor) && me._3DMaterial)
                    defer.resolve(); // end of loading
            })

            return defer.promise;
        }

        // Return true if material is fully loaded from server, i.e has a loaded texture and a loaded 3D material.
        Colour.prototype.isLoaded = function () { return ((this._texture || this.HasColor) && this._3DMaterial) ? true : false }

        // Private : create and return the ThreeJS material according to texture and _3DMaterial.
        // The texture wrapping respect the panel dimensions.
        // panelDims: {l : (length of panel) , w : (width of panel) }
        Colour.prototype.createThreeMaterial = function (panelDims) {
            if (!((this._texture || this.HasColor) && this._3DMaterial))
                throw new Error("[" + applicationName + "] Colour texture or 3D material are not loaded. Call load() method before.");

            var threeMat;
            var matParams = {};
            if (this.HasColor) { // Texture is color
                // Try to find in THREE material color map
                var existing = _colorThreeMatMap['id' + this.Color];
                if (existing)
                    return existing;

                matParams.color = parseInt(this.Color, 16);
            }
            else { // Texture is picture
                matParams.map = this._texture.createForPanel(panelDims.l, panelDims.w);
            }

            if (this._3DMaterial.IsShiny) {
                threeMat = new THREE.MeshPhongMaterial(matParams);
                threeMat.shininess = this._3DMaterial.Shininess;
            }
            else
                threeMat = new THREE.MeshLambertMaterial(matParams);

            threeMat.opacity = this._3DMaterial.Opacity;

            if (this.HasColor) // Add in THREE material color map
                _colorThreeMatMap['id' + this.Color] = threeMat;

            return threeMat;
        }

        // Update texture repeat of threeMat according to panelDims
        Colour.prototype.updateDims = function(threeMat, panelDims) {
            if (this._texture && threeMat.map) {
                threeMat.map.repeat.set(panelDims.l / this._texture.RealLength, panelDims.w / this._texture.RealWidth);
            }
        }

        

        //#endregion

        //#region Class for material model
        var MaterialModel = function () {
        }
        //#endregion

        //#region Class for drawer-group model
        var DrawerGroupModel = function () {
            this._currentFacade;
            /*this._widthRule;
            this._heightRule;
            this._depthRule;*/
        }
        //#endregion

        //#region Class for accesory model
        var AccessoryModel = function () {
            this._3DMaterial;
            this._threeMaterial;
            this._meshModel;
        }

        // Load accessory model with 3D Material and mesh associate
        // Return promise, ex : load().then(function() {}); 
        AccessoryModel.prototype.load = function () {
            var defer = $q.defer();
            var me = this;

            if (this.isLoaded()) defer.resolve(); // already loaded

            // Start with 3D material loading
            _MapOf3DMaterial.get3DMaterial(this._3DMaterialId).then(function (_3DMat) {
                me._3DMaterial = _3DMat;
                
                if (me._3DMaterial.IsShiny) {
                    me._threeMaterial = new THREE.MeshPhongMaterial({ color: parseInt(me.Color, 16) });
                    me._threeMaterial.shininess = me._3DMaterial.Shininess;
                }
                else
                    me._threeMaterial = new THREE.MeshLambertMaterial({ color: parseInt(me.Color, 16) });

                // load mesh
                _mapOfMesh.getMesh(me.MeshId).then(function (meshModel) {
                    me._meshModel = meshModel;
                    meshModel.load().then(function () {
                        defer.resolve();
                    });
                })
            })

            return defer.promise;
        }

        // Return true if is loaded
        AccessoryModel.prototype.isLoaded = function () { return (this._3DMaterial && this._meshModel && this._meshModel.isLoaded()) ? true : false }

        // Create a clone of mesh model as THREE.mesh
        AccessoryModel.prototype.createThreeMesh = function () {
            if (!this.isLoaded())
                throw new Error("[" + applicationName + "] Cannot create three mesh. Accessory model '" + this.Title  + "' is not loaded.");

            var clone = this._meshModel.getObject3D().clone();
            for (var i = 0 ; i < clone.children.length ; i++) {
                if (clone.children[i] instanceof THREE.Mesh)
                    clone.children[i].material = this._threeMaterial;
            }

            return clone;
        }

        // Get the associate mesh model
        AccessoryModel.prototype.getMeshModel = function () {
            if (!this.isLoaded())
                throw new Error("[" + applicationName + "] Cannot get mesh model. Accessory model '" + this.Title + "' is not loaded.");

            return this._meshModel;
        }
        //#endregion

        //#region Class for Hanging-bar model
        var HangingBarModel = function () {
            this._3DMaterial;
            this._threeMaterial;
        }

        // Load hanging-bar model with 3D Material associate
        // Return promise, ex : load().then(function() {}); 
        HangingBarModel.prototype.load = function () {
            var defer = $q.defer();
            var me = this;

            if (this.isLoaded()) defer.resolve(); // already loaded

            // Start with 3D material loading
            _MapOf3DMaterial.get3DMaterial(this._3DMaterialId).then(function (_3DMat) {
                me._3DMaterial = _3DMat;

                if (me._3DMaterial.IsShiny) {
                    me._threeMaterial = new THREE.MeshPhongMaterial({ color: parseInt(me.Color, 16) });
                    me._threeMaterial.shininess = me._3DMaterial.Shininess;
                }
                else
                    me._threeMaterial = new THREE.MeshLambertMaterial({ color: parseInt(me.Color, 16) });

                defer.resolve();
            })

            return defer.promise;
        }

        // Return true if is loaded
        HangingBarModel.prototype.isLoaded = function () { return (this._3DMaterial && this._threeMaterial) ? true : false }

        HangingBarModel.prototype.getThreeMat = function () { return this._threeMaterial }

        //#endregion

        // The tables (tables will be selectionable in user interface)
        var _colourTable = []; // Colours
        var _colourTableWithNone = []; // Same as colours, but with 'none' colour as 1st element 
        var _panelModelTable = []; // panel materials
        var _backPanelModelTable = []; // back-panel materials
        var _facadeModelTable = []; // drawer-facade materials
        var _drawerModelTable = []; // drawer-goups
        var _accessoryModelTable = []; // Accessories
        var _hangingBarModelTable = []; // Hanging-bars
        var _shopTable = []; // Shops

        var _ecoTaxes = []; // The sorted eco-taxes collection

        var _objLoader = new THREE.OBJLoader();
        var _drawerHandleSample;

        var _shopDiscount = 0; // The price discount of current shop
        var _shopCoef = 1; // The price coef of current shop

        return {

            // Load list of colours from server.
            // Return promise, ex : loadColours(...).then(function(array of Colour){...}, function(error) { ... })
            loadColours: function() {
                var defer = $q.defer();

                menuiserieWebService.getColours().then(function (response) {
                    var i;
                    var clr;

                    _colourTable = [];
                    _colourTableWithNone = [];
                    clr = new Colour();
                    clr.Id = 0;
                    clr.Title = "[-- Couleur par défaut --]";
                    _colourTableWithNone.push(clr);

                    for (i = 0 ; i < response.data.length ; i++) {
                        clr = new Colour();
                        jQ.extend(clr, response.data[i]);
                        _colourTable.push(clr); // Add in tables
                        _colourTableWithNone.push(clr);
                        _MapOfColour.set(clr.Id, clr); // Add in map
                    }

                    defer.resolve(_colourTable);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load map of thickness models from server.
            // Return promise, ex : loadThickModels(...).then(function(){...}, function(error) { ... })
            loadThickModels: function () {
                var defer = $q.defer();

                menuiserieWebService.getThicks().then(function (response) {
                    var i, thick;

                    for (i = 0 ; i < response.data.length ; i++) {
                        thick = response.data[i];
                        _MapOfThickModel.set(thick.Id, thick); // Add in map
                    }

                    defer.resolve();
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load list of panel material models from server.
            // Return promise, ex : loadPanelModels(...).then(function(array of MaterialModel){...}, function(error) { ... })
            loadPanelModels: function () {
                var defer = $q.defer();

                menuiserieWebService.getPanels().then(function (response) {
                    var i;
                    var mat;

                    if (_panelModelTable.length > 0) _panelModelTable = [];

                    for (i = 0 ; i < response.data.length ; i++) {
                        mat = new MaterialModel();
                        jQ.extend(mat, response.data[i]);
                        _panelModelTable.push(mat); // Add in table
                        _MapOfMaterialModel.set(mat.Id, mat); // Add in map
                    }

                    defer.resolve(_panelModelTable);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load list of back-panel material models from server.
            // Return promise, ex : loadBackPanelModels(...).then(function(array of MaterialModel){...}, function(error) { ... })
            loadBackPanelModels: function () {
                var defer = $q.defer();

                menuiserieWebService.getBackPanels().then(function (response) {
                    var i;
                    var mat;

                    if (_backPanelModelTable.length > 0) _backPanelModelTable = [];

                    mat = new MaterialModel();
                    mat.Id = 0;
                    mat.Title = "(pas de fond)";
                    _backPanelModelTable.push(mat);

                    for (i = 0 ; i < response.data.length ; i++) {
                        mat = new MaterialModel();
                        jQ.extend(mat, response.data[i]);
                        _backPanelModelTable.push(mat); // Add in table
                        _MapOfMaterialModel.set(mat.Id, mat); // Add in map
                    }

                    defer.resolve(_backPanelModelTable);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load list of drawer-facade material models from server.
            // Return promise, ex : loadFacadeModels(...).then(function(array of MaterialModel){...}, function(error) { ... })
            loadFacadeModels: function () {
                var defer = $q.defer();

                menuiserieWebService.getDrawerFacades().then(function (response) {
                    var i;
                    var mat;

                    if (_facadeModelTable.length > 0) _facadeModelTable = [];

                    for (i = 0 ; i < response.data.length ; i++) {
                        mat = new MaterialModel();
                        jQ.extend(mat, response.data[i]);
                        _facadeModelTable.push(mat); // Add in table
                        _MapOfMaterialModel.set(mat.Id, mat); // Add in map
                    }

                    defer.resolve(_facadeModelTable);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load list of drawer-group models from server.
            // Return promise, ex : loadDrawerModels(...).then(function(array of DrawerGroupModel){...}, function(error) { ... })
            loadDrawerModels: function () {
                var defer = $q.defer();

                menuiserieWebService.getDrawerGroups().then(function (response) {
                    var i;
                    var dg;

                    // Initialization
                    _drawerModelTable = [];
                    /*dg = new DrawerGroupModel();
                    dg.Id = 0;
                    dg.Title = '[-- Aucun --]';
                    _drawerModelTable.push(dg);*/

                    for (i = 0 ; i < response.data.length ; i++) {
                        dg = new DrawerGroupModel();
                        jQ.extend(dg, response.data[i]);
                        _drawerModelTable.push(dg);
                        _MapOfDrawerModel.set(dg.Id, dg);
                    }

                    defer.resolve(_drawerModelTable);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load list of accessory models from server.
            // Return promise, ex : loadAccessoryModels(...).then(function(array of AccessoryModel){...}, function(error) { ... })
            loadAccessoryModels: function () {
                var defer = $q.defer();

                menuiserieWebService.getAccessories().then(function (response) {
                    var i;
                    var A;

                    if (_accessoryModelTable.length > 0) _accessoryModelTable = [];

                    for (i = 0 ; i < response.data.length ; i++) {
                        A = new AccessoryModel();
                        jQ.extend(A, response.data[i]);
                        _accessoryModelTable.push(A);
                        _MapOfAccessoryModel.set(A.Id, A);
                    }

                    defer.resolve(_accessoryModelTable);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load list of hanging-bar models from server.
            // Return promise, ex : loadHangingBarModels(...).then(function(array of HangingBarModel){...}, function(error) { ... })
            loadHangingBarModels: function() {
                var defer = $q.defer();

                menuiserieWebService.getHangingBars().then(function (response) {
                    var i;
                    var H;

                    if (_hangingBarModelTable.length > 0) _hangingBarModelTable = [];

                    for (i = 0 ; i < response.data.length ; i++) {
                        H = new HangingBarModel();
                        jQ.extend(H, response.data[i]);
                        _hangingBarModelTable.push(H);
                        _MapOfHangingBarModel.set(H.Id, H);
                    }

                    defer.resolve(_hangingBarModelTable);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load eco-taxes from server
            // Return promise, ex : loadEcoTaxes(...).then(function(array of menuiserieEcoTax){...}, function(error) { ... })
            loadEcoTaxes: function () {                
                var defer = $q.defer();

                menuiserieWebService.getEcoTaxes().then(function (response) {
                    _ecoTaxes = response.data;
                    defer.resolve(_ecoTaxes);
                },
                function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            },

            // Load shops of brans
            // Return promise, ex : loadShops().then(function(array of Shop){...}, function(error) { ... })
            loadShops: function() {
                var i;
                var S;

                var defer = $q.defer();

                menuiserieWebService.getShops().then(function (response) {
                    //_shopTable = [{ Id: 0, Title: "(pas de point de vente)" }];
                    //_MapOfShop.set(0, _shopTable[0]);

                    for (i = 0 ; i < response.data.length ; i++) {
                        S = response.data[i];
                        _shopTable.push(S);
                        _MapOfShop.set(S.Id, S);
                    }

                    defer.resolve(_shopTable);
                },
                function (err) {
                    defer.reject(err);
                });
                

                return defer.promise;
            },

            // Get texture according to specified id.
            // Return promise, ex : getTextureById().then(function(Texture class){...}, function(error) { ... })
            getTextureById: function (id) { return _textureMap.getTexture(id) },

            // Get material model according to specified id. Return undefined if not found.
            // Warning ! Do not forget to call load() on returned material.
            getMaterialModelById: function (id) { return _MapOfMaterialModel.get(id) },

            // Get drawer model according to specified id. Return undefined if not found.
            getDrawerModelById: function (id) { return _MapOfDrawerModel.get(id) },

            // Get accessory model according to specified id. Return undefined if not found.
            getAccessoryModelById: function (id) { return _MapOfAccessoryModel.get(id) },

            // Get hanging-bar model according to specified id. Return undefined if not found.
            getHangingBarModelById: function(id) { return _MapOfHangingBarModel.get(id) },

            // Get colour model according to specified id. Return undefined if not found.
            // Warning ! Do not forget to call load() on returned colour.
            getColourById: function (id) { return _MapOfColour.get(id) },

            // Get panel model table
            getPanelModelTable: function () { return _panelModelTable },

            // Get back-panel model table
            getBackPanelModelTable: function () { return _backPanelModelTable },

            // Get drawer model table
            getDrawerModelTable: function () { return _drawerModelTable },

            // Get drawer facade model table
            getFacadeModelTable: function () { return _facadeModelTable },

            // Get colour table
            getColourTable: function () { return _colourTable },

            // Get the colour table with 'none' colour
            getColourTableWithNone: function () { return _colourTableWithNone },

            // Get the accessory model table
            getAccessoryModelTable: function () { return _accessoryModelTable },

            // Get the hanging-bar model table
            getHangingBarModelTable: function () { return _hangingBarModelTable },

            // Get the shop table
            getShopTable: function () { return _shopTable },

            // Get eco-taxes
            getEcoTaxes: function () { return _ecoTaxes },

            // Get eco-tax by weight
            // w : weight in kg
            getEcoTaxByWeight: function(w) {
                var n = _ecoTaxes.length;
                for (var i = 0 ; i < n ; i++) {
                    if (w <= _ecoTaxes[i].WeightBound) return _ecoTaxes[i];
                }

                // upper the last weight bound
                return _ecoTaxes[n - 1];
            },

            // Get the price for a m² surface according to panelModel and colourModel
            getPriceOfSurf: function (panelModel, colourModel, Sm2) {
                var thickModel = _MapOfThickModel.get(panelModel.ThicknessId);
                if (colourModel.PriceCategory === 1)
                    return Sm2 * thickModel.PriceOfColourCat1;
                else if (colourModel.PriceCategory === 2)
                    return Sm2 * thickModel.PriceOfColourCat2;
                else if (colourModel.PriceCategory === 3)
                    return Sm2 * thickModel.PriceOfColourCat3;
                else
                    throw new Error("[" + applicationName + "] Unsupported colour price category '" + colourModel.PriceCategory + "'.");
            },

            // Get the weight in kg for a m3 volume
            getWeigthOfVol: function (panelModel, Vm3) {
                var thickModel = _MapOfThickModel.get(panelModel.ThicknessId);
                return Vm3 * thickModel.Density;
            },

            // Return the value of thickness
            getThickValue: function (panelModel) {
                var thickModel = _MapOfThickModel.get(panelModel.ThicknessId);
                return thickModel.Value;
            },

            // Set the price discount and coef of current shop. Use it on shop change.
            setPriceCoef: function (discountRate, coef) { _shopDiscount = discountRate / 100; _shopCoef = coef },

            // Get sale price according to discount and coef
            getSalePrice: function (buyPrice) { return buyPrice * (1 - _shopDiscount) * _shopCoef; },

            // Create CItem instance
            createCItem: function () { return new CItem(); }
            
        }

    }

    //registration
    thisModule.factory('menuiserieDataFactory', ["$q", "menuiserieEnv", "menuiserieWebService", dataFactory]);

    //#endregion
 
    //#region Positioner factory
    function positionerFactory() {

        // Methods to compute coordinate offset due to margins configuration
        // To position panel in zone, you must add the returned value to the desired position.
        // ex. : var x = _getMarginXOffs(M) + 10; // 10 is desired position on X
        function _getMarginXOffs(M) { return (M.left - ((M.left + M.right) / 2)) }
        function _getMarginYOffs(M) { return (M.bottom - ((M.bottom + M.top) / 2)) }
        function _getMarginZOffs(M) { return (M.back - ((M.back + M.front) / 2)) }

        //#region PanelPositioner
        // Constructor
        var PanelPositioner = function () {
            this.side = 'left';
            this.zone;
            this.offs = 0; // offset from face (if positive, inside zone)
            //this.positionable;
            /*this.margin = { // Margin of panel in zone
                top: 0, // Y closet
                bottom: 0, // Y closet
                left: 0, // X closet
                right: 0, // X closet
                front: 0, // Z closet
                back: 0 // Z closet
            }*/
            //this.panThickness; // override the compound thickness

            // global dimension
            this.xdim = 0;
            this.ydim = 0;
            this.zdim = 0;

            // Dimension (useful for panel)
            this.length = 0; // Dimension x of panel
            this.width = 0; // Dimension y of panel

            // Position and rotation
            this.rot = { x: 0, y: 0, z: 0, order: 'XYZ' };
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }

        // Write to node
        PanelPositioner.prototype.writeTo = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var subNode;

            srz.write('side', me.side, n);
            srz.write('offs', me.offs, n);
            //srz.write('margin', me.margin, n);
        }

        // Read from node
        PanelPositioner.prototype.readFrom = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var o;

            me.side = srz.read('side', n);
            me.offs = srz.read('offs', n);
            //me.margin = srz.read('margin', n);
        }

        // Update positioner
        // M : Margins as defined in Panel { left: , top: , etc ...}
        // thick: the pannel thickness
        PanelPositioner.prototype.update = function (M, thick) {
            var me = this;
            var Z = this.zone;
            var C = Z.compound;
            //var P = this.positionable;
            var panThick = thick; //angular.isUndefined(this.panThickness) ? C.getDefaultThickness() : this.panThickness;
            //var M = this.margin;
            var Zw = Z.getWidth();
            var Zh = Z.getHeight();
            var Zd = Z.getDepth();

            // offset for position according to margins
            var xMOffs = _getMarginXOffs(M); //(M.left - ((M.left + M.right) / 2));
            var yMOffs = _getMarginYOffs(M); //(M.bottom - ((M.bottom + M.top) / 2));
            var zMOffs = _getMarginZOffs(M); //(M.back - ((M.back + M.front) / 2));

            // WARNING !
            // Dimension are computed before rotation
            // Position are computed after rotation

            if (this.side === 'left') {
                me.length = Zh - (M.top + M.bottom); //(2 * panThick);
                me.width = Zd - (M.front + M.back);
                me.xdim = panThick;
                me.ydim = me.length;
                me.zdim = me.width;
                me.rot = { x: -Math.PI / 2, y: 0, z: Math.PI / 2, order: 'ZYX' };
                me.x = Z.x - (Zw / 2) + (panThick / 2) + this.offs;
                me.y = Z.y + yMOffs;
                me.z = Z.z + zMOffs;
            }
            else if (this.side === 'right') {
                me.length = Zh - (M.top + M.bottom); //(2 * panThick);
                me.width = Zd - (M.front + M.back);
                me.xdim = panThick;
                me.ydim = me.length;
                me.zdim = me.width;
                me.rot = { x: -Math.PI / 2, y: 0, z: Math.PI / 2, order: 'ZYX' };
                me.x = Z.x + (Zw / 2) - (panThick / 2) - this.offs;
                me.y = Z.y + yMOffs;
                me.z = Z.z + zMOffs;
            }
            else if (this.side === 'bottom') {
                me.length = Zw - (M.left + M.right);
                me.width = Zd - (M.front + M.back);
                me.xdim = me.length;
                me.ydim = panThick;
                me.zdim = me.width;
                me.rot = { x: -Math.PI / 2, y: 0, z: 0 };
                me.x = Z.x + xMOffs;
                me.y = Z.y - (Zh / 2) + (panThick / 2) + this.offs;
                me.z = Z.z + zMOffs;
            }
            else if (this.side === 'top') {
                me.length = Zw - (M.left + M.right);
                me.width = Zd - (M.front + M.back);
                me.xdim = me.length;
                me.ydim = panThick;
                me.zdim = me.width;
                me.rot = { x: -Math.PI / 2, y: 0, z: 0 };
                me.x = Z.x + xMOffs;
                me.y = Z.y + (Zh / 2) - (panThick / 2) - this.offs;
                me.z = Z.z + zMOffs;
            }
            else if (this.side === 'front') {
                me.length = Zw - (M.left + M.right);
                me.width = Zh - (M.top + M.bottom);
                me.xdim = me.length;
                me.ydim = me.width;
                me.zdim = panThick;
                me.rot = { x: 0, y: 0, z: 0, order: 'XYZ' };
                me.x = Z.x + xMOffs;
                me.y = Z.y + yMOffs;
                me.z = Z.z + (Zd / 2) - (panThick / 2) - this.offs;
            }
            else if (this.side === 'back') {
                me.length = Zw - (M.left + M.right);
                me.width = Zh - (M.top + M.bottom);
                me.xdim = me.length;
                me.ydim = me.width;
                me.zdim = panThick;
                me.rot = { x: 0, y: 0, z: 0, order: 'XYZ' };
                me.x = Z.x + xMOffs;
                me.y = Z.y + yMOffs;
                me.z = Z.z - (Zd / 2) + (panThick / 2) + this.offs;
            }
            else
                throw new Error("[" + applicationName + "] Unsupported side '" + this.side + "' for PanelPositioner.");
        }

        //#endregion

        return {

            // Create new positioner
            // side: (String) side of zone. Can be 'left', 'right', 'bottom' and 'top'
            // offs: (Number) offset for the position, i.e distance from zone side (positive value are inside closet)
            // zone: (Zone) the zone used to compute position
            createPanelPositioner: function (side, offs, zone) {
                var p = new PanelPositioner();
                p.side = side;
                p.offs = offs;
                p.zone = zone;
                return p;
            },

            // Methods to compute coordinate offset due to margins configuration.
            getMarginXOffs: function (M) { return _getMarginXOffs(M) },
            getMarginYOffs: function (M) { return _getMarginYOffs(M) },
            getMarginZOffs: function (M) { return _getMarginZOffs(M) }
        }
    }

    //registration
    thisModule.factory('menuiseriePositionerFactory', positionerFactory);

    //#endregion

    //#region Panel factory
    function panelFactory(menuiserieEnv, menuiseriePositionerFactory, menuiserieConst, menuiserieDataFactory) {

        // The material of panel in 'work' mode
        //var _workPanelMat = new THREE.MeshLambertMaterial({ color: menuiserieEnv.getWorkPanelColor() });

        //#region Panel class
        // Constructor
        var Panel = function () {
            this._initCItem_(this);

            this.parentZone;
            this.positioner;

            this.colour; // It is the colour provided by DataFactory, i.e colour as it is retrieved from the server.
            this._hasOwnColour = false; // If true, the panel has own colour (change closet colour has no effect on this panel)
            this.panelModel; // It is the panel-model provided by DataFactory
            this._renderThreeMat; // The THREE.Material used in rendering mode.

            this.width = 0;
            this.length = 0;
            this.thickness = 0;

            // IPositionable
            this.xdim = 0;
            this.ydim = 0;
            this.zdim = 0;
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.rot = undefined;

            // IBOMItem
            this.isBOMCompound = false;

            this.mesh = undefined;
            this.margins = { // Margins of panel in zone, according to closet orientation (back is back of closet, top is top of closet, etc...)
                top: 0, // Y closet
                bottom: 0, // Y closet
                left: 0, // X closet
                right: 0, // X closet
                front: 0, // Z closet
                back: 0 // Z closet
            }

            this.thickness = null; // can overrride default compound thickness
            this.ecoTax = 0;
            this.weight = 0;
            this.isOff = false;
        }

        // Inheritance
        Panel.prototype = new CItem();

        // Get ezType
        Panel.prototype.getEzType = function () { return 'Panel' }

        // Write to node
        Panel.prototype.writeTo = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var subNode;

            // base class write call
            CItem.prototype.writeTo.call(this, serializer, node);

            if (me.positioner) {
                subNode = {};
                me.positioner.writeTo(srz, subNode);
                srz.write('pos', subNode, n);
            }
            else
                srz.write('pos', null, n);

            srz.writeColour('clr', me.colour, n);
            srz.writePanel('pan', me.panelModel, n);
            srz.write('w', me.width, n);
            srz.write('l', me.length, n);
            srz.write('th', me.thickness, n);
            srz.write('xdim', me.xdim, n);
            srz.write('ydim', me.ydim, n);
            srz.write('zdim', me.zdim, n);
            srz.write('x', me.x, n);
            srz.write('y', me.y, n);
            srz.write('z', me.z, n);
            srz.write('rot', me.rot || null, n);
            srz.write('isBOMCompound', me.isBOMCompound, n);
            srz.write('margins', me.margins, n);
            srz.write('isOff', me.isOff, n);
            srz.write('ownClr', me._hasOwnColour, n);
        }

        // Read from node
        Panel.prototype.readFrom = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var o;

            // base class read call
            CItem.prototype.readFrom.call(this, serializer, node);

            o = srz.read('pos', n);
            if (o) me.positioner = srz.deserialize('PanelPositioner', o, { zone: me.parentZone });

            me.colour = srz.readColour('clr', n);
            me.panelModel = srz.readPanel('pan', n);
            me.width = srz.read('w', n);
            me.length = srz.read('l', n);
            me.thickness = srz.read('th', n);
            me.xdim = srz.read('xdim', n);
            me.ydim = srz.read('ydim', n);
            me.zdim = srz.read('zdim', n);
            me.x = srz.read('x', n);
            me.y = srz.read('y', n);
            me.z = srz.read('z', n);

            var o = srz.read('rot', n);
            if (o) me.rot = o;

            me.isBOMCompound = srz.read('isBOMCompound', n);
            me.margins = srz.read('margins', n);
            me.isOff = srz.read('isOff', n);

            if (srz.nodeHasProp('ownClr', n))
                me._hasOwnColour = srz.read('ownClr', n);
            else
                me._hasOwnColour = false;
        }

        // Get the panel material according to scene mode. This the THREE.Material used in UI.
        Panel.prototype.getCurrentPanelMat = function () {
            var me = this;
            var ENV = menuiserieEnv.getThreeEnv();

            if (ENV.sceneMode === 'work')
                return menuiserieEnv.getWorkPanelMat();
            else {
                if (!this._renderThreeMat) {// The THREE material is not created
                    // To update on dimension change
                    this._renderThreeMat = this.colour.createThreeMaterial({ l: me.getLength(), w: me.getWidth() });
                }
                else
                    this.colour.updateDims(this._renderThreeMat, { l: me.getLength(), w: me.getWidth() });

                return this._renderThreeMat;
            }
        }

        // Update the Panel mesh. useful if property change.
        Panel.prototype.update = function () {
            var me = this;
            var pos = me.positioner;
            var C = me.parentZone.getCompound();
            var thick = me.thickness === null ? menuiserieDataFactory.getThickValue(me.panelModel) : me.thickness;

            if (pos) {                
                pos.update(me.margins, thick); // update positioner

                // Dimension in local coordinate of pannel
                me.length = pos.length,
                me.width = pos.width;

                // Dimension in coordinate of closet
                me.xdim = pos.xdim,
                me.ydim = pos.ydim;
                me.zdim = pos.zdim;

                me.rot = pos.rot;

                me.x = pos.x;
                me.y = pos.y;
                me.z = pos.z;
            }

            var g = menuiserieEnv.createPanel(me.length, me.width, thick);
            if (!me.mesh) {
                me.mesh = menuiserieEnv.createMesh(g, me.getCurrentPanelMat(), true);
                me.mesh.receiveShadow = true;
                me.mesh.name = me.title;
            }
            else {
                if (me.mesh.geometry) me.mesh.geometry.dispose();
                me.mesh.geometry = g;
                me.mesh.material = me.getCurrentPanelMat();
            }

            if (me.rot)
                me.mesh.rotation.set(me.rot.x, me.rot.y, me.rot.z, me.rot.order ? me.rot.order : 'XYZ');
            
            me.mesh.position.set(me.x, me.y, me.z);

            // Price computing
            /*me.weight = menuiserieDataFactory.getWeigthOfVol(me.panelModel, me.getVol());
            me.ecoTax = menuiserieDataFactory.getEcoTaxByWeight(me.weight).Value;
            var surf = me.getSurf();
            me.price = menuiserieDataFactory.getPriceOfSurf(me.panelModel, me.colour, surf);
            me.price += C.getAddPrice(me.kind);
            me.price *= menuiserieDataFactory.getPriceCoef();*/
        }

        // Get dimensions
        Panel.prototype.getLength = function () { return this.length }
        Panel.prototype.getWidth = function () { return this.width }
        Panel.prototype.getThickness = function () { return this.thickness }

        // Get surface of panel in m²
        Panel.prototype.getSurf = function () {
            return (this.getLength() / 100) * (this.getWidth() / 100);
        }

        // Get volume of panel in m3
        Panel.prototype.getVol = function () {
            var me = this;
            var C = me.parentZone.getCompound();
            var thick = me.thickness === null ? menuiserieDataFactory.getThickValue(this.panelModel) : me.thickness;
            return me.getSurf() * (thick / 100);
        }

        // Get Weight of panel in kg
        Panel.prototype.getWeight = function () {
            return this.getVol() * this.panelModel;
        }

        //// IBOMItem
        // Fill the BOM
        Panel.prototype.fillBOM = function (bom) {
            var me = this;
            var C = me.parentZone.getCompound();

            // Price computing
            me.weight = menuiserieDataFactory.getWeigthOfVol(me.panelModel, me.getVol());
            me.ecoTax = menuiserieDataFactory.getEcoTaxByWeight(me.weight).Value;
            var surf = me.getSurf();
            me.price = menuiserieDataFactory.getPriceOfSurf(me.panelModel, me.colour, surf);
            me.price += C.getAddPrice(me.kind);
            me.price = menuiserieDataFactory.getSalePrice(me.price);

            bom.add({
                id: me.id,
                title: me.title,
                dims: [me.getLength(), me.getWidth(), me.thickness === null ? menuiserieDataFactory.getThickValue(this.panelModel) : me.thickness],
                dimsLabel: '(L x l x e)',
                surf: me.getSurf(),
                price: me.price + me.ecoTax,
                ecoTax: me.ecoTax,
                weight: me.weight
            });
        }

        // Change the colour of this panel. Useful if user change the closet colour in UI.
        Panel.prototype.setColour = function (colour) {
            if (this.colour && this.colour.Id === colour.Id) return false; // no change

            this.colour = colour;
            this._renderThreeMat = undefined; // to force recompute of THREE material
            return true;
        }
        Panel.prototype.getColour = function () { return this.colour }

        // Get or set the has "own colour status"
        Panel.prototype.hasOwnColour = function (yes) {
            if (angular.isUndefined(yes)) return this._hasOwnColour; // get
            this._hasOwnColour = yes;
        }

        // Change the material model of this panel. Useful if user change the model in UI.
        Panel.prototype.setMaterialModel = function (model) {
            //if (model.getMatTypeName() !== 'Panel' && model.getMatTypeName() !== 'BackPanel')
            //    throw new Error("[" + applicationName + "] Cannot change panel material model. Material type '" + model.getMatTypeName() + "' is not allowed.");

            if (this.panelModel && this.panelModel.Id === model.Id) return false; // no change
            this.panelModel = model;
            return true;
        }
        Panel.prototype.getMaterialModel = function() { return this.panelModel }

        // Set margins
        // margins : { left, top, right, bottom, back, front }
        Panel.prototype.setMargins = function (margins) {
            var M = this.margins;
            M.left = margins.left || 0;
            M.right = margins.right || 0;
            M.top = margins.top || 0;
            M.bottom = margins.bottom || 0;
            M.back = margins.back || 0;
            M.front = margins.front || 0;
        }

        // Get Margins
        Panel.prototype.getMargins = function () { return this.margins }

        //// IVisualizable

        // Display this panel
        Panel.prototype.display = function () {
            if (this.mesh)
                menuiserieEnv.getThreeEnv().scene.add(this.mesh)
        }

        // Hide this panel
        Panel.prototype.hide = function () {
            if (this.mesh)
                menuiserieEnv.getThreeEnv().scene.remove(this.mesh)
        }

        // Update the 3d material.
        Panel.prototype.updateThreeMat = function () {
            if (!this.mesh) return;
            this.mesh.material = this.getCurrentPanelMat();
        }

        Panel.prototype.dispose = function () {
            if (this.mesh && this.mesh.geometry)
                this.mesh.geometry.dispose();
        }

        //#endregion

        return {

            // Create new panel
            // parentZone: (Zone) the zone that use to compute dimensions and position of the panel. 
            // Note that this method do not add panel to the parent zone.
            create: function (parentZone) {
                var P = new Panel();
                //P.id = parentZone.compound.getNextItemId();
                P.parentZone = parentZone;
                P.colour = parentZone.compound.defaultColour;
                P.panelModel = parentZone.compound.defaultPanelModel;
                return P;
            },

            // Use this function to position panel on side of its parent zone.
            // Note that this method add automatically the panel to its parent zone.
            beOnSide: function (P, side, sideOffs) {
                if (!P.positioner)
                    P.positioner = menuiseriePositionerFactory.createPanelPositioner(side, sideOffs || 0, P.parentZone);
                else {
                    P.positioner.side = side;
                    P.positioner.offs = offs;
                }
                P.parentZone.add(P); // Add panel to the zone
            },

            // Use this function to make panel as left part
            beLeft: function (P) {
                P.title = "Joue gauche";
                P.kind = menuiserieConst.Kinds.Left;
                P.setMargins({ front: P.parentZone.compound.getClosetModel().FrontLeftMargin });
            },

            // Use this function to make panel as right part
            beRight: function (P) {
                P.title = "Joue droite";
                P.kind = menuiserieConst.Kinds.Right;
                P.setMargins({ front: P.parentZone.compound.getClosetModel().FrontRightMargin });
            },

            // Use this function to make panel as top part
            beTop: function (P) {
                P.title = "Dessus";
                P.kind = menuiserieConst.Kinds.Top;
                P.setMargins({ front: P.parentZone.compound.getClosetModel().FrontTopMargin });
            },

            // Use this function to make panel as bottom part
            beBottom: function (P) {
                P.title = "Dessous";
                P.kind = menuiserieConst.Kinds.Bottom;
                P.setMargins({ front: P.parentZone.compound.getClosetModel().FrontBottomMargin });
            },

            // Use this function to make panel as back-panel part
            beBack: function (P) {
                P.title = "Fond";
                P.kind = menuiserieConst.Kinds.Back;
                //P.setMargins({ front: P.parentZone.compound.getClosetModel().FrontBottomMargin });
            },

            // Use this function to make panel as shelf
            beShelf: function (P) {
                P.title = "Tablette";
                P.kind = menuiserieConst.Kinds.Shelf;
                P.setMargins({ front: P.parentZone.compound.getClosetModel().FrontShelfMargin })
            },

            // Use this function to make panel as separator 
            beSeparator: function (P) {
                P.title = "Séparation";
                P.kind = menuiserieConst.Kinds.Separator;
                P.setMargins({ front: P.parentZone.compound.getClosetModel().FrontSeparatorMargin })
            }
            
        }

    }

    //registration
    thisModule.factory('menuiseriePanelFactory', ["menuiserieEnv", "menuiseriePositionerFactory", "menuiserieConst", "menuiserieDataFactory", panelFactory]);

    //#endregion

    //#region Zone factory
    function zoneFactory($log, menuiserieEnv, menuiseriePanelFactory, menuiseriePositionerFactory) {

        // Material of hidden zone
        var _hiddenZoneMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        _hiddenZoneMat.transparent = true;
        _hiddenZoneMat.opacity = 0.0;

        // Materials of selected zone
        var _selectedZoneMat = new THREE.MeshBasicMaterial();
        _selectedZoneMat.color = menuiserieEnv.getZoneSelectionColor();
        var _selectedZoneLineMat = new THREE.LineBasicMaterial(_selectedZoneMat.color);

        // Create zone
        function _createZone(title, compound, parentZone) {
            var Z = new Zone();
            Z.title = title;
            Z.compound = compound;
            Z.parentZone = parentZone;
            return Z;
        }

        //#region Zone Selection class
        var ZoneSelection = function (zone) {
            this.zone = zone;
            this.hasCrossedLines = false;

            this._bMesh;
            this._tMesh;
            this._lMesh;
            this._rMesh;

            this._line1;
            this._line2;
            this._line1P1 = new THREE.Vector3();
            this._line1P2 = new THREE.Vector3();
            this._line2P1 = new THREE.Vector3();
            this._line2P2 = new THREE.Vector3();

            this.mesh;
            this._udpdateRequired = true;
            this._isDisplayed = false;
        }

        // Update the zone selection
        ZoneSelection.prototype.update = function () {
            var wBox = 2;
            var tBox = 1;
            var mat = _selectedZoneMat;
            var xoffs = 0;
            var yoffs = 0;
            var zoffs = 0.5;

            // Global position
            var gx = this.zone.x;
            var gy = this.zone.y;
            var gz = this.zone.z + this.zone.zdim / 2;

            // Box length as zone dim
            var xLen = this.zone.xdim;
            var yLen = this.zone.ydim;

            // The base geometries
            var hbox = new THREE.BoxGeometry(xLen + (xoffs * 2), wBox, tBox);
            var vbox = new THREE.BoxGeometry(yLen + (yoffs * 2), wBox, tBox);

            if (this.hasCrossedLines) {
                // The cross lines
                this._line1P1.set(gx - xLen / 2, gy - yLen / 2, gz);
                this._line1P2.set(gx + xLen / 2, gy + yLen / 2, gz);

                this._line2P1.set(gx - xLen / 2, gy + yLen / 2, gz);
                this._line2P2.set(gx + xLen / 2, gy - yLen / 2, gz);
            }

            // The rotations
            var yCylRot = { x: 0, y: 0, z: Math.PI / 2, order: 'XYZ' }

            if (!this.mesh) {
                // bottom mesh 
                this._bMesh = new THREE.Mesh(hbox, mat);
                
                // top mesh
                this._tMesh = new THREE.Mesh(hbox, mat);

                // left mesh
                this._lMesh = new THREE.Mesh(vbox, mat);
                this._lMesh.rotation.set(yCylRot.x, yCylRot.y, yCylRot.z, yCylRot.order);

                // right mesh
                this._rMesh = new THREE.Mesh(vbox, mat);
                this._rMesh.rotation.set(yCylRot.x, yCylRot.y, yCylRot.z, yCylRot.order);

                this.mesh = new THREE.Object3D();

                if (this.hasCrossedLines) {
                    // Lines
                    this._line1 = new THREE.Line();
                    this._line1.material = _selectedZoneLineMat;
                    this._line1.geometry.vertices.push(this._line1P1, this._line1P2);
                    this._line2 = new THREE.Line();
                    this._line2.material = _selectedZoneLineMat;
                    this._line2.geometry.vertices.push(this._line2P1, this._line2P2);

                    this.mesh.add(this._line1, this._line2);
                }

                //this.mesh;
                this.mesh.add(this._bMesh, this._tMesh, this._lMesh, this._rMesh);
            }
            else {
                if (this._bMesh.geometry) this._bMesh.geometry.dispose();
                if (this._tMesh.geometry) this._bMesh.geometry.dispose();
                if (this._lMesh.geometry) this._bMesh.geometry.dispose();
                if (this._rMesh.geometry) this._bMesh.geometry.dispose();

                this._bMesh.geometry = hbox;
                this._tMesh.geometry = hbox;
                this._lMesh.geometry = vbox;
                this._rMesh.geometry = vbox;

                if (this.hasCrossedLines) {
                    this._line1.geometry.verticesNeedUpdate = true;
                    this._line2.geometry.verticesNeedUpdate = true;
                }
            }

            // bottom mesh 
            this._bMesh.position.set(gx, gy - ((-wBox / 2) + yoffs + (yLen / 2)), gz + zoffs);

            // top mesh
            this._tMesh.position.set(gx, gy + ((-wBox / 2) + yoffs + (yLen / 2)), gz + zoffs);

            // left mesh
            this._lMesh.position.set(gx - ((-wBox / 2) + xoffs + (xLen / 2)), gy, gz + zoffs);

            // right mesh
            this._rMesh.position.set(gx + ((-wBox / 2) + xoffs + (xLen / 2)), gy, gz + zoffs);

            this._udpdateRequired = false;
        }

        // Display zone selection
        ZoneSelection.prototype.display = function () {
            if (!this.mesh || this._udpdateRequired)
                this.update();

            menuiserieEnv.getThreeEnv().scene.add(this.mesh);
            this._isDisplayed = true;
        }

        // Hide zone selection
        ZoneSelection.prototype.hide = function () {
            if (this.mesh)
                menuiserieEnv.getThreeEnv().scene.remove(this.mesh);

            this._isDisplayed = false;
        }

        // Hide and invalidate the selection
        ZoneSelection.prototype.invalidate = function () {
            this.hide();
            this._udpdateRequired = true;
        }

        // Return true if selection is displayed
        ZoneSelection.prototype.isDisplayed = function () { return this._isDisplayed; }

        ZoneSelection.prototype.dispose = function () {
            if (this._bMesh && this._bMesh.geometry)
                this._bMesh.geometry.dispose();

            if (this._tMesh && this._tMesh.geometry)
                this._tMesh.geometry.dispose();

            if (this._lMesh && this._lMesh.geometry)
                this._lMesh.geometry.dispose();

            if (this._rMesh && this._rMesh.geometry)
                this._rMesh.geometry.dispose();
        }

        //#endregion

        //#region Zone class
        // Constructor
        var Zone = function () {
            this.title = "";
            this.parentZone = null;
            this.compound;
            this.xdim = 0;
            this.ydim = 0;
            this.zdim = 0;
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.mesh = undefined;
            this.hasXDimAuto = true;
            this.hasYDimAuto = true;
            this.hasZDimAuto = true;
            this.canSelectIfFilled = false; // If true, zone can be selected when it contains sub-items too.
            this.isOff = false; // locked zone is always empty but in many case cannot be modified (ex : back-panels are in off zone).

            this.subItems = [];
            this.splitter = undefined;

            //this.backPanel;
            //this.backPanelZone;

            this._sel3D = new ZoneSelection(this);
            this._position = new THREE.Vector3();
        }

        // Write to node
        Zone.prototype.writeTo = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var subNode;
            var i;
            var array;

            srz.write('title', me.title, n);
            srz.write('xdim', me.xdim, n);
            srz.write('ydim', me.ydim, n);
            srz.write('zdim', me.zdim, n);
            srz.write('x', me.x, n);
            srz.write('y', me.y, n);
            srz.write('z', me.z, n);
            srz.write('xDimAuto', me.hasXDimAuto, n);
            srz.write('yDimAuto', me.hasYDimAuto, n);
            srz.write('zDimAuto', me.hasZDimAuto, n);
            srz.write('canSelectIfFilled', me.canSelectIfFilled, n);
            srz.write('isOff', me.isOff, n);

            if (me.splitter) {
                subNode = {};
                me.splitter.writeTo(serializer, subNode);
                srz.write('splitter', subNode, n);
            }
            else
                srz.write('splitter', null, n);

            // The sub-items
            array = [];
            for (i = 0 ; i < me.subItems.length ; i++) {
                var sub = me.subItems[i];
                if (!sub.writeTo)
                    throw new Error("[" + applicationName + "] Sub-item of zone must implement writeTo() method. Serialization of zone failed.");

                if (!sub.getEzType)
                    throw new Error("[" + applicationName + "] Sub-item of zone must implement getEzType() method. Serialization of zone failed.");

                subNode = { ezTyp: sub.getEzType(), data: {} };
                sub.writeTo(serializer, subNode.data);
                array.push(subNode);
            }
            srz.write('subItems', array, n);

            // Back-panel zone
            /*if (me.backPanelZone) {
                subNode = {};
                me.backPanelZone.writeTo(serializer, subNode);
                srz.write('bckzon', subNode, n);
            }
            else
                srz.write('bckzon', null, n);*/
        }

        // Read from node
        Zone.prototype.readFrom = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var subNode;
            var i;
            var array;

            me.splitter = undefined;

            me.title = srz.read('title', n);
            me.xdim = srz.read('xdim', n);
            me.ydim = srz.read('ydim', n);
            me.zdim = srz.read('zdim', n);
            me.x = srz.read('x', n);
            me.y = srz.read('y', n);
            me.z = srz.read('z', n);
            me.hasXDimAuto = srz.read('xDimAuto', n);
            me.hasYDimAuto = srz.read('yDimAuto', n);
            me.hasZDimAuto = srz.read('zDimAuto', n);
            me.canSelectIfFilled = srz.read('canSelectIfFilled', n);
            me.isOff = srz.read('isOff', n);
                
            subNode = srz.read('splitter', n);
            if (subNode !== null) 
                me.splitter = srz.deserialize('Splitter', subNode, { splittedZone: me });
            else
                me.splitter = undefined;

            // The sub-items
            array = srz.read('subItems', n);
            for (i = 0 ; i < array.length ; i++) {
                var item = array[i];
                var sub = srz.deserialize(item.ezTyp, item.data, { parentZone: me });
                me.subItems.push(sub);
            }

            // Back-panel zone
            /*subNode = srz.read('bckzon', n);
            if (subNode !== null) {
                me.backPanelZone = srz.deserialize('Zone', subNode, { parentZone: me, compound: me.compound });
                me.backPanel = me.subItems[0];
            }
            else
                me.backPanelZone = undefined;*/
        }

        // Get the zone material according to auto-size status and scene mode
        Zone.prototype.getCurrentZoneMat = function () {
            var ENV = menuiserieEnv.getThreeEnv();

            if (ENV.sceneMode === 'work') {

                if (this.isFullAuto())
                    return menuiserieEnv.getAutoZoneMat();
                else
                    return menuiserieEnv.getFixedZoneMat();
            }
            else
                return _hiddenZoneMat;
        }

        // Update the zone
        Zone.prototype.update = function () {
            var me = this;
            var i;

            var g = new THREE.BoxGeometry(me.xdim - 0.2, me.ydim - 0.2, me.zdim + 0.2);
            if (!me.mesh) {
                me.mesh = menuiserieEnv.createMesh(g, this.getCurrentZoneMat(), false);
                me.mesh.userData.zone = me;
                me.mesh.name = me.title;
            }
            else {
                if (me.mesh.geometry) me.mesh.geometry.dispose();

                me.mesh.material = this.getCurrentZoneMat();
                me.mesh.geometry = g;
            }

            me.mesh.position.set(me.x, me.y, me.z);

            // invalidate the selection
            if (me._sel3D.isDisplayed()) {
                me._sel3D.invalidate();
                me._sel3D.display();
            }
            else
                me._sel3D.invalidate();

            // The back-panel if any
            /*if (me.backPanel) {
                me.backPanel.update();
                me.backPanelZone.xdim = me.xdim;
                me.backPanelZone.ydim = me.ydim;
                me.backPanelZone.zdim = me.zdim - me.backPanel.getThickness();
                me.backPanelZone.x = me.x;
                me.backPanelZone.y = me.y;
                me.backPanelZone.z = me.z + me.backPanel.getThickness();
                me.backPanelZone.update();
            }*/

            // The splitter
            if (me.splitter)
                me.splitter.update();

            // The sub-items
            for (i = 0 ; i < me.subItems.length ; i++) {
                if (me.subItems[i] && me.subItems[i].update)
                    me.subItems[i].update();
            }
        }

        // Add components
        Zone.prototype.add = function (item) {
            this.subItems.push(item);
        }

        // Methods to get dimension
        Zone.prototype.getWidth = function () { return this.xdim }
        Zone.prototype.getHeight = function () { return this.ydim }
        Zone.prototype.getDepth = function () { return this.zdim }

        // Get compound
        Zone.prototype.getCompound = function() { return this.compound }

        // Methods to set width
        Zone.prototype.setWidth = function (w) {
            if (this.hasXDimAuto) throw new Error("[" + applicationName + "] Cannot set width of auto-size zone.");
            this.xdim = w;
        }

        // Methods to set height
        Zone.prototype.setHeight = function (h) {
            if (this.hasYDimAuto) throw new Error("[" + applicationName + "] Cannot set height of auto-size zone.");
            this.ydim = h;
        }

        // Methods to set depth
        Zone.prototype.setDepth = function (d) {
            if (this.hasZDimAuto) throw new Error("[" + applicationName + "] Cannot set depth of auto-size zone.");
            this.zdim = d;
        }

        // Selection and unselection
        Zone.prototype.select = function () { this._sel3D.display(); }
        Zone.prototype.unselect = function () { this._sel3D.hide(); }
        
        // Return true if two dimensions of zone are auto
        Zone.prototype.isFullAuto = function () { return this.hasXDimAuto && this.hasYDimAuto }

        // Set the X dimension autosize status. Status of sub-zone if any has changed too.
        Zone.prototype.setXDimAuto = function (auto) {
            this.hasXDimAuto = auto;

            if (this.splitter) {
                for (var i = 0 ; i < this.splitter.getSubZoneCount() ; i++) {
                    this.splitter.getSubZone(i).hasXDimAuto = auto;
                }
            }

            if (this.mesh)
                this.mesh.material = this.getCurrentZoneMat();
        }

        // Set the Y dimension autosize status. Status of sub-zone if any has changed too.
        Zone.prototype.setYDimAuto = function (auto) {
            this.hasYDimAuto = auto;

            if (this.splitter) {
                for (var i = 0 ; i < this.splitter.getSubZoneCount() ; i++) {
                    this.splitter.getSubZone(i).hasYDimAuto = auto;
                }
            }

            if (this.mesh)
                this.mesh.material = this.getCurrentZoneMat();
        }

        // Return true if the whole tree of this zone is empty, i.e contains no items in whole tree.
        // Note that off zone are alway considered as empty. 
        Zone.prototype.isEmpty = function () {
            var me = this;

            if (me.isOff) return true; // Off zone is always empty.

            // Test sub-items
            if (me.hasContent()) return false;

            // Test splitter if any
            var sp = me.splitter;
            if (sp && !sp.isEmpty()) {
                return false;
                /*var i;
                if (sp.separators.length > 0) return false;

                for (i = 0 ; i < sp.subZones.length ; i++) {
                    if (!sp.subZones[i].isOff && !sp.subZones[i].isEmpty()) return false;
                }*/
            }

            return true;
        }

        // Retrun true if is splitted.
        Zone.prototype.isSplitted = function () { return this.splitter ? true : false }

        // Return true if this zone has sub-items (off sub-item are not considered). 
        // For the whole tree see isEmpty().
        Zone.prototype.hasContent = function () {
            if (this.isOff) return false;

            for (var i = 0 ; i < this.subItems.length ; i++) {
                if (!this.subItems[i].isOff) return true;
            }
            
            return false;
        }

        // Make this zone empty, i.e empty subItems and empty its splitter
        /*Zone.prototype.empty = function () {
            this.subItems = [];
            if (this.splitter)
                this.splitter.empty();
        }*/

        // Return the position of zone as THREE.Vector3
        Zone.prototype.getPosition = function () {
            this._position.set(
                this.x,
                this.y,
                this.z
            )

            return this._position;
        }

        // Clear the zone, i.e undefine splitter and empty sub-items.
        // Warning ! Data are definitively lost.
        Zone.prototype.clear = function () {
            this.splitter = undefined;
            this.subItems = [];
        }

        // Remove sub-item from zone
        Zone.prototype.removeSubItem = function (removedItem) {
            var si = this.subItems;
            var newSi = [];
            for (var i = 0 ; i < si.length ; i++) {
                if (si[i] !== removedItem)
                    newSi.push(si[i]);
            }

            this.subItems = newSi;
        }

        // Fill the content of this zone with the content of another zone.
        // It is not a copy, splitter and sub-items are detached from anotherZone.
        // This zone must be empty.
        Zone.prototype.attachContentOf = function (anotherZone) {
            if (!this.isEmpty())
                throw new Error("[" + applicationName + "] The zone must be empty. Cannot fill the zone.");

            var i;

            this.canSelectIfFilled = anotherZone.canSelectIfFilled;
            this.isOff = anotherZone.isOff;

            if (anotherZone.splitter) {
                this.splitter = anotherZone.splitter; // Associate splitter
                this.splitter.zone = this; // Splitter become associate with this zone
                for (i = 0 ; i < this.splitter.subZones.length ; i++)
                    this.splitter.subZones[i].parentZone = this; // Attach now each sub-zone of splitter to this zone
            }

            this.subItems = anotherZone.subItems; // Associate subitems
            for (i = 0 ; i < this.subItems.length ; i++) {
                if (this.subItems[i].setParentZone) // rebind the parent zone if required
                    this.subItems[i].setParentZone(this);
            }
        }

        // Clone the content of anotherZone and attach the copy to this zone
        // Serializer is used to make the copy.
        // This zone must be empty.
        Zone.prototype.cloneAndAttachContentOf = function (serializer, anotherZone) {
            if (!this.isEmpty())
                throw new Error("[" + applicationName + "] The zone must be empty. Cannot clone and fill the zone.");

            var t = this.title; // save title
            var node = {}
            anotherZone.writeTo(serializer, node);
            this.readFrom(serializer, node);
            this.title = t; // restore title
        }

        //// IContainer
        Zone.prototype.getSubCount = function () { return this.subItems.length + (this.splitter ? 1 : 0) }
        Zone.prototype.getSub = function (i) {
            var me = this;
            var n = me.getSubCount();
            if (i >= n) throw new Error("[" + applicationName + "] Out of bounds error by Zone.getSub() with index " + i);

            if (i < me.subItems.length)
                return me.subItems[i];
            else
                return me.splitter;
        }

        //// IVisualizable
        // Display this zone
        Zone.prototype.display = function () {
            var me = this;
            var canDisplay = true;

            if (me.subItems && me.subItems.length > 0)
                canDisplay = me.canSelectIfFilled;

            if (me.splitter)
                canDisplay = false; // never display a splitted zone

            //if (me.backPanel)
            //    canDisplay = false; // never display a zone with back-panel

            if (canDisplay && me.mesh) {
                //$log.debug("Display zone '" + me.title + "'.")
                menuiserieEnv.getThreeEnv().scene.add(me.mesh)
            }
        }

        // Hide this zone
        Zone.prototype.hide = function () {
            if (this.mesh)
                menuiserieEnv.getThreeEnv().scene.remove(this.mesh)

            /*if (this._sel3D)
                this._sel3D.hide();*/
        }

        // Update the material of zone
        Zone.prototype.updateThreeMat = function () {
            if (!this.mesh) return;
            this.mesh.material = this.getCurrentZoneMat();
        }

        Zone.prototype.dispose = function () {
            if (this.mesh && this.mesh.geometry)
                this.mesh.geometry.dispose();

            if (this._sel3D)
                this._sel3D.dispose();
        }

        //#endregion

        //#region Splitter class
        // Constructor
        var Splitter = function () {
            this.orientation;
            this.title = this.orientation;
            this.separatorCount = 0;
            this.zone; // The splitted zone
            this.separators = []; // Panel objects
            this.subZones = []; // sub-zones.
            this.isInitialized = false;
            this.virtualSeparator = false; // If true, separator panel are not created, i.e this.separators array is always empty.
            this.withBottom = false; // In full vertical prior case : first separator is bottom part
            this.withTop = false; // In full vertical prior case :  last separator is top part
        }

        // Write to node
        Splitter.prototype.writeTo = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var subNode;
            var i;
            var array = [];

            srz.write('title', me.title, n);
            srz.write('orient', me.orientation, n);
            srz.write('sepCount', me.separatorCount, n);

            array = [];
            if (!me.virtualSeparator) {
                
                for (i = 0 ; i < me.separatorCount ; i++) {
                    subNode = {};
                    me.separators[i].writeTo(serializer, subNode);
                    array.push(subNode);
                }
            }
            srz.write('separators', array, n);

            array = [];
            for (i = 0 ; i < me.subZones.length ; i++) {
                subNode = {};
                me.subZones[i].writeTo(serializer, subNode);
                array.push(subNode);
            }
            srz.write('subZones', array, n);

            srz.write('isInit', me.isInitialized, n);
            srz.write('virtualSep', me.virtualSeparator, n);
            srz.write('withBottom', me.withBottom, n);
            srz.write('withTop', me.withTop, n);
        }

        // Read from node
        Splitter.prototype.readFrom = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var subNode;
            var i;
            var array = [];

            me.title = srz.read('title', n);
            me.orientation = srz.read('orient', n);
            me.separatorCount = srz.read('sepCount', n);

            array = srz.read('separators', n);;
            for (i = 0 ; i < array.length ; i++) {
                subNode = srz.deserialize('Panel', array[i], { parentZone: me.zone });
                me.separators.push(subNode);
            }

            array = srz.read('subZones', n);
            for (i = 0 ; i < array.length ; i++) {
                subNode = srz.deserialize('Zone', array[i], { parentZone: me.zone, compound: me.zone.getCompound() });
                me.subZones.push(subNode);
            }

            me.isInitialized = srz.read('isInit', n);
            me.virtualSeparator = srz.read('virtualSep', n);
            me.withBottom = srz.read('withBottom', n);
            me.withTop = srz.read('withTop', n);
        }

        // Return true if this splitter has horizontal mode
        Splitter.prototype.isHorizontal = function () {
            return this.orientation == 'horizontal';
        }

        // Get or set the orientation
        Splitter.prototype.getOrientation = function() { return this.orientation }
        Splitter.prototype.setOrientation = function(orient) {
            if (orient === 'horizontal' || orient === 'vertical' || orient === 'inDepth')
                this.orientation = orient;
            else
                throw new Error("[" + applicationName + "] Unsupported splitter orientation '" + orient + "'.");
        }

        // Get the splitted zone
        Splitter.prototype.getSplittedZone = function() { return this.zone }

        /* Split a dimension D according to separator thickness and the desired sub-zone count.
         args : {
          D: (number) the dimension to split, i.e the width or height of splitted zone.
          zonePos: (number) the position of splitted zone (x or y coordinate).
          sepThick: (number) the separators thickness.
          szInfos: (array of {dim: (number), pos: (number), auto: (bool), minDim: (number) }) the sub-zones informations.
         }
         Return : {
          sepPositions: (array of number) the position of separators
          szInfos: like args.szInfos. only for convenience.
         }*/
        Splitter.prototype.split = function (args) {
            var D = args.D;
            var zonePos = args.zonePos;
            var thick = args.sepThick;
            var szInfos = args.szInfos;
            var szCount = szInfos.length; //szInfos ? szInfos.length : args.szCount;

            // Results
            var sepPositions = [];

            var i;
            var sepCount = szCount - 1;

            // Compute count and sum of fixed zone
            var sumOfFixed = 0;
            var fixedCount = 0;
            for (i = 0 ; i < szInfos.length ; i++) {
                if (!szInfos[i].auto) {
                    sumOfFixed += szInfos[i].dim;
                    fixedCount++;
                }
            }

            // Compute dim of auto-zone
            var sumOfAuto = (D - (sepCount * thick)) - sumOfFixed;
            var autoZoneDim = sumOfAuto / (szInfos.length - fixedCount);

            // Update the zone infos
            var offs = 0;
            for (i = 0 ; i < szInfos.length ; i++) {
                if (szInfos[i].auto) {
                    szInfos[i].dim = autoZoneDim;
                }

                szInfos[i].pos = zonePos + (-(D / 2) + offs) + (szInfos[i].dim / 2);
                offs += szInfos[i].dim + thick;
            }

            // Separator position
            offs = 0;
            for (i = 0 ; i < sepCount ; i++) {
                offs += szInfos[i].dim;

                var pos = -(D / 2) + offs + (thick / 2);
                sepPositions.push(pos);

                offs += thick;
            }

            return {
                sepPositions: sepPositions,
                szInfos: szInfos
            }
        }

        // Get sub-zone infos according to current mode 'horizontal' or 'vertical'.
        // sz : (Optional Zone) the sub-zone from informations was retrieved. If not define return an auto-size zone without dimension.
        Splitter.prototype.getSubZoneInfo = function (sz) {
            var szInfo;

            if (sz) {
                var orient = this.orientation;
                if (orient === 'horizontal')
                    szInfo = { dim: sz.xdim, auto: sz.hasXDimAuto };
                else if (orient === 'vertical')
                    szInfo = { dim: sz.ydim, auto: sz.hasYDimAuto };
                else if (orient === 'inDepth')
                    szInfo = { dim: sz.zdim, auto: sz.hasZDimAuto };
                else
                    throw new Error("[" + applicationName + "] Unsupported splitter orientation '" + orient + "'. Cannot get sub-zone information.");
            }
            else {
                szInfo = { dim: undefined, auto: true };
            }

            return szInfo;
        }

        // Get array of sub-zone infos according to current mode 'horizontal' or 'vertical'.
        Splitter.prototype.getArrayOfSubZoneInfos = function () {
            var i;
            var szInfos = [];

            if (!this.isInitialized) { // Initialization required
                for (i = 0 ; i < this.separatorCount + 1 ; i++) {
                    szInfos.push(this.getSubZoneInfo());
                }
            }
            else {
                for (i = 0 ; i < this.subZones.length ; i++) {
                    szInfos.push(this.getSubZoneInfo(this.subZones[i]));
                }
            }

            return szInfos;
        }

        // Make sub-zone title by concatenating splitter title and i.
        Splitter.prototype.makeSubZoneTitle = function (i) {
            return this.title + " #" + i;
        }

        // Update horizontal panel according to withBottom and withTop status. Depend on closet model class.
        // Reserved for internal use in vertical splitting mode.
        Splitter.prototype.updateHorizontalPanelKind = function (P, isFirst, isLast) {
            if (isFirst && this.withBottom)
                menuiseriePanelFactory.beBottom(P);
            else if (isLast && this.withTop)
                menuiseriePanelFactory.beTop(P);
            else
                menuiseriePanelFactory.beShelf(P);

            return P;
        }

        // Private : Compute splitting in horizontal mode
        // szInfos : The sub-zone infos computed previously with getArrayOfSubZoneInfos(). 
        Splitter.prototype._computeHMode = function (szInfos) {
            var i;
            var Z = this.zone;
            var C = Z.compound;

            // Do splitting compute
            var splitRes = this.split({
                D: Z.xdim,
                zonePos: Z.x,
                sepThick: this.virtualSeparator ? 0 : C.getDefaultThickness(),
                szInfos: szInfos,
                szCount: this.separatorCount + 1
            });

            // update the separator
            if (!this.virtualSeparator) {
                var p;
                var seps = this.separators;
                for (i = 0 ; i < this.separatorCount ; i++) {
                    if (!this.isInitialized) {
                        p = menuiseriePanelFactory.create(Z);
                        menuiseriePanelFactory.beSeparator(p);
                        seps.push(p);
                    }
                    else
                        p = seps[i];

                    // Before rotation
                    p.length = Z.getHeight();
                    p.width = Z.getDepth() - p.getMargins().front;
                    //p.thickness = C.getDefaultThickness();

                    // Global dim
                    p.xdim = C.getDefaultThickness();
                    p.ydim = p.length;
                    p.zdim = p.width;

                    p.rot = { x: -Math.PI / 2, y: 0, z: Math.PI / 2, order: 'ZYX' };

                    // After rotation
                    p.x = splitRes.sepPositions[i];
                    p.y = Z.y;
                    p.z = menuiseriePositionerFactory.getMarginZOffs(p.getMargins()) + Z.z;

                    p.update();
                }
            }

            // update the sub-zones
            var sz;
            var subZones = this.subZones;
            for (i = 0 ; i < this.separatorCount + 1 ; i++) {
                if (!this.isInitialized) {
                    sz = _createZone(this.makeSubZoneTitle(i + 1), C, Z);
                    subZones.push(sz);
                }
                else
                    sz = subZones[i];

                sz.xdim = splitRes.szInfos[i].dim;
                sz.ydim = Z.ydim;
                sz.zdim = Z.zdim;
                sz.x = splitRes.szInfos[i].pos;
                sz.y = Z.y;
                sz.z = Z.z;
                sz.hasXDimAuto = splitRes.szInfos[i].auto;
                sz.hasYDimAuto = Z.hasYDimAuto;
                sz.hasZDimAuto = Z.hasZDimAuto;

                sz.update();
            }

            return splitRes;
        }

        // Private : Compute splitting in vertical mode
        // szInfos : The sub-zone infos computed previously with getArrayOfSubZoneInfos().
        Splitter.prototype._computeVMode = function (szInfos) {
            var i;
            var Z = this.zone;
            var C = Z.compound;
            var closetModel = C.getClosetModel();


            // Do splitting compute
            var splitRes = this.split({
                D: Z.ydim,
                zonePos: Z.y,
                sepThick: this.virtualSeparator ? 0 : C.getDefaultThickness(),
                szInfos: szInfos,
                szCount: this.separatorCount + 1
            });

            // update the separator
            if (!this.virtualSeparator) {
                var p;
                var seps = this.separators;
                for (i = 0 ; i < this.separatorCount ; i++) {
                    if (!this.isInitialized) {
                        p = menuiseriePanelFactory.create(Z);
                        p = this.updateHorizontalPanelKind(p, i === 0, i === this.separatorCount - 1);
                        seps.push(p);
                    }
                    else
                        p = seps[i];

                    // before rotation
                    p.length = Z.getWidth();
                    p.width = Z.getDepth() - p.getMargins().front;
                    //p.zdim = C.getDefaultThickness();

                    // Global dim
                    p.xdim = p.length;
                    p.ydim = C.getDefaultThickness();
                    p.zdim = p.width;

                    p.rot = { x: -Math.PI / 2, y: 0, z: 0 };

                    // after rotation
                    p.x = Z.x;
                    p.y = splitRes.sepPositions[i];
                    p.z = menuiseriePositionerFactory.getMarginZOffs(p.getMargins()) + Z.z;

                    p.update();
                }
            }

            // update the sub-zones
            var sz;
            var subZones = this.subZones;
            for (i = 0 ; i < this.separatorCount + 1 ; i++) {
                if (!this.isInitialized) {
                    sz = _createZone(this.makeSubZoneTitle(i + 1), C, Z);
                    subZones.push(sz);
                }
                else
                    sz = subZones[i];

                sz.xdim = Z.xdim;
                sz.ydim = splitRes.szInfos[i].dim;
                sz.zdim = Z.zdim;
                sz.x = Z.x;
                sz.y = splitRes.szInfos[i].pos;
                sz.z = Z.z;
                sz.hasXDimAuto = Z.hasXDimAuto;
                sz.hasYDimAuto = splitRes.szInfos[i].auto;
                sz.hasZDimAuto = Z.hasZDimAuto;

                sz.update();
            }

            return splitRes;
        }

        // Private : Compute splitting for in-depth mode
        // szInfos : The sub-zone infos computed previously with getArrayOfSubZoneInfos(). 
        Splitter.prototype._computeDMode = function (szInfos) {
            var i;
            var Z = this.zone;
            var C = Z.compound;

            // Do splitting compute
            var splitRes = this.split({
                D: Z.zdim,
                zonePos: Z.z,
                sepThick: this.virtualSeparator ? 0 : C.getDefaultThickness(),
                szInfos: szInfos,
                szCount: this.separatorCount + 1
            });

            // update the separator
            if (!this.virtualSeparator) {
                throw new Error("[" + applicationName + "] Real separator not implemented for 'in-depth' orientation.")
            }

            // update the sub-zones
            var sz;
            var subZones = this.subZones;
            for (i = 0 ; i < this.separatorCount + 1 ; i++) {
                if (!this.isInitialized) {
                    sz = _createZone(this.makeSubZoneTitle(i + 1), C, Z);
                    subZones.push(sz);
                }
                else
                    sz = subZones[i];

                sz.xdim = Z.xdim;
                sz.ydim = Z.ydim;
                sz.zdim = splitRes.szInfos[i].dim;
                sz.x = Z.x;
                sz.y = Z.y;
                sz.z = splitRes.szInfos[i].pos;
                sz.hasXDimAuto = Z.hasXDimAuto;
                sz.hasYDimAuto = Z.hasYDimAuto;
                sz.hasZDimAuto = splitRes.szInfos[i].auto;

                sz.update();
            }

            return splitRes;
        }

        // Update the splitter. Compute compound division
        // szInfos : The sub-zone infos computed previously with getArrayOfSubZoneInfos(). If undefined, this method call getSubZoneInfos() itself.
        Splitter.prototype.update = function (szInfos) {
            var i;
            var creation = this.separators.length == 0; // Separators was never created
            var Z = this.zone;
            var C = Z.compound;

            // Get the sub-zone infos if does not provided
            var szi = szInfos ? szInfos : this.getArrayOfSubZoneInfos();

            var splitRes;
            if (this.orientation === 'horizontal') { // Generate vertical separators
                splitRes = this._computeHMode(szi);
            }
            else if (this.orientation === 'vertical') { // Generate horizontal separators
                splitRes = this._computeVMode(szi);
            }
            else if (this.orientation === 'inDepth') { // Generate in-depth separators
                splitRes = this._computeDMode(szi);
            }
            else
                throw new Error("[" + applicationName + "] Unsupported splitter orientation '" + this.orientation + "'. Update failed.");

            this.isInitialized = true;
            return splitRes;
        }

        // Return true if whole tree is empty.
        // Off sub-zone are not condifered.
        Splitter.prototype.isEmpty = function () {
            var me = this;
            var i;

            var sepLength = me.separators.length;
            if (me.withBottom) sepLength--;
            if (me.withTop) sepLength--;

            if (sepLength > 0) return false;

            for (i = 0 ; i < me.subZones.length ; i++) {
                if (/*!me.subZones[i].isOff &&*/ !me.subZones[i].isEmpty()) return false;
            }

            return true;
        }
        
        // Clear the splitter : remove all separtors and sub-zones
        // The count of separator (separatorCount property), is not released.
        /*Splitter.prototype.clear = function () {
            this.separators = [];
            this.subZones = [];
            this.isInitialized = false;
        }*/

        // Make this splitter empty, i.e clear it and set separatorCount to 0
        /*Splitter.prototype.empty = function () {
            this.clear();
            this.separatorCount = 0;
        }*/

        // Get count of sub-zones autosize
        Splitter.prototype.getAutoSizeCount = function () {
            var i;
            var n = 0;
            var isHor = this.isHorizontal();
            for (i = 0 ; i < this.subZones.length ; i++) {
                if (this.orientation === 'horizontal') {
                    if (this.subZones[i].hasXDimAuto) n++;
                }
                else if (this.orientation === 'vertical') {
                    if (this.subZones[i].hasYDimAuto) n++;
                }
                else if (this.orientation === 'inDepth') {
                    if (this.subZones[i].hasZDimAuto) n++;
                }
            }

            return n;
        }

        // Get the subzone index. Return -1 if not found.
        Splitter.prototype.getSubZoneIndex = function (zone) {
            var i;
            var zoneIndex = -1;
            for (i = 0 ; i < this.subZones.length && zoneIndex === -1 ; i++) {
                if (this.subZones[i] === zone) {
                    zoneIndex = i;
                }
            }

            return zoneIndex;
        }
        
        // Get the adjacent zone index according the specified zoneIndex and separatorSide.
        // separatorSide : 'left', 'bottom', 'right' or top' side.
        // Return -1 if no adjacent zone (ex. leftOrBottom case for 1st zone).
        Splitter.prototype.getAdjSubZoneIndex = function (zoneIndex, separatorSide) {
            // Get side of separator to remove
            var sepAtLeftOrBottom;
            if (separatorSide === 'left' || separatorSide === 'bottom')
                sepAtLeftOrBottom = true;
            else if (separatorSide === 'right' || separatorSide === 'top')
                sepAtLeftOrBottom = false;
            else
                throw new Error("[" + applicationName + "] Unsupported side '" + separatorSide + "'. Cannot get the adjacent zone index.");

            var adjIndex = sepAtLeftOrBottom ? zoneIndex - 1 : zoneIndex + 1;
            
            if (adjIndex < 0 || zoneIndex >= this.subZones.length)
                return -1
            else
                return adjIndex;
        }

        // Get the separator thickness according to virtualSeparator flag
        Splitter.prototype.getThicknessSeparator = function () {
            return this.virtualSeparator ? 0 : this.zone.compound.getDefaultThickness()
        }

        // IZoneContainer
        Splitter.prototype.getSubZoneCount = function () { return this.subZones ? this.subZones.length : 0 }
        Splitter.prototype.getSubZone = function (i) { return this.subZones[i] }

        // IContainer
        Splitter.prototype.getSubCount = function () { return this.separators ? this.separators.length : 0 }
        Splitter.prototype.getSub = function (i) { return this.separators[i] }
        //#endregion

        return {

            // Create zone owned by specified compound with its optional parent zone.
            // title: title of zone.
            // compound: (Compound) The project compound that own the zone
            // parentZone: (optional Zone) The zone container
            createZone: function (title, compound, parentZone) {
                return _createZone(title, compound, parentZone);
            },

            // Create buffer zone. Use for temporary backup content of another zone only.
            createBufferZone: function () {
                return _createZone('_buffer_', null, null);
            },

            // Create new splitter
            // orientation: 'vertical' or 'horizontal'
            // separatorCount : separator count
            // splittedZone : the splitted zone
            // title: (optional) The title of splitter. Impact sub-zone naming.
            createSplitter: function (orientation, separatorCount, splittedZone, title) {
                if (orientation != 'horizontal' && orientation != 'vertical' && orientation != 'inDepth')
                    throw new Error("[" + applicationName + "] Unsupported splitter orientation '" + orientation + "'.");

                if (splittedZone.splitter)
                    throw new Error("[" + applicationName + "] The zone '" + splittedZone.title + "' was already splitted.");

                var s = new Splitter();
                s.orientation = orientation;
                s.separatorCount = separatorCount;
                s.zone = splittedZone;
                s.zone.splitter = s; // Bind zone with its splitter
                if (title) s.title = title;
                return s;
            }

        }
    }

    //registration
    thisModule.factory('menuiserieZoneFactory', ["$log", "menuiserieEnv", "menuiseriePanelFactory", "menuiseriePositionerFactory", zoneFactory]);

    //#endregion

    //#region ClosetComposer

    // Responsible of closet composer singleton.
    // A closet composer must implement 3 methods :
    //  - updatePart()
    //  - updateZone()
    //  - getType()
    // It is used to compose the main parts of closet, in particular the part priorities.
    function closetComposer(menuiserieEnv) {

        //#region HorPriorComposer class

        // Constructor
        var HorPriorComposer = function () {
        }

        // Must update the parts according to composer rules.
        // C : the closet compound that own the part
        // part : the part to update. You can acces to the positionner to change the position
        // typeOfPart : the kind of part : 'top', 'bottom', 'left', 'right'.
        HorPriorComposer.prototype.updatePart = function (C, part, typOfPart) {
            if (!part) return;

            if (typOfPart === 'left' || typOfPart === 'right') {
                //var pos = part.positioner;
                part.margins.top = C.getDefaultThickness();
                part.margins.bottom = C.getDefaultThickness();
            }
        }

        // Must update the zones according to composer rules.
        // C : the closet compound that own the zone
        // zone : the zone to update.
        // typeOfZone : the kind of zone : 'inner', 'outer'.
        HorPriorComposer.prototype.updateZone = function (C, zone, typOfZone) {
            if (!zone) return;

            if (typOfZone === 'outer') {
                C.gzone.xdim = C.getWidth();
                C.gzone.ydim = C.getHeight();
                C.gzone.zdim = C.getDepth();
                C.gzone.update();
            }
            else if (typOfZone === 'inner') {
                C.zone.xdim = C.getWidth() - (C.getDefaultThickness() * 2);
                C.zone.ydim = C.getHeight() - (C.getDefaultThickness() * 2);
                C.zone.zdim = C.getDepth();
                C.zone.update();
            }
        }

        HorPriorComposer.prototype.getType = function () { return 'HorPriorComposer' }

        //#endregion

        //#region SeparatorOnlyComposer class

        // Constructor
        var SeparatorOnlyComposer = function () {
        }

        // Must update the parts according to composer rules.
        SeparatorOnlyComposer.prototype.updatePart = function (C, part, typOfPart) {
            // nothing done
        }

        // Must update the zones according to composer rules.
        SeparatorOnlyComposer.prototype.updateZone = function (C, zone, typOfZone) {
            if (!zone) return;

            if (typOfZone === 'outer') {
                C.gzone.xdim = C.getWidth();
                C.gzone.ydim = C.getHeight();
                C.gzone.zdim = C.getDepth();
                C.gzone.update();
            }
            else if (typOfZone === 'inner') {
                C.zone.xdim = C.getWidth() - (C.getDefaultThickness() * 2);

                C.zone.ydim = C.getHeight();

                C.zone.zdim = C.getDepth();
                C.zone.update();
            }
        }

        SeparatorOnlyComposer.prototype.getType = function () { return 'SeparatorOnlyComposer' }

        //#endregion

        // The composer singleton
        var _horPriorComposer;
        var _sepOnlyComposer;

        return {

            // Get HorPriorComposer singleton.
            getHorPrior: function () {
                if (!_horPriorComposer) _horPriorComposer = new HorPriorComposer();
                return _horPriorComposer;
            },

            // Get SeparatorOnlyComposer singleton.
            getSeparatorOnly: function () {
                if (!_sepOnlyComposer) _sepOnlyComposer = new SeparatorOnlyComposer();
                return _sepOnlyComposer;
            },
            
            // Get composer singleton by type name
            getByType: function(typName) {
                if (typName === 'HorPriorComposer')
                    return this.getHorPrior();
                else if (typName === 'SeparatorOnlyComposer')
                    return this.getSeparatorOnly();
                else
                    throw new Error("[" + applicationName + "] Unknown type of composer '" + typName + "'. Get closet composer by type name failed.")
            }

        }
    }

    //registration
    thisModule.factory('menuiserieClosetComposer', ["menuiserieEnv", closetComposer]);

    //#endregion

    //#region HangingBar Factory
    function hangingBarFactory(menuiserieEnv, menuiserieDataFactory) {

        //#region HangingBar class
        // Constructor
        var HangingBar = function (hangingBarModel) {
            var me = this;
            me.parentZone;
            me._initCItem_(me);
            me.mesh;
            me.hangingBarModel = hangingBarModel;
            me.title = hangingBarModel ? hangingBarModel.Title : "";
            me.ecoTax = 0;
            me.weight = 0;
            me.x = 0;
            me.y = 0;
            me.z = 0;
        }

        // Inheritance
        HangingBar.prototype = new CItem();

        // Write to node
        HangingBar.prototype.writeTo = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;

            // base class write call
            CItem.prototype.writeTo.call(this, serializer, node);

            srz.writeHangingBar('mdl', me.hangingBarModel, n);

            // NOT READEN DATA
            srz.write('l', me.parentZone.getWidth(), n);
            srz.write('x', me.x, n);
            srz.write('y', me.y, n);
            srz.write('z', me.z, n);
        }

        // Read from node
        HangingBar.prototype.readFrom = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var o;

            // base class read call
            CItem.prototype.readFrom.call(this, serializer, node);

            me.hangingBarModel = srz.readHangingBar('mdl', n);
        }

        // Update HangingBar
        HangingBar.prototype.update = function () {
            var me = this;
            var pos = me.positioner;

            // Create geometry and mesh
            var r = me.hangingBarModel.Diameter / 2;
            var g = new THREE.CylinderGeometry(r, r, me.parentZone.xdim);
            if (!me.mesh) {
                me.mesh = menuiserieEnv.createMesh(g, me.hangingBarModel.getThreeMat(), false);
                me.mesh.rotation.set(0, 0, -Math.PI / 2, 'XYZ');
            }
            else {
                if (me.mesh.geometry) me.mesh.geometry.dispose();
                me.mesh.geometry = g;
            }

            // Greatest front margin of closet to center in depth
            var C = me.parentZone.getCompound();

            // Position of mesh
            var PZ = me.parentZone;
            me.x = PZ.x;
            me.y = PZ.y + (PZ.ydim / 2 - me.hangingBarModel.TopOffset);
            me.z = PZ.z - (C.getGreatestFrontMargin() / 2);
            me.mesh.position.set(me.x, me.y, me.z);
        }

        // Get current model
        HangingBar.prototype.getModel = function () { return this.hangingBarModel }

        // Get ezType
        HangingBar.prototype.getEzType = function () { return 'HangingBar' }

        // Get length in m of hanging-bar
        HangingBar.prototype.getLen = function () { return this.parentZone.xdim / 100; }

        // Get weight in kg of hanging-bar
        HangingBar.prototype.getWeight = function () { return this.getModel().WeightPerMeter * this.getLen(); }

        //// IBOMItem
        // Fill the BOM
        HangingBar.prototype.fillBOM = function (bom) {
            var me = this;
            var C = me.parentZone.getCompound();

            if (me.getModel().PriceMode === 3) // linear mode
                me.price = me.getModel().Price * me.getLen();
            else if (me.getModel().PriceMode === 1) // unit mode
                me.price = me.getModel().Price;

            me.price = menuiserieDataFactory.getSalePrice(me.price);

            me.weight = me.getWeight();
            me.ecoTax = menuiserieDataFactory.getEcoTaxByWeight(me.weight).Value;

            bom.add({
                id: me.id,
                title: me.title,
                dims: [me.parentZone.xdim],
                dimsLabel: '(L)',
                surf: 0,
                price: me.price + me.ecoTax,
                ecoTax: me.ecoTax,
                weight: me.weight
            });
        }

        //// IVisualizable

        // Display this hanging-bar
        HangingBar.prototype.display = function () {
            if (this.mesh)
                menuiserieEnv.getThreeEnv().scene.add(this.mesh)
        }

        // Hide this hanging-bar
        HangingBar.prototype.hide = function () {
            if (this.mesh)
                menuiserieEnv.getThreeEnv().scene.remove(this.mesh)
        }
        
        //#endregion

        return {

            create: function (parentZone, hangingBarModel) {
                var H = new HangingBar(hangingBarModel);
                H.parentZone = parentZone;
                parentZone.canSelectIfFilled = true; // to can select the zone
                return H;
            }

        }
        
    }

    //registration
    thisModule.factory('menuiserieHangingBarFactory', ["menuiserieEnv", "menuiserieDataFactory", hangingBarFactory]);
    //#endregion

    //#region Compound factory
    function compoundFactory($log, menuiserieEnv, menuiserieConst, menuiserieDataFactory, menuiserieZoneFactory, menuiseriePanelFactory, menuiserieClosetComposer, menuiseriePositionerFactory) {

        //#region Closet compoud 1
        // Constructor
        var Compound1 = function () {
            this._initCItem_(this);

            this._closetModel = null;  // this member is null when compound is saved as model.

            this.width = 0;
            this.height = 0;
            this.depth = 0;

            this.defaultColour;
            this.defaultPanelModel;

            this.gzone = menuiserieZoneFactory.createZone("Closet outer zone", this);
            this.zone = menuiserieZoneFactory.createZone("Closet inner zone", this);

            this._lastItemId = 0;
            //this.getNextItemId = function () { return ++this._lastItemId }

            this.parts = [];
            this.composer;

            this.slidingDoor;
        }

        // Inheritance
        Compound1.prototype = new CItem();

        // Set the composer
        Compound1.prototype.setComposer = function (composer) { this.composer = composer; }

        // Add named parts to this closet compound. Only part owned directly by compound must be added with this method.
        // part : (Pannel) the pannel to add
        // name : (String) the name of part 'left', 'right', 'top', 'bottom';
        Compound1.prototype.addPart = function (part, name) {
            if (this.parts[name])
                throw new Error("[" + applicationName + "] One part with name '" + name + "' already exists in this closet compound.");

            part.name = name;
            this.parts[name] = part;
        }

        // Get part owned by closet compound by name
        // return undefined if not found
        Compound1.prototype.getPart = function (name) { return this.parts[name]; }

        // Return true if part with name exists
        Compound1.prototype.hasPart = function (name) { return this.parts[name] ? true : false; }

        // Get or set the closet model
        Compound1.prototype.getClosetModel = function () { return this._closetModel; }
        Compound1.prototype.setClosetModel = function (model) { this._closetModel = model; }

        // Get additionnal price according to closet-model
        // kind : (menuiserieConst.Kinds) The kind of of item. If undefined, return the additionnal price for the closet.
        Compound1.prototype.getAddPrice = function (kind) {
            var cm = this._closetModel;
            if (angular.isUndefined(kind)) return cm.AddPrice;

            var K = menuiserieConst.Kinds;

            if (kind === K.Left)
                return cm.AddPriceLeft;
            else if (kind === K.Right)
                return cm.AddPriceRight;
            else if (kind === K.Top)
                return cm.AddPriceTop;
            else if (kind === K.Bottom)
                return cm.AddPriceBottom;
            else if (kind === K.Back)
                return cm.AddPriceBack;
            else if (kind === K.Shelf)
                return cm.AddPriceShelf;
            else if (kind === K.Separator)
                return cm.AddPriceSeparator;
            else {
                $log.debug("No additional price exists for kind '" + kind + "'.")
                return 0;
            }
        }

        // Get most resctrictive front margin between separator and shelf, according to closet model
        Compound1.prototype.getGreatestFrontMargin = function () {
            var M = this._closetModel;
            return M.FrontShelfMargin > M.FrontSeparatorMargin ? M.FrontShelfMargin : M.FrontSeparatorMargin;
        }

        // Get the closet options
        Compound1.prototype.getOptions = function () { return this._options; }

        // Write to node
        Compound1.prototype.writeTo = function (serializer, node) {
            var srz = serializer;
            var me = this;
            var subNode;

            // base class write call
            CItem.prototype.writeTo.call(this, serializer, node);

            srz.write('width', me.width, node);
            srz.write('height', me.height, node);
            srz.write('depth', me.depth, node);

            srz.writeColour('defClr', me.defaultColour, node);
            srz.writePanel('defPan', me.defaultPanelModel, node);

            srz.write('composer', me.composer.getType(), node);

            subNode = {};
            me.gzone.writeTo(serializer, subNode)
            srz.write('gzone', subNode, node);

            subNode = {};
            me.zone.writeTo(serializer, subNode)
            srz.write('zone', subNode, node);

            srz.write('lastId', me._lastItemId, node);
            srz.write('options', me._options, node);
            srz.write('model', me._closetModel, node);
        }

        // Read from node
        Compound1.prototype.readFrom = function (serializer, node) {
            var srz = serializer;
            var me = this;
            var subNode;

            // base class read call
            CItem.prototype.readFrom.call(this, serializer, node);

            me.width = srz.read('width', node);
            me.height = srz.read('height', node);
            me.depth = srz.read('depth', node);

            me.defaultColour = srz.readColour('defClr', node);
            me.defaultPanelModel = srz.readPanel('defPan', node);

            var compTyp = srz.read('composer', node);
            me.composer = menuiserieClosetComposer.getByType(compTyp);

            subNode = srz.read('gzone', node);
            me.gzone.readFrom(serializer, subNode);

            // fill parts map
            for (var i = 0 ; i < me.gzone.subItems.length ; i++) {
                if (me.gzone.subItems[i].name)
                    me.parts[me.gzone.subItems[i].name] = me.gzone.subItems[i];
            }
                
            subNode = srz.read('zone', node);
            me.zone.readFrom(serializer, subNode);

            me._lastItemId = srz.read('lastId', node);
            me._closetModel = srz.read('model', node);
        }

        // Get dimensions
        Compound1.prototype.getWidth = function () { return this.width }
        Compound1.prototype.getHeight = function () { return this.height }
        Compound1.prototype.getDepth = function () { return this.depth }

        // Getter for zones
        Compound1.prototype.getInnerZone = function () { return this.zone; }
        Compound1.prototype.getOuterZone = function () { return this.gzone; }

        // Get the default thickness to use in main panels
        Compound1.prototype.getDefaultThickness = function () {
            //if (!this.defaultPanelModel.Thickness)
            //    throw new Error("[" + applicationName + "] Cannot find 'Thickness' property in material model '" + this.defaultPanelModel.Title + "'.");

            return menuiserieDataFactory.getThickValue(this.defaultPanelModel);
        }

        // Update the compound.
        Compound1.prototype.update = function () {
            var me = this;
            if (!me.composer) throw new Error("[" + applicationName + "] Missing composer in closet compound. Update failed.")

            me.price = 0;

            me.composer

            var bottomPanel = me.getPart('bottom');
            if (bottomPanel) me.composer.updatePart(me, bottomPanel, 'bottom');

            var topPanel = me.getPart('top');
            if (topPanel) me.composer.updatePart(me, topPanel, 'top');

            var leftPanel = me.getPart('left');
            if (leftPanel) me.composer.updatePart(me, leftPanel, 'left');

            var rightPanel = me.getPart('right');
            if (rightPanel) me.composer.updatePart(me, rightPanel, 'right');

            me.composer.updateZone(me, me.gzone, 'outer');
            me.composer.updateZone(me, me.zone, 'inner');

            if (me.slidingDoor)
                me.slidingDoor.update();
        }

        // Empty the compound
        Compound1.prototype.clear = function () {
            this.gzone.clear();
            this.zone.clear();
            this.parts = [];
        }

        //#endregion

        //#region Article
        var Article = function (accessoryModel) {
            var me = this;
            me.id;
            me.accessoryModel = accessoryModel;
            me.mesh = accessoryModel.createThreeMesh();
            me.positioner;
            me.ecoTax = 0;
        }

        // static margins for all articles
        Article.margins = {left: 0, right: 0, top: 0, bottom: 0, front: 0, back: 0};

        // Update article
        Article.prototype.update = function () {
            var pos = this.positioner;
            pos.update(Article.margins, 0);

            var meshModel = this.accessoryModel.getMeshModel();
            this.mesh.position.set(meshModel.Ox + pos.x, meshModel.Oy + pos.y, meshModel.Oz + pos.z);
        }

        // Set accessory model
        Article.prototype.setModel = function (accessoryModel) {
            var me = this;
            if (me.accessoryModel.Id === accessoryModel.Id) return; // no change

            me.accessoryModel = accessoryModel;
            me.mesh = accessoryModel.createThreeMesh();
        }

        //// IBOMItem
        // Fill the BOM
        Article.prototype.fillBOM = function (bom) {
            var me = this;

            me.ecoTax = menuiserieDataFactory.getEcoTaxByWeight(me.accessoryModel.Weight).Value;

            // The drawer group itself
            bom.add({
                id: me.id,
                title: me.accessoryModel.Title,
                dims: [],
                dimsLabel: '(n.c)',
                surf: 0,
                price: (menuiserieDataFactory.getSalePrice(me.accessoryModel.Price)) + me.ecoTax,
                ecoTax: me.ecoTax,
                weight: me.accessoryModel.Weight
            });
        }

        //// IVisualizable
        Article.prototype.display = function() {
            menuiserieEnv.getThreeEnv().scene.add(this.mesh);
        }

        Article.prototype.hide = function () {
            menuiserieEnv.getThreeEnv().scene.remove(this.mesh);
        }
        //#endregion

        //#region DrawerGroup type 1

        // Material of inside parts of drawer
        var _insideDrawerMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });

        var DrawerGroup1 = function (parentZone) {
            this._initCItem_(this);

            this.kind = menuiserieConst.Kinds.DrawerGroup;
            this._parentZone = parentZone;
            this.drawerModel;
            //this.drawerCount = 0;
            //this.sideThickness = 1.9;
            this.facadeModel;
            this.facadeColour;
            this.handleModel;

            // for convenient access. contained in gzone.
            this.topPanel;
            this.bottomPanel;
            this.leftPanel;
            this.rightPanel;

            this.gzone = menuiserieZoneFactory.createZone("Drawer-group outer zone", parentZone.compound, parentZone); // The outer zone of drawer
            this.zone; // The inner zone of drawer

            /*this.xdim = 0;
            this.ydim = 0;
            this.zdim = 0;*/

            this.splitter; // the vertical splitter for drawer facade

            // IBOMItem
            this.isBOMCompound = true;
            this.ecoTax = 0;
        }

        // Inheritance
        DrawerGroup1.prototype = new CItem();

        // Write to node
        DrawerGroup1.prototype.writeTo = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var subNode;

            // base class write call
            CItem.prototype.writeTo.call(this, serializer, node);

            srz.writeDrawer('drw', me.drawerModel, n);
            srz.writePanel('fac', me.facadeModel, n);
            srz.writeColour('facClr', me.facadeColour, n);
            srz.writeAccessory('hdl', me.handleModel, n);
            //srz.write('ecotx', me.ecoTax, n);

            // NOT READEN DATA
            srz.write('w', me.getWidth(), n);
            srz.write('h', me.getHeight(), n);
            srz.write('d', me.getDepth(), n);
        }

        // Read from node
        DrawerGroup1.prototype.readFrom = function (serializer, node) {
            var srz = serializer;
            var n = node;
            var me = this;
            var o;

            // base class read call
            CItem.prototype.readFrom.call(this, serializer, node);

            me.drawerModel = srz.readDrawer('drw', n);
            me.facadeModel = srz.readPanel('fac', n);
            me.facadeColour = srz.readColour('facClr', n);
            me.handleModel = srz.readAccessory('hdl', n);
            //me.ecoTax = node['ecotx'] || 0;
        }

        // Get ezType
        DrawerGroup1.prototype.getEzType = function () { return 'DrawerGroup' }

        // Set the parent zone of drawer
        DrawerGroup1.prototype.setParentZone = function (parentZone) {
            if (this._parentZone === parentZone) return; // no change

            this._parentZone = parentZone;
            // the outer zone must be rebinded
            if (this.gzone) this.gzone.parentZone = parentZone;
        }

        // Update the drawer
        DrawerGroup1.prototype.update = function () {

            var me = this;
            var drawerCount = me.drawerModel.DrawerCount;
            var sideThickness = me.drawerModel.DefaultBoxThickness; // me.drawerModel.DefaultFacadeThickness;
            var i;
            var GZ = me.gzone; // the outer zone
            var hFacade = GZ.ydim / drawerCount;
            var C = GZ.compound;
            var closetModel = C.getClosetModel();

            if (!me.zone) { // first update
                me.topPanel = menuiseriePanelFactory.create(GZ); menuiseriePanelFactory.beOnSide(me.topPanel, 'top'); //"Bloc-tiroir dessus"
                me.bottomPanel = menuiseriePanelFactory.create(GZ); menuiseriePanelFactory.beOnSide(me.bottomPanel, 'bottom'); //"Bloc-tiroir dessous"
                me.leftPanel = menuiseriePanelFactory.create(GZ); menuiseriePanelFactory.beOnSide(me.leftPanel, 'left'); //"Bloc-tiroir coté gauche"
                me.leftPanel.setMargins({ top: sideThickness, bottom: sideThickness });
                me.rightPanel = menuiseriePanelFactory.create(GZ); menuiseriePanelFactory.beOnSide(me.rightPanel, 'right'); //"Bloc-tiroir coté droit"
                me.rightPanel.setMargins({ top: sideThickness, bottom: sideThickness });
                me.zone = menuiserieZoneFactory.createZone("Drawer-group inner zone", GZ.compound);
            }            

            // The drawer model rules
            var widthMax = me.drawerModel.MaxWidth;
            var heightMax = me.drawerModel.MaxHeight;
            var depthMax = me.drawerModel.MaxDepth;

            // Compute X dim and position according to drawer model rule.
            if (GZ.parentZone.xdim > widthMax) {
                GZ.xdim = widthMax;
                GZ.x = GZ.parentZone.x - ((GZ.parentZone.xdim - widthMax) / 2); // On left side of zone
            }
            else {
                GZ.xdim = GZ.parentZone.xdim;
                GZ.x = GZ.parentZone.x;
            }
            
            // Compute Y dim and position according to drawer model rule.
            if (GZ.parentZone.ydim > heightMax) {
                GZ.ydim = heightMax;
                GZ.y = GZ.parentZone.y - ((GZ.parentZone.ydim - heightMax) / 2); // On bottom side of zone
            }
            else {
                GZ.ydim = GZ.parentZone.ydim;
                GZ.y = GZ.parentZone.y;
            }
            
            // Compute Z dim and position according to drawer model rule.
            var frontMargin = C.getGreatestFrontMargin(); // The most restrictive between shelf and separator
            if (GZ.parentZone.zdim - frontMargin > depthMax) {
                GZ.zdim = depthMax;
                GZ.z = GZ.parentZone.z + ((GZ.parentZone.zdim - depthMax) / 2) - frontMargin; // On front side of zone
            }
            else {
                GZ.zdim = GZ.parentZone.zdim - frontMargin;
                GZ.z = GZ.parentZone.z + menuiseriePositionerFactory.getMarginZOffs({ front: frontMargin, back: 0 });
            }
            
            // Compute global zone
            GZ.update();

            // The side panels
            me.topPanel.thickness = sideThickness;
            me.bottomPanel.thickness = sideThickness;
            me.leftPanel.thickness = sideThickness;
            me.rightPanel.thickness = sideThickness;
            me.topPanel.update();
            me.bottomPanel.update();
            me.leftPanel.update();
            me.rightPanel.update();

            // The inner zone (in cascade, the splitter too if initialized)
            me.zone.xdim = GZ.xdim - (2 * sideThickness);
            me.zone.ydim = GZ.ydim - (2 * sideThickness);
            me.zone.zdim = GZ.zdim;
            me.zone.x = GZ.x;
            me.zone.y = GZ.y;
            me.zone.z = GZ.z;
            me.zone.update();
            
            // Facades
            if (!me.splitter) { // 1st compute
                me.splitter = menuiserieZoneFactory.createSplitter('vertical', drawerCount - 1, me.zone, 'Facade splitter');
                me.splitter.virtualSeparator = true;
                me.splitter.update();

                var P;
                var H;
                var subZones = me.splitter.subZones;
                for (i = 0 ; i < subZones.length ; i++) {
                    var facadeMargin = 0.25;
                    var facadeThick = menuiserieDataFactory.getThickValue(me.facadeModel);
                    // Create facade
                    P = menuiseriePanelFactory.create(subZones[i]); menuiseriePanelFactory.beOnSide(P, 'front', 0.1); // 0.1 for beautiful zone displaying
                    P.thickness = facadeThick; // me.facadeModel.Thickness;
                    //P.positioner.offs = 0.1; 
                    P.setMargins({ top: facadeMargin, bottom: facadeMargin, left: facadeMargin, right: facadeMargin });
                    if (me.facadeColour) P.colour = me.facadeColour;
                    P.update();

                    // handle
                    //H = new Article(menuiserieDataFactory.getDrawerHandleSample().clone());
                    H = new Article(me.handleModel);
                    //H.id = me._parentZone.compound.getNextItemId();
                    H.positioner = menuiseriePositionerFactory.createPanelPositioner('front', 0, subZones[i], H);
                    H.thickness = 0;
                    subZones[i].add(H);
                    H.update();

                    // Create inside of drawer (bottom)
                    P = menuiseriePanelFactory.create(subZones[i]); menuiseriePanelFactory.beOnSide(P, 'bottom', 4);
                    P._renderThreeMat = _insideDrawerMat; // Overload three mat (has no materials)
                    P.thickness = 0.5;
                    //P.positioner.offs = 4;
                    P.setMargins({ left: 4, right: 4, front: facadeThick, back: 4 });
                    P.update();

                    // Create inside of drawer (back)
                    P = menuiseriePanelFactory.create(subZones[i]); menuiseriePanelFactory.beOnSide(P, 'back', 4);
                    P._renderThreeMat = _insideDrawerMat; // Overload three mat (has no materials)
                    P.thickness = 0.5;
                    //P.positioner.offs = 4;
                    P.setMargins({ left: 4, right: 4, top: 4, bottom: 4.5 });
                    P.update();
                }
            }            
        }

        // Get dimensions
        DrawerGroup1.prototype.getWidth = function () { return this.gzone.xdim }
        DrawerGroup1.prototype.getHeight = function () { return this.gzone.ydim }
        DrawerGroup1.prototype.getDepth = function () { return this.gzone.zdim }

        // Get drawer model
        DrawerGroup1.prototype.getDrawerModel = function () { return this.drawerModel }

        // Get facade modem
        DrawerGroup1.prototype.getFacadeModel = function () { return this.facadeModel }

        // Get handle modem
        DrawerGroup1.prototype.getHandleModel = function () { return this.handleModel }
        DrawerGroup1.prototype.setHandleModel = function (handleModel) {
            var me = this;
            if (me.handleModel && me.handleModel.Id === handleModel.Id) return false; // no change

            me.handleModel = handleModel;

            if (me.splitter) {
                var i;
                var handle;
                var subZones = me.splitter.subZones;          
                for (i = 0 ; i < subZones.length ; i++) {
                    handle = subZones[i].subItems[1];  // Handle
                    handle.setModel(handleModel);
                    handle.update();
                }
            }            
        }

        // Change the colour of this drawer-group. Useful if user change the closet material in UI.
        DrawerGroup1.prototype.setColour = function (colour) {
            var me = this;
            me.topPanel.setColour(colour);
            me.bottomPanel.setColour(colour);
            me.leftPanel.setColour(colour);
            me.rightPanel.setColour(colour);

            if (me.splitter) {
                var i;
                var subZones = me.splitter.subZones;
                if (!me.facadeColour) { // If has not a custom facade color
                    for (i = 0 ; i < subZones.length ; i++)
                        subZones[i].subItems[0].setColour(colour); // Facades
                }
            }
        }

        // DrawerGroup1 has never its own colour
        DrawerGroup1.prototype.hasOwnColour = function () { return false; }

        // Get or Set the facade colour. Return true if color was changed.
        DrawerGroup1.prototype.setFacadeColour = function (colour) {
            if (this.facadeColour && this.facadeColour.Id === colour.Id) return false; // no change

            if (this.splitter) {
                var i;
                var subZones = this.splitter.subZones;
                for (i = 0 ; i < subZones.length ; i++)
                    subZones[i].subItems[0].setColour(colour); // Facades

                this.facadeColour = colour;
            }
            else
                return false; // no facade
        }
        DrawerGroup1.prototype.getFacadeColour = function () {
            return this.facadeColour;
        }

        // Cancel the custom facade colour. Facades will be colored like closet.
        DrawerGroup1.prototype.cancelFacadeColour = function () {
            if (!this.facadeColour) return; // no custom colour

            if (this.splitter) {
                var i;
                var subZones = this.splitter.subZones;
                for (i = 0 ; i < subZones.length ; i++)
                    subZones[i].subItems[0].setColour(this.topPanel.colour); // Facade with same colour of side panel

                this.facadeColour = undefined;
            }
        }

        // Get volume m3 of drawer-group
        DrawerGroup1.prototype.getVol = function () {
            var me = this;
            return (me.gzone.xdim / 100) * (me.gzone.ydim / 100) * (me.gzone.zdim / 100);
        }

        // Get weight kg of drawer-group
        DrawerGroup1.prototype.getWeight = function () {
            return this.getDrawerModel().Density * this.getVol();
        }

        //// IBOMItem
        // Fill the BOM
        DrawerGroup1.prototype.fillBOM = function (bom) {
            var me = this;
            me.price = me.drawerModel.Price;
            //var price = me.price;

            if (me.drawerModel.AddDrawerFacadePrice) {
                var i;
                var subZones = me.splitter.subZones;
                var facade;
                var surf;
                var colour;
                for (i = 0 ; i < subZones.length ; i++) {
                    facade = subZones[i].subItems[0];
                    colour = subZones[i].subItems[0].getColour();
                    surf = (facade.getLength() / 100) * (facade.getWidth() / 100);
                    //me.price += me.facadeModel.getPriceOfSurf(surf);
                    //me.price += colour.getPriceOfSurf(surf);
                    me.price = menuiserieDataFactory.getPriceOfSurf(me.facadeModel, colour, surf);
                }
            }

            me.price = menuiserieDataFactory.getSalePrice(me.price);

            // eco-tax
            var weight = me.getWeight();
            me.ecoTax = menuiserieDataFactory.getEcoTaxByWeight(weight).Value;

            // The drawer group itself
            bom.add({
                id: me.id,
                title: me.title,
                dims: [me.getWidth(), me.getHeight(), me.getDepth()],
                dimsLabel: '(l x h x p)',
                surf: 0,
                price: me.price + me.ecoTax,
                ecoTax: me.ecoTax,
                weight: weight
            });

            // The accessories
            if (this.splitter) {
                var i;
                var subZones = this.splitter.subZones;
                for (i = 0 ; i < subZones.length ; i++) {
                    subZones[i].subItems[1].fillBOM(bom); // Handle
                }
            }
        }

        //// IVisualizable
        DrawerGroup1.prototype.display = function () {
            this.topPanel.display();
            this.bottomPanel.display();
            this.leftPanel.display();
            this.rightPanel.display();

            if (this.splitter) {
                var i, j;
                var subZones = this.splitter.subZones;
                for (i = 0 ; i < subZones.length ; i++) {
                    for (j = 0 ; j < subZones[i].subItems.length ; j++)
                      subZones[i].subItems[j].display();
                }
            }
        }

        DrawerGroup1.prototype.hide = function () {
            this.topPanel.hide();
            this.bottomPanel.hide();
            this.leftPanel.hide();
            this.rightPanel.hide();

            if (this.splitter) {
                var i,j;
                var subZones = this.splitter.subZones;
                for (i = 0 ; i < subZones.length ; i++)
                    for (j = 0 ; j < subZones[i].subItems.length ; j++)
                        subZones[i].subItems[j].hide();
            }
        }

        DrawerGroup1.prototype.updateThreeMat = function () {
            this.topPanel.updateThreeMat();
            this.bottomPanel.updateThreeMat();
            this.leftPanel.updateThreeMat();
            this.rightPanel.updateThreeMat();

            if (this.splitter) {
                var i;
                var subZones = this.splitter.subZones;
                for (i = 0 ; i < subZones.length ; i++)
                    subZones[i].subItems[0].updateThreeMat(); // Facade
            }
        }

        //// IDimBounded
        DrawerGroup1.prototype.getWidthRule = function () { return { mini: this.drawerModel.MinWidth, maxi: this.drawerModel.MaxWidth }; }
        DrawerGroup1.prototype.getHeightRule = function () { return { mini: this.drawerModel.MinHeight, maxi: this.drawerModel.MaxHeight }; }
        DrawerGroup1.prototype.getDepthRule = function () { return { mini: this.drawerModel.MinDepth, maxi: this.drawerModel.MaxDepth }; }

        //#endregion

        return {

            // Create new compound of Type #1
            // w: bnd width of compound
            // h: bnd height of compound
            // d: bnd depth of compound
            // defaultColour: the default Db material of compound
            createType1: function (w, h, d, defaultColour, defaultPanelModel) {
                var C = new Compound1();
                C.width = w;
                C.height = h;
                C.depth = d;
                C.defaultColour = defaultColour;
                C.defaultPanelModel = defaultPanelModel;
                return C;
            },

            // Create drawer group in parent zone. The drawer must be added to parentZone manually (to avoid double add on deserialization).
            createDrawerGroup1: function (parentZone, drawerModel, facadeModel, handleModel) {
                var DG = new DrawerGroup1(parentZone);
                //DG.id = parentZone.compound.getNextItemId();
                if (drawerModel) { // Can be undefined during reading serialization
                    DG.drawerModel = drawerModel;
                    DG.title = drawerModel.Title;
                }
                //DG.price = drawerModel.Price;
                //parentZone.add(DG);
                parentZone.canSelectIfFilled = true; // to can select the zone
                DG.facadeModel = facadeModel;
                DG.handleModel = handleModel;
                return DG;
            }

        }
    }

    //registration
    thisModule.factory('menuiserieCompoundFactory', ["$log", "menuiserieEnv", "menuiserieConst", "menuiserieDataFactory", "menuiserieZoneFactory", "menuiseriePanelFactory", "menuiserieClosetComposer", "menuiseriePositionerFactory", compoundFactory]);

    //#endregion

    //#region Ground factory
    function groundFactory(
        menuiserieEnv,
        menuiserieDataFactory) {

        //#region Ground class
        var Ground = function () {
            this._closetHeight = 0;
            this._width = 0; // x
            this._depth = 0; // y
            this._gridStep = 50;
            this._renderThreeMat;
            this._texture;
            this._mesh;
            this._grid;
        }

        // Get or set the ground depth
        Ground.prototype.setDepth = function (d) { this._depth = d }
        Ground.prototype.getDepth = function () { return this._depth }

        // Get or set the ground width
        Ground.prototype.setWidth = function (w) { this._width = w }
        Ground.prototype.getWidth = function () { return this._width }

        // Get or set the ground colour model
        Ground.prototype.setTexture = function (t) {
            if (this._texture && this._texture.Id === t.Id) return; // no change

            this._texture = t;
            this._renderThreeMat = undefined; // to force recompute of THREE material }
        }
        Ground.prototype.getTexture = function () { return this._texture }

        // Get or set the closet height
        Ground.prototype.setClosetHeight = function (h) { this._closetHeight = h }
        Ground.prototype.getClosetHeight = function () { return this._closetHeight }

        // Get or set the grid step
        Ground.prototype.setGridStep = function (s) { this._gridStep = s }
        Ground.prototype.getGridStep = function () { return this._gridStep }

        // Update the ground
        Ground.prototype.update = function () {
            // work
            var g = new THREE.PlaneGeometry(this._width, this._depth);
            if (!this._renderThreeMat) {// The THREE material is not created
                this._renderThreeMat = new THREE.MeshLambertMaterial({
                    map: this._texture.createForPanel(this._width, this._depth)
                });
            }

            if (!this._mesh) {
                this._mesh = menuiserieEnv.createMesh(g, this._renderThreeMat, true);
                this._mesh.receiveShadow = true;
                this._mesh.name = "Ground";
            }
            else {
                this._mesh.geometry = g;
            }

            this._mesh.rotation.set(-Math.PI / 2, 0, 0, 'XYZ');
            this._mesh.position.set(0, -this._closetHeight / 2, 0);
            
            // rendering
            if (!this._grid) {
                this._grid = new THREE.GridHelper(this._width / 2, this._gridStep);
                this._grid.setColors(menuiserieEnv.getWorkGroundColor(), menuiserieEnv.getWorkGroundColor());
            }

            this._grid.position.set(0, -this._closetHeight / 2, 0);
        }

        // Update the 3D material
        /*Ground.prototype.updateThreeMat = function () {
            if (this._mesh)
                this._mesh.material = this.getCurrentGroundMat();
        }*/

        //// IVisualizable
        Ground.prototype.display = function () {
            var ENV = menuiserieEnv.getThreeEnv();

            this._mesh.visible = ENV.sceneMode !== 'work';
            this._grid.visible = ENV.sceneMode === 'work';
            menuiserieEnv.getThreeEnv().scene.add(this._mesh);
            menuiserieEnv.getThreeEnv().scene.add(this._grid);
        }

        Ground.prototype.hide = function () {
            menuiserieEnv.getThreeEnv().scene.remove(this._mesh);
            menuiserieEnv.getThreeEnv().scene.remove(this._grid);
        }

        //#endregion

        // Return the ground factory
        return {

            // Create a new ground
            // closetHeight : the current closet height
            // w: width of ground (X)
            // d: depth of ground (Z)
            // texture : texture of ground in design mode
            createGround: function (closetHeight, w, d, texture) {
                var G = new Ground();
                G.setClosetHeight(closetHeight);
                G.setWidth(w);
                G.setDepth(d);
                G.setTexture(texture);
                return G;
            }

        }
    }

    //registration
    thisModule.factory('menuiserieGroundFactory', [
        "menuiserieEnv",
        "menuiserieDataFactory",
        groundFactory
    ]);

    //#endregion

    //#region Zone Explorer
    function zoneExplorer(menuiserieConst) {

        //#region ExpItem class
        // Constructor : results argument is for internal use only (see _makeDefaultItem()).
        var ExpItem = function (zoneContext, results) {
            this.context = zoneContext;
            this.results = results;
        }

        // Make default item. Return by methods when no match found.
        ExpItem.prototype._makeDefaultItem = function() { return new ExpItem(undefined, []) }

        // Resolve 'module' selector.
        ExpItem.prototype._resolveModules = function (context, mode) {
            if (!context) return; // stop here

            var me = this;

            // 1st zone case
            if (!context.parentZone) {
                me.results.push(new ExpItem(context))
                return;
            }

            // parent splitter
            var PSp = context.parentZone.splitter;

            if (mode === "ancestor") {
                if (PSp.getOrientation() === "horizontal")
                    me.results.push(new ExpItem(context));
                else
                    me._resolveModules(context.parentZone, mode)
            }
            else
                throw new Error("[" + applicationName + "] Unsupported mode '" + me.mode + "' for module selector.");
        }

        // Resolve 'section' selector.
        ExpItem.prototype._resolveSections = function (context, mode) {
            if (!context) return; // stop here

            var me = this;

            if (!context.parentZone) { // 1st zone case
                if (!context.isSplitted()) // If is not splitted collect it
                    me.results.push(new ExpItem(context))
                return;
            }

            if (mode === "descendant") {
                if (!context.isSplitted() && !context.isOff)
                    me.results.push(new ExpItem(context));
                else if (context.isSplitted()) { // To recurse in isOff zone
                    var sp, i, n;
                    sp = context.splitter;
                    n = sp.getSubZoneCount();
                    for (i = 0 ; i < n ; i++)
                        me._resolveSections(sp.getSubZone(i), mode);
                }
            }
            else if (mode === "ancestor") {
                var PSp = context.parentZone.splitter;

                if (PSp.getOrientation() === "horizontal" || PSp.getOrientation() === "vertical")
                    me.results.push(new ExpItem(context));
                else
                    me._resolveSections(context.parentZone, mode);
            }
            else if (mode === "next") {
                var PSp = context.parentZone.splitter;
                    
                if (PSp && PSp.getOrientation() === 'vertical') {
                    var zonIdx = PSp.getSubZoneIndex(context);
                    if (zonIdx < PSp.getSubZoneCount() - 1 && !PSp.getSubZone(zonIdx + 1).isOff)
                        me._resolveSections(PSp.getSubZone(zonIdx + 1), "descendant"); // recurse down to find section
                }
                else
                    me._resolveSections(context.parentZone, mode);
            }
            else if (mode === "prev") {
                var PSp = context.parentZone.splitter;

                if (PSp && PSp.getOrientation() === 'vertical') {
                    var zonIdx = PSp.getSubZoneIndex(context);
                    if (zonIdx > 0 && !PSp.getSubZone(zonIdx - 1).isOff)
                        me._resolveSections(PSp.getSubZone(zonIdx - 1), "descendant"); // recurse down to find section
                }
                else
                    me._resolveSections(context.parentZone, mode);
            }
            else
                throw new Error("[" + applicationName + "] Unsupported mode '" + me.mode + "' for section selector.");
        }

        // Resolve 'backpanel' selector.
        ExpItem.prototype._resolveBackPanels = function (context, mode) {
            if (!context) return; // stop here

            var me = this;           

            if (context.splitter && context.splitter.getOrientation() === 'inDepth') {
                var BPZ = context.splitter.getSubZone(0);
                if (BPZ.getSubCount() === 1 && BPZ.getSub(0).kind === menuiserieConst.Kinds.Back) {
                    me.results.push(new ExpItem(context));
                    return;
                }
            }

            if (mode === "ancestor") {
                me._resolveBackPanels(context.parentZone, mode);
            }
            else
                throw new Error("[" + applicationName + "] Unsupported mode '" + me.mode + "' for backpanel selector.");
        }

        // Find zones according selector and mode from current zone context.
        // selector: (String) The zone selector can be 'module', 'section', 'backpanel'
        // mode: (String) The exploration mode can be 'descendant' or 'ancestor'
        // return this : you can chain call to method like first(), last(), etc ...
        ExpItem.prototype.find = function (selector, mode) {
            var me = this;
            if (!me.context) throw new Error("[" + applicationName + "] Cannot resolve zone exploration without context.");
            if (!selector) throw new Error("[" + applicationName + "] Cannot resolve zone exploration without selector.");

            me.results = [];
            if (selector === "module") {
                me._resolveModules(me.context, mode);
            }
            else if (selector === "section") {
                me._resolveSections(me.context, mode);
            }
            else if (selector === "backpanel") {
                me._resolveBackPanels(me.context, mode);
            }
            else
                throw new Error("[" + applicationName + "] Unknown selector '" + selector + "'. Cannot resolve zone exploration.");

            return me;
        }

        // Get first result. Return ExpItem object.
        ExpItem.prototype.first = function () {
            var me = this;
            return me.results.length > 0 ? me.results[0] : me._makeDefaultItem();
        }

        // Get last result. Return ExpItem object.
        ExpItem.prototype.last = function () {
            var me = this;
            return me.results.length > 0 ? me.results[me.results.length - 1] : me._makeDefaultItem();
        }

        // Get all results. Return array of ExpItem object.
        ExpItem.prototype.all = function () {
            var me = this;
            return me.results;
        }

        // Get zone context. Return Zone object. Can be undefined.
        ExpItem.prototype.zone = function () { return this.context; }

        //#endregion

        return {

            // Initialize exploration; Ex, to get module from zone : menuiserieZoneExplorer.$(fromZone).find('module', 'ancestor').first().zone();
            $: function (zoneContext) {
                return new ExpItem(zoneContext);
            }

        }
    }

    //registration
    thisModule.factory('menuiserieZoneExplorer', [
        "menuiserieConst",
        zoneExplorer
    ]);
    //#endregion

    //#region Closet Browser
    function closetBrowser(menuiserieConst, menuiserieZoneExplorer) {

        return {

            // Return true is zone is first zone of closet, i.e the zone of splitter of compound inner zone.
            isFirstZone: function(zone) {
                if (!zone) return false;

                return !zone.parentZone || // For FramHorPrior model class
                    zone.parentZone.splitter.getSubZoneCount() === 1;  // For FullVerPrior model class
            },

            // Return first ancestor zone that is width zone (module)
            getWZone: function (fromZone) {
                return menuiserieZoneExplorer.$(fromZone).find("module", "ancestor").first().zone();
            },

            // Return first ancestor zone that is height zone (section)
            getHZone: function(fromZone) {
                return menuiserieZoneExplorer.$(fromZone).find("section", "ancestor").first().zone();
            },

            // Return true if zone is root of back-panel structure
            isRootOfBackPanel: function(zone) {
                return this.getRootOfBackPanel(zone) === zone;
            },

            // Return zone of back-panel structure from zone, in searching within ancestor.
            // Return Zone or undefined.
            getRootOfBackPanel: function (fromZone) {
                return menuiserieZoneExplorer.$(fromZone).find("backpanel", "ancestor").first().zone();
            },

            // Get back-panel adjacent zone
            getAdjBackPanelZone: function (bpRootZone) {
                return bpRootZone.splitter.getSubZone(1);
            },

            // Get back-panel from back-panel root zone
            getBackPanel: function (bpRootZone) {
                return bpRootZone.splitter.getSubZone(0).getSub(0);
            },

            // Get 1st ancestor zone above fromZone. Return undefined if not found.
            getZoneAbove: function (fromZone) {
                /*if (!fromZone || !fromZone.parentZone) return undefined;

                var PZ = fromZone.parentZone;
                if (PZ.isSplitted() && PZ.splitter.getOrientation() === 'vertical') {
                    var zonIdx = PZ.splitter.getSubZoneIndex(fromZone);
                    if (zonIdx < PZ.splitter.getSubZoneCount() - 1)
                        return PZ.splitter.getSubZone(zonIdx + 1);
                    else
                        return undefined
                }
                else
                    return this.getZoneAbove(fromZone.parentZone);*/

                return menuiserieZoneExplorer.$(fromZone).find("section", "next").first().zone();
            },

            // Get 1st ancestor zone below fromZone. Return undefined if not found.
            getZoneBelow: function (fromZone) {
                /*if (!fromZone || !fromZone.parentZone) return undefined;

                var PZ = fromZone.parentZone;
                if (PZ.isSplitted() && PZ.splitter.getOrientation() === 'vertical') {
                    var zonIdx = PZ.splitter.getSubZoneIndex(fromZone);
                    if (zonIdx > 0)
                        return PZ.splitter.getSubZone(zonIdx - 1);
                    else
                        return undefined
                }
                else
                    return this.getZoneAbove(fromZone.parentZone);*/

                return menuiserieZoneExplorer.$(fromZone).find("section", "prev").first().zone();
            },

            // Get 1st descendent zone getting started fromZone that is not splitted and not off. Return undefined if not found.
            get1stLeaf: function (fromZone) {
                /*if (!fromZone) return undefined;

                if (!fromZone.isSplitted()) return fromZone;

                var sp,  i, n, sz, leaf;
                sp = fromZone.splitter;
                n = sp.getSubZoneCount();
                for (i = 0 ; i < n ; i++) {
                    sz = sp.getSubZone(i);
                    if (!sz.isOff) {
                        leaf = this.get1stLeaf(sz);
                        if (leaf) return leaf;
                    }
                }

                return undefined;*/
                return menuiserieZoneExplorer.$(fromZone).find("section", "descendant").first().zone();
            }

        }
    }

    //registration
    thisModule.factory('menuiserieClosetBrowser', [
        "menuiserieConst",
        "menuiserieZoneExplorer",
        closetBrowser
    ]);
    //#endregion

    //#region Closet Factory
    function closetFactory(
        menuiserieEnv,
        menuiserieConst,
        menuiserieDataFactory, 
        menuiserieCompoundFactory,
        menuiserieClosetComposer,
        menuiserieClosetBrowser,
        menuiseriePanelFactory,
        menuiserieZoneFactory,
        menuiserieGroundFactory,
        menuiserieSerializer) {

        // An instance of serializer to make copy.
        var _copySerializer = menuiserieSerializer.create();

        // Get first non-off sub-zone of the specified splitter.
        function _get1stNonOffZone(splitter) {
            for (var i = 0 ; i < splitter.getSubZoneCount() ; i++) {
                var sz = splitter.getSubZone(i);
                if (!sz.isOff) {
                    if (!sz.isSplitted())
                        return sz;
                    else
                        return _get1stNonOffZone(sz.splitter);
                }
            }
            throw new Error("[" + applicationName + "] Splitter contains virtual zone only.");
        }

        //#region Explorer class
        // Constructor
            var Explorer = function () {
            }

        // Do an action on each node from starting node o.
        // action: (function) The action as function(node, params) {}.
        //   params : { stopSubExploration: false }. If you change the param stopSubExploration to true, explorer do not recurse on sub-node of current node.
            Explorer.prototype.doActionOnTree = function (o, action) {
                var i, n;

                var params = { stopSubExploration: false };
                action(o, params); // action on node itself

                if (params.stopSubExploration) return; // no sub-nodes exploration

                if (o.getSub) { // IContainer : recurse on subs
                    n = o.getSubCount();
                    for (i = 0 ; i < n ; i++) {
                        if (o.getSub(i))
                            this.doActionOnTree(o.getSub(i), action);
                    }
                }

                if (o.getSubZone) { // IZoneContainer : recurse on sub-zones
                    n = o.getSubZoneCount();
                    for (i = 0 ; i < n ; i++)
                        this.doActionOnTree(o.getSubZone(i), action);
                }
            }

        // Log the zone tree. For debug purpose.
            Explorer.prototype.logZoneTree = function (zone, indent) {
                var i;

                var _ind = indent || "";
                $log.debug(_ind + "+ Zone " + zone.title);

                if (zone.splitter) {
                    this.logSplitterTree(zone.splitter, _ind + "  ");
                }
            }

        // Log the splitter tree. For debug purpose.
            Explorer.prototype.logSplitterTree = function (splitter, indent) {
                var i;

                var _ind = indent || "";
                $log.debug(_ind + "+ Splitter " + splitter.title);

                /*if (splitter.separators) {
                    for (i = 0 ; i < splitter.separators.length ; i++)
                        action(splitter.separators[i]);
                }*/

                if (splitter.subZones) {
                    for (i = 0 ; i < splitter.subZones.length ; i++) {
                        this.logZoneTree(splitter.subZones[i], _ind + "  ");
                    }
                }
            }

        //#endregion

        //#region Merge zone function
        // Merge dimensions of two zone according their auto-size value. z1 was modified with result
        // zi1 : the adjacent zone info, i.e the zone that keeped in splitter
        // z12 : the removed zone info, i.e the zone that removed from splitter
        var _mergeDimOfZones = function (zi1, zi2, separatorThickness, autoSizeCount) {

            if (!zi1.auto && !zi2.auto) // both are fixed
                zi1.auto = false; // adjacent remain fixed
            else { // both have not same auto status, or are all auto
                if (autoSizeCount < 2)
                    zi1.auto = true; // Must be auto to insure one auto zone at least.
                else
                    zi1.auto = zi1.auto && zi2.auto; // Auto if 2 zones auto
            }

            if (!zi1.auto) // if is fixed
                zi1.dim += zi2.dim + separatorThickness;
        }
        //#endregion

        //#region Base zone splitting
        // args: {
        // count: (int) count of separtors.
        // splittedZone: (Zone) the zone to split.
        // orientation: (string) If 'vertical' create shelf, if 'horizontal' create separator.
        // resultInfo: The split result infos. optional.
        // withBottom: (bool) The withBottom parameter of vertical splitter. optional.
        // withTop: (bool) The withTop parameter of vertical splitter. optional.
        // }
        // Return a sizeable zone
        var _baseSplitZone = function (args) {

            if (args.orientation === 'inDepth')
                throw new Error("[" + applicationName + "] 'InDepth' orientation for high level splitting are not authorized.");

            var count = args.count || 1;
            var splittedZone = args.splittedZone;
            var orientation = args.orientation;
            var resultInfo = args.resultInfo;
            var withBottom = args.withBottom || false; // if horizontally mode only
            var withTop = args.withTop || false; // if horizontally mode only

            var PZ = splittedZone.parentZone; // The parent zone
            var C = splittedZone.compound;
            var closetModel = C.getClosetModel();
            var i, j;
            var title;
            var oldLength;

            // Save sub-structure
            var buffZone;
            if (splittedZone.isSplitted() || splittedZone.hasContent()) {
                buffZone = menuiserieZoneFactory.createBufferZone();
                buffZone.attachContentOf(splittedZone);
                splittedZone.clear();
            }

            // If no splitter or different orientation : we must create a splitter.
            var PSp;
            var zoneIndex;
            if (!PZ || !PZ.splitter || PZ.splitter.getOrientation() !== orientation) {

                //if (PZ && PZ.splitter && PZ.splitter.getOrientation() === 'inDepth')
                //    throw new Error("[" + applicationName + "] Unexpected 'inDepth' splitter orientation. You cannot split a zone owned by a depth splitter.");

                PSp = menuiserieZoneFactory.createSplitter(orientation, 0, splittedZone, orientation === 'horizontal' ? 'Module' : 'Section');
                PSp.withBottom = withBottom;
                PSp.withTop = withTop;
                PSp.update(); // build the splitter
                PZ = splittedZone; // Origial splitted zone becomes the parent zone

                // The splitted zone will be sub-zone of splitter
                splittedZone = PSp.getSubZone(0);
                zoneIndex = 0;
            }
            else { // Has already a well oriented splitter
                PSp = PZ.splitter;
                zoneIndex = PSp.getSubZoneIndex(splittedZone);
                if (zoneIndex === -1)
                    throw new Error("[" + applicationName + "] Cannot find sub-zone in splitter. Dividing failed.");
            }
                        
            var isHorizontal = PSp.isHorizontal();

            // Prepare the sub-zones infos of divided zone
            var szDivInfos = [];
            for (i = 0 ; i < count ; i++) {
                szDivInfos.push(PSp.getSubZoneInfo());
            }

            // Split the sub-zone
            var divRes = PSp.split({
                D: isHorizontal ? splittedZone.xdim : splittedZone.ydim,
                zonePos: 0,
                sepThick: C.getDefaultThickness(),
                szInfos: szDivInfos,
                szCount: count
            })

            // Set the sizing mode according to splitted zone mode and remaining auto-zone in PSp.
            var autoSizeCount = PSp.getAutoSizeCount();
            var splittedZoneIsAuto = isHorizontal ? splittedZone.hasXDimAuto : splittedZone.hasYDimAuto;
            for (i = 0 ; i < count - 1 ; i++)
                szDivInfos[i].auto = false;
            szDivInfos[count - 1].auto = splittedZoneIsAuto && autoSizeCount < 2; // The last of splitted is auto if the splitted zone is auto and it's the last auto size zone

            // Create new szInfos by inserting division
            var szInfos = PSp.getArrayOfSubZoneInfos();
            var newSzInfos = [];
            for (i = 0 ; i < szInfos.length ; i++) {
                if (i != zoneIndex) {
                    newSzInfos.push(szInfos[i]);
                }
                else {
                    for (var j = 0 ; j < szDivInfos.length ; j++)
                        newSzInfos.push(szDivInfos[j]);
                }
            }

            // Update the subzones
            var sz;
            var oldZones = PSp.subZones;
            oldLength = PSp.subZones.length;
            PSp.subZones = [];
            j = 0;
            for (i = 0 ; i < oldLength ; i++) {
                if (i < zoneIndex) {
                    PSp.subZones.push(oldZones[i]);
                }
                else if (i === zoneIndex) { // added sub-zones
                    PSp.subZones.push(oldZones[i]);

                    // Restore content structure in original splitted zone
                    if (buffZone) oldZones[i].attachContentOf(buffZone);

                    for (j = 1 ; j < count ; j++) {
                        sz = menuiserieZoneFactory.createZone(PSp.makeSubZoneTitle(i + j + 1), C, PZ);            
                        if (buffZone) { // Is there saved sub-structure ?                 
                            sz.cloneAndAttachContentOf(_copySerializer, buffZone)
                        }
                        PSp.subZones.push(sz);
                    }
                }
                else {
                    PSp.subZones.push(oldZones[i]);
                    oldZones[i].title = PSp.makeSubZoneTitle(i + j);
                }
            }

            // Update the splitter separators
            PSp.separatorCount += count - 1;
            if (!PSp.virtualSeparator) {
                var p;
                oldLength = PSp.separators.length;
                for (i = 0 ; i < PSp.separatorCount ; i++) {
                    //title = PSp.makeSeparatorTitle(i + 1);

                    if (i < oldLength) {
                        p = PSp.separators[i];
                    }
                    else {
                        p = menuiseriePanelFactory.create(PZ);

                        if (orientation === 'horizontal')
                            menuiseriePanelFactory.beSeparator(p);

                        PSp.separators.push(p);
                    }

                    if (orientation === 'vertical')
                        PSp.updateHorizontalPanelKind(p, i === 0, i === PSp.separatorCount - 1);
                }
            }

            PSp.update(newSzInfos);

            if (resultInfo) { // Returns result information if required
                resultInfo.splitter = PSp;
                resultInfo.firstZoneIndex = zoneIndex;
            }

            if (PSp.subZones[zoneIndex].isSplitted())
                return _get1stNonOffZone(PSp.subZones[zoneIndex].splitter);
            else
                return PSp.subZones[zoneIndex];
        }
        //#endregion

        //#region back-panel
        // Create a back-panel in zone with the specified panel-model and panel-colour 
        // Return panel.
        function _createBackPanel(zone, panelModel, panelClr) {

            if (zone.isSplitted() && zone.splitter.getOrientation() === 'horizontal')
                throw new Error("[" + applicationName + "] The zone is splitted horizontally. Cannot add back-panel structure.");

            var buffZone;
            if (zone.isSplitted() || zone.hasContent()) { // Save the content
                buffZone = new menuiserieZoneFactory.createBufferZone();
                buffZone.attachContentOf(zone);
                zone.clear();
            }

            var C = zone.getCompound();
            var closetModel = C.getClosetModel();

            // Create back-panel splitter
            var BPSp = menuiserieZoneFactory.createSplitter('inDepth', 1, zone, 'Avec Fond');
            BPSp.virtualSeparator = true;
            BPSp.update();

            // Get 1st zone (on the back), and set the size.
            var panelZone = BPSp.getSubZone(0);
            panelZone.isOff = true; // not usable zone
            panelZone.hasZDimAuto = false;
            panelZone.setDepth(closetModel.BackPanelOffs + menuiserieDataFactory.getThickValue(panelModel));
                
            // Create and add back-panel
            var P = menuiseriePanelFactory.create(panelZone);
            P.setMaterialModel(panelModel);
            //P.thickness = panelModel.Thickness;
            if (panelClr) P.setColour(panelClr);
            menuiseriePanelFactory.beBack(P);
            menuiseriePanelFactory.beOnSide(P, 'front', 0); // Add in zone

            if (buffZone)  // Restore the content
                BPSp.getSubZone(1).attachContentOf(buffZone);

            BPSp.update();
            return P;
        }

        // Remove the back-panel from back-panel root zone.
        function _removeBackPanel(bpRootZone) {
            var contentZone = menuiserieClosetBrowser.getAdjBackPanelZone(bpRootZone);

            var buffZone;
            if (contentZone.isSplitted() || contentZone.hasContent()) { // Save the content
                buffZone = new menuiserieZoneFactory.createBufferZone();
                buffZone.attachContentOf(contentZone);
            }

            bpRootZone.clear();
            if (buffZone) // Restore the content
                bpRootZone.attachContentOf(buffZone);
        }
        //#endregion

        //#region Base separator removing        
        // Remove adjacent separator of zone
        // zone : (Zone) the zone to remove
        // separatorSide: 'left', 'bottom', 'right' or top' side.
        // Return a sizable zone.
        function _baseRemoveSeparator(zone, separatorSide) {

            var splitter = zone.parentZone.splitter;

            if (!splitter || splitter.separatorCount == 0)
                throw new Error("[" + applicationName + "] Cannot remove separator because zone is not splitted.");

            var Z = splitter.zone;
            var i;
            var isHorizontal = splitter.isHorizontal();
            
            // Get the index of removed zone
            var szRemovedIndex = splitter.getSubZoneIndex(zone);
            if (szRemovedIndex === -1)
                throw new Error("[" + applicationName + "] Cannot find sub-zone in splitter. Remove separator failed.");

            // Get the index of adjacent zone
            var szAdjIndex = splitter.getAdjSubZoneIndex(szRemovedIndex, separatorSide);
            if (szAdjIndex == -1)
                throw new Error("[" + applicationName + "] Cannot delete extreme separator in first or last zone.");

            // The adjacent zone
            var adjZone = splitter.subZones[szAdjIndex];

            // Get the actual szInfos
            var szInfos = splitter.getArrayOfSubZoneInfos();

            // Set the auto-size and dim value of adjacent zone
            _mergeDimOfZones(szInfos[szAdjIndex], szInfos[szRemovedIndex], Z.compound.getDefaultThickness(), splitter.getAutoSizeCount());

            // Modify the zones to assume deletion
            var newSzInfos = [];
            var newSubZones = [];
            var removedZone;
            for (i = 0 ; i < szInfos.length ; i++) {
                if (i != szRemovedIndex) {
                    newSzInfos.push(szInfos[i]); // Keep the zone
                    newSubZones.push(splitter.subZones[i]);
                }
                else { // The removed zone
                    removedZone = splitter.subZones[i];
                }
            }

            // Modify separators to assume deletion
            splitter.separatorCount = splitter.separators.length - 1;
            if (!splitter.virtualSeparator) {
                if (splitter.withTop && splitter.orientation === 'vertical' && splitter.separatorCount - 1 > 0) { // FIX BUG111
                    var p = splitter.separators[splitter.separatorCount - 1];
                    p.title = "Dessus";
                }
                splitter.separators.length = splitter.separatorCount;
            }

            // Determine the selected zone
            var selectedZone;
            if (separatorSide === 'right' || separatorSide === 'top') {
                if (szRemovedIndex < newSubZones.length) // The removed zone is not the last
                    selectedZone = newSubZones[szRemovedIndex];
                else // The removed zone is the last
                    selectedZone = newSubZones[newSubZones.length - 1];
            }
            else {
                var selectedIndex = szRemovedIndex - 1;
                if (selectedIndex > 0)
                    selectedZone = newSubZones[selectedIndex];
                else
                    selectedZone = newSubZones[0];
            }

            // Transfert remove zone content if any
            if (!removedZone.isEmpty()) {
                // Tranfsert zone content to adjacent zone
                adjZone.clear();
                adjZone.attachContentOf(removedZone);
                if (!adjZone.isSplitted())
                    selectedZone = adjZone;
                else // Fin first non-virtual zone
                    selectedZone = _get1stNonOffZone(adjZone.splitter);
            }
            else if (/*selectedZone.hasContent() ||*/ selectedZone.isSplitted()) { // To avoid selection of whole closet zone
                selectedZone = _get1stNonOffZone(selectedZone.splitter);
            }

            removedZone.dispose();

            // Update the splitter
            splitter.subZones = newSubZones;
            splitter.update(newSzInfos);

            // Clean empty splitter (return to module state)
            if (splitter.getSubZoneCount() === 1 && !splitter.getSubZone(0).isSplitted()) {
                var PZ = splitter.zone;
                PZ.splitter = undefined;
                selectedZone = PZ;
            }

            return selectedZone;
        }
        //#endregion

        //#region make module for full vertical priority
        // Return a sizable zone
        function _makeFullVerPriorModule(moduleZone, closetModel) {

            var model = closetModel || moduleZone.getCompound().getClosetModel();

            var bottomOffs = model.Options && model.Options.BottomOffs ? parseFloat(model.Options.BottomOffs) : 0;
            var topOffs = model.Options && model.Options.TopOffs ? parseFloat(model.Options.TopOffs) : 0;

            var Z = _baseSplitZone({ count: 3, splittedZone: moduleZone, orientation: 'vertical', withBottom: true, withTop: true });
            var PSp = Z.parentZone.splitter;

            // Set bottom zone parameters
            PSp.subZones[0].hasYDimAuto = false;
            PSp.subZones[0].setHeight(bottomOffs);
            PSp.subZones[0].isOff = true;

            // Set middle zone parameter
            PSp.subZones[1].hasYDimAuto = true;

            // Set top zone parameters
            PSp.subZones[2].hasYDimAuto = false;
            PSp.subZones[2].setHeight(topOffs);
            PSp.subZones[2].isOff = true;

            return PSp.subZones[1];
        }
        //#endregion

        // The explorer singleton
        var _explorer;

        // Return the closetFactory
        return {

            // Get the explorer singleton
            getExplorer: function () {
                if (!_explorer)
                    _explorer = new Explorer();

                return _explorer;
            },

            // Set default colour of compound, and update compound.
            // Return true if colour changed
            setDefaultColour: function (compound, colour) {
                if (compound.defaultColour.Id === colour.Id) return false;

                compound.defaultColour = colour;

                var _setColour = function (item) {
                    if (item && item.setColour && item.hasOwnColour && !item.hasOwnColour())
                        item.setColour(colour);
                }

                var exp = this.getExplorer();
                exp.doActionOnTree(compound.gzone, _setColour);
                exp.doActionOnTree(compound.zone, _setColour);

                compound.update();
                return true;
            },

            // Set default panel model of compound, and update compound.
            // Return true if model changed
            setDefaultPanelModel: function (compound, model) {
                if (compound.defaultPanelModel.Id === model.Id) return false;

                compound.defaultPanelModel = model;

                var _setModel = function (item) {
                    if (item && item.setMaterialModel && item.kind !== menuiserieConst.Kinds.Back)
                        item.setMaterialModel(model);
                }

                var exp = this.getExplorer();
                exp.doActionOnTree(compound.gzone, _setModel);
                exp.doActionOnTree(compound.zone, _setModel);

                compound.update();
                return true;
            },

            // Get BOM of project
            getBOM: function (project) {
                var C = project.compounds[0];
                var bom = project.getBom();
                bom.clear();

                var _addBOMItem = function (item, params) {
                    if (item && item.fillBOM) {
                        item.fillBOM(bom);
                        params.stopSubExploration = item.isBOMCompound; // the bom item is a compound. Its composition is not added in BOM.
                    }
                }

                var exp = this.getExplorer();
                exp.doActionOnTree(C.gzone, _addBOMItem);
                exp.doActionOnTree(C.zone, _addBOMItem);

                // Add-ons if any
                bom.addCart(project.cart);

                // Additional price of project if any
                bom.addPrice(C.getAddPrice());

                return bom;
            },

            //#region Zone dimension management

            // Set the auto-size property of the specified zone. If this zone is splitted, the subzones was setted with the same value (one level only).
            // The setting repect the parent zone splitter orientation.
            // Return true if property value changed.
            setZoneAutoSize: function (zone, autoSize, maxDim) {
                var i;
                var subZones;

                if (zone.parentZone.splitter.getOrientation() === 'inDepth')
                    throw new Error("[" + applicationName + "] Cannot set dimension mode of zone splitted with in-depth orientation.");

                var isHorizontal = zone.parentZone.splitter.isHorizontal();
                var oldAutoSize = isHorizontal ? zone.hasXDimAuto : zone.hasYDimAuto;

                if (oldAutoSize === autoSize) return false; // no change

                // Change the auto-size status of the zone
                if (isHorizontal) {
                    zone.setXDimAuto(autoSize); //zone.hasXDimAuto = autoSize;
                }
                else {
                    zone.setYDimAuto(autoSize); //zone.hasYDimAuto = autoSize;
                }

                // The count of auto-size zone
                var autoSizeCount = zone.parentZone.splitter.getAutoSizeCount();

                // Are one auto size zone at least ?
                subZones = zone.parentZone.splitter.subZones;
                if (autoSizeCount < 1 && subZones.length > 1) {
                    subZones = zone.parentZone.splitter.subZones;

                    var zoneIndex = zone.parentZone.splitter.getSubZoneIndex(zone);

                    var adjZoneIndex;
                    if (zoneIndex === subZones.length - 1) // last zone
                        adjZoneIndex = zoneIndex - 1;
                    else
                        adjZoneIndex = zoneIndex + 1;

                    // if adjacent zone is off (FullVerPriorCase)
                    if (subZones[adjZoneIndex].isOff)
                        adjZoneIndex = zoneIndex - 1;

                    // The adjacent zone becomes auto
                    if (isHorizontal)
                        subZones[adjZoneIndex].setXDimAuto(true); 
                    else
                        subZones[adjZoneIndex].setYDimAuto(true);
                }

                zone.parentZone.splitter.update();
                return true;
            },
            
            // Set a new width to the specified zone.
            setZoneWidth: function (zone, width) {
                if (zone.xdim === width) return false;
                zone.xdim = width;
                zone.parentZone.splitter.update();
                return true;
            },

            // Set a new height to the specified zone.
            setZoneHeight: function (zone, height) {
                if (zone.ydim === height) return false;
                zone.ydim = height;
                zone.parentZone.splitter.update();
                return true;
            },

            //#endregion

            //#region Zone splitting and merging

            // Helper method to split zone with the specified split count.
            // count: (Number) The split count, i.e the number of sub-zones required in splittedZone.
            // splittableZone: (Zone) The splittable zone.
            // orientation: (string) 'vertical' or 'horizontal'
            // resultInfo: OUT (Object) If defined, { splitter: (Splitter) the splitter that make the splitting, firstZoneIndex: (Number) the index in splitter of 1st zone result of splitting }.
            // RETURN : the 1st zone that result from splitting. It is a fillable zone.
            splitZone: function (count, splittableZone, orientation, resultInfo) {
                __checkParameterDefined(count, 'count');
                __checkParameterDefined(splittableZone, 'splittableZone');

                if (count < 2)
                    throw new Error("[" + applicationName + "] The split count must be greater than 1. The zone cannot be splitted.");

                var resultZone;
                resultZone = _baseSplitZone({ count: count, splittedZone: splittableZone, orientation: orientation, resultInfo: resultInfo });

                /*if (splittableZone.compound.getClosetModel().ModelClass !== 'FullVerPrior' || orientation === 'vertical')
                    resultZone = _baseSplitZone({ count: count, splittedZone: splittableZone, orientation: orientation, resultInfo: resultInfo });
                else { // The full vertical prior mode

                    resultZone = _baseSplitZone({ count: count, splittedZone: splittableZone, orientation: orientation, resultInfo: resultInfo });
                }*/

                return resultZone;
            },

            // Remove adjacent separator of zone
            // zone : (Zone) the zone to remove
            // separatorSide: 'left', 'bottom', 'right' or top' side.
            // Return the adjacent zone according to separatorSide
            removeSeparator: function (zone, separatorSide) {

                __checkParameterDefined(zone, 'zone');
                __checkParameterDefined(separatorSide, 'separatorSide');

                var resultZone;
                resultZone = _baseRemoveSeparator(zone, separatorSide);

                /*if (zone.compound.getClosetModel().ModelClass !== 'FullVerPrior' || separatorSide === 'top' || separatorSide === 'bottom')
                    resultZone = _baseRemoveSeparator(zone, separatorSide);
                else {
                    resultZone = _baseRemoveSeparator(zone, separatorSide);
                }*/

                // Return the fillable
                return resultZone;
                //return this.getFillableZone(resultZone);
            },

            //#endregion

            //#region back-panel processing
            
            // Create a back-panel in back-panel root zone with the specified panel-model and panel-colour 
            // Return the new back-panel zone.
            createBackPanel: function (bpRootZone, panelModel, panelClr) {

                var P = _createBackPanel(bpRootZone, panelModel, panelClr);
                bpRootZone.update();

                //return bpRootZone.splitter.getSubZone(1);
                return menuiserieClosetBrowser.get1stLeaf(bpRootZone);
            },

            // Remove the back-panel from parent of back-panel root zone.
            // Return bpRootZone.
            removeBackPanel: function (bpRootZone) {
                _removeBackPanel(bpRootZone);
                bpRootZone.update();

                return bpRootZone;
            },

            //#endregion

            //#region Closet Creation methods

            // Closet model 'FramHorPrior' class
            createFramHorPrior: function (closetModel, project, w, h, d, closetColour, panelModel) {
                var C = menuiserieCompoundFactory.createType1(w, h, d, closetColour, panelModel);
                C.setComposer(menuiserieClosetComposer.getHorPrior());

                project.compounds.push(C);
                C.id = 1;
                C.setClosetModel(closetModel);

                project.getGround().setClosetHeight(h);

                // Create 4 parts
                var bottomPanel = menuiseriePanelFactory.create(C.gzone);
                menuiseriePanelFactory.beOnSide(bottomPanel, 'bottom');
                menuiseriePanelFactory.beBottom(bottomPanel);

                var topPanel = menuiseriePanelFactory.create(C.gzone);
                menuiseriePanelFactory.beOnSide(topPanel, 'top');
                menuiseriePanelFactory.beTop(topPanel);

                var leftPanel = menuiseriePanelFactory.create(C.gzone);
                menuiseriePanelFactory.beOnSide(leftPanel, 'left');
                menuiseriePanelFactory.beLeft(leftPanel);

                var rightPanel = menuiseriePanelFactory.create(C.gzone);
                menuiseriePanelFactory.beOnSide(rightPanel, 'right');
                menuiseriePanelFactory.beRight(rightPanel);
                
                // Add to compound
                C.addPart(bottomPanel, 'bottom');
                C.addPart(topPanel, 'top');
                C.addPart(leftPanel, 'left');
                C.addPart(rightPanel, 'right');

                // The default horizontal splitter
                //menuiserieZoneFactory.createSplitter('horizontal', 0, C.zone, "Module");
                C.update();

                return C;
            },

            // Closet model 'FullVerPrior' class
            createFullVerPrior: function (closetModel, project, w, h, d, closetColour, panelModel) {
                var C = menuiserieCompoundFactory.createType1(w, h, d, closetColour, panelModel);
                C.setComposer(menuiserieClosetComposer.getSeparatorOnly());

                project.compounds.push(C);
                C.id = 1;
                C.setClosetModel(closetModel);

                project.getGround().setClosetHeight(h);

                // Create 2 parts
                var leftPanel = menuiseriePanelFactory.create(C.gzone);
                menuiseriePanelFactory.beOnSide(leftPanel, 'left');
                menuiseriePanelFactory.beLeft(leftPanel);

                var rightPanel = menuiseriePanelFactory.create(C.gzone);
                menuiseriePanelFactory.beOnSide(rightPanel, 'right');
                menuiseriePanelFactory.beRight(rightPanel);

                C.addPart(leftPanel, 'left');
                C.addPart(rightPanel, 'right');

                // The default horizontal splitter
                var hs = menuiserieZoneFactory.createSplitter('horizontal', 0, C.zone, "Module");
                C.update();

                // 3 horizontal separator
                _makeFullVerPriorModule(hs.subZones[0], closetModel);
                hs.subZones[0].update();

                return C;
            },

            // Create an empty new closet. useful when will be readen from model with serializer.
            createEmpty: function (project, closetColour, panelModel) {
                var h = 100;
                var C = menuiserieCompoundFactory.createType1(100, h, 50, closetColour, panelModel);
                project.compounds.push(C);
                C.id = 1;

                project.getGround().setClosetHeight(h);
                return C;
            },

            // Create new closet from specified closet model. Return the created compound.
            // closetModel: the closet model object
            // project: (Project) Compound is added to the project
            // w: width (X)
            // h: height (Y)
            // d: depth (Z)
            // closetColour: colour of closet
            // panelModel: the panel model
            createFromModel: function (closetModel, project, w, h, d, closetColour, panelModel) {
                var C;

                if (closetModel.ModelClass === 'FramHorPrior')
                    C = this.createFramHorPrior(closetModel, project, w, h, d, closetColour, panelModel);
                else if (closetModel.ModelClass === 'FullVerPrior')
                    C = this.createFullVerPrior(closetModel, project, w, h, d, closetColour, panelModel);
                else
                    throw new Error("[" + applicationName + "] Unknown closet model class '" + closetModel.ModelClass + "'.");

                return C;
            },

            //#endregion
        }
    }
    
    //registration
    thisModule.factory('menuiserieClosetFactory', [
        "menuiserieEnv",
        "menuiserieConst",
        "menuiserieDataFactory", 
        "menuiserieCompoundFactory",
        "menuiserieClosetComposer",
        "menuiserieClosetBrowser",
        "menuiseriePanelFactory",
        "menuiserieZoneFactory",
        "menuiserieGroundFactory",
        "menuiserieSerializer",
        closetFactory
    ]);

    //#endregion

    //#region Project factory
    function projectFactory(menuiserieDataFactory, menuiserieGroundFactory) {

        //#region BOM class
        var Bom = function () {
            this._items = [];
            this._totalPrice = 0;
            this._totalEcoTax = 0;
            this._totalWeight = 0;
        }

        Bom.prototype.add = function (item) {
            if (!item || !angular.isNumber(item.price))
                throw new Error("[" + applicationName + "] Missing, or not valid property 'price' in BOM item.");

            this._items.push(item);
            this._totalPrice += item.price;
            this._totalEcoTax += item.ecoTax;
            this._totalWeight += item.weight;
        }

        Bom.prototype.addPrice = function (price) {
            this._totalPrice += price;
        }

        Bom.prototype.addCart = function (cart) {
            var me = this;
            var i, n, ci;

            n = cart.items.length;
            for (i = 0 ; i < n ; i++) {
                ci = cart.items[i];

                var o = {
                    id: ci.Id,
                    title: ci.Title,
                    dims: [],
                    dimsLabel: 'n.c',
                    surf: '',
                    qty: ci.Qty,
                    price: (ci.Price + ci.ecoTax) * ci.Qty,
                    ecoTax: ci.ecoTax * ci.Qty
                }
                me._items.push(o);
                me._totalPrice += o.price;
                me._totalEcoTax += o.ecoTax;
                me._totalWeight += o.Weight;
            }
        }

        Bom.prototype.getItems = function () { return this._items }

        Bom.prototype.getTotalPrice = function () { return this._totalPrice }

        // Get the total of ecotax part
        Bom.prototype.getTotalEcoTax = function () { return this._totalEcoTax }

        // Get the total weigth of project
        Bom.prototype.getTotalWeight = function () { return this._totalWeight }

        Bom.prototype.clear = function () {
            this._items = [];
            this._totalPrice = 0;
            this._totalEcoTax = 0;
            this._totalWeight = 0;
        }

        //#endregion

        //#region Cart class
        var Cart = function () {
            this.items = [];
        }

        // Set the items. Useful on project loading.
        Cart.prototype.setItems = function (addons) {
            var me = this;
            var i, n, cartItem;

            me.items = [];

            n = addons.length;
            for (i = 0 ; i < n ; i++) {
                cartItem = addons[i];
                cartItem.inputQty = cartItem.Qty;
                cartItem.ecoTax = menuiserieDataFactory.getEcoTaxByWeight(cartItem.Weight).Value
                me.items.push(cartItem);
            }
        }
        
        // Add item in cart
        Cart.prototype.add = function (addon) {
            var me = this;
            var i, n, cartItem;

            // Looking for existing item in cart
            n = me.items.length;
            for (i = 0 ; i < n ; i++) {
                if (me.items[i].Id === addon.Id)
                    cartItem = me.items[i];
            }

            if (cartItem) { // already in cart
                cartItem.Qty++;
                cartItem.inputQty = cartItem.Qty;
            }
            else {
                var o = {
                    inputQty: 1,
                    invalid: false,
                    ecoTax: menuiserieDataFactory.getEcoTaxByWeight(addon.Weight).Value
                };
                jQ.extend(o, addon);
                o.Qty = 1;
                me.items.push(o);
            }
        }

        // Remove item from cart
        Cart.prototype.remove = function (addonId) {
            var me = this;
            var i, n;
            var newItems = [];

            n = me.items.length;
            for (i = 0 ; i < n ; i++) {
                if (me.items[i].Id !== addonId)
                    newItems.push(me.items[i]);
            }

            me.items = newItems;
        }

        // Update quantity. Return true if Qty is valid.
        Cart.prototype.updateQty = function (addon) {
            if (!addon.inputQty)
                addon.invalid = true;
            else {
                addon.Qty = addon.inputQty;
                addon.invalid = false;
            }

            return !addon.invalid;
        }

        // Get the amount of cart
        Cart.prototype.getTotalPrice = function () {
            var me = this;
            var amount = 0;
            var i, n, item;
            
            n = me.items.length;
            for (i = 0 ; i < n ; i++) {
                item = me.items[i];
                amount += item.Qty * item.Price;
            }

            return amount;
        }

        //#endregion

        //#region Project class
        // Constructor
        var Project = function () {
            this.id = 0;
            this.title = "(no title)";
            this.compounds = [];
            this._vatRate = 0;
            this._bom = new Bom();
            this._ground;
            this._record = undefined;
            this.cart = new Cart();
        }

        // Return true if project is new, i.e nver saved
        Project.prototype.isNew = function () { return this.id === 0 }

        // Get and set id
        Project.prototype.getId = function () { return this.id }
        Project.prototype.setId = function (id) {
            if (id <= 0) throw new Error("[" + applicationName + "] Id of project must be greater than 0. Cannot set id.")
            this.id = id
        }

        // Get and set title
        Project.prototype.getTitle = function () { return this.title }
        Project.prototype.setTitle = function (title) { this.title = title }

        // Get and set VAT rate in percent
        Project.prototype.setVATRate = function (rate) { this._vatRate = rate }
        Project.prototype.getVATRate = function () { return this._vatRate }

        // Get the bom
        Project.prototype.getBom = function () { return this._bom }

        // Get the compound
        Project.prototype.getCompound = function () { return this.compounds[0] }

        // Get or set the ground
        Project.prototype.setGround = function (g) { this._ground = g }
        Project.prototype.getGround = function () { return this._ground }

        // Get the record associate with project (i.e the dto returned by menuiserie services)
        // Return undefined if is new project
        Project.prototype.getRecord = function () { return this._record }

        //#endregion

        return {

            // groundTexture: texture of ground
            create: function (title, groundTexture, groundSize, groundGridStep) {
                var P = new Project();
                P.title = title;

                var G = menuiserieGroundFactory.createGround(100, groundSize, groundSize, groundTexture);
                G.setGridStep(groundGridStep)
                P.setGround(G);

                return P;
            }

        }
    }

    //registration
    thisModule.factory('menuiserieProjectFactory', ["menuiserieDataFactory", "menuiserieGroundFactory", projectFactory]);

    //#endregion

    //#endregion

    //#region Closet Validator
    function closetValidator($log, menuiserieClosetFactory, menuiserieClosetBrowser, menuiserieBoundValidator, menuiserieDataFactory) {

        // Return the minimum dimensions of content of zone if any.
        function _getMinDimOfContent(zone, minWidth, minHeight, minDepth) {
            var res = { minWidth: minWidth, minHeight: minHeight, minDepth: minDepth };

            var si;
            var n = zone.getSubCount();
            for (var i = 0 ; i < n ; i++) { // For each content of zone (ex: item may be a drawer-goup)
                si = zone.getSub(i);

                if (si.getWidthRule && si.getWidthRule().mini > res.minWidth) // content has width rule (IDimBounded), and it's more restrictive
                    res.minWidth = si.getWidthRule().mini;

                if (si.getHeightRule && si.getHeightRule().mini > res.minHeight) // content has height rule (IDimBounded), and it's more restrictive
                    res.minHeight = si.getHeightRule().mini;

                if (si.getDepthRule && si.getDepthRule().mini > res.minDepth) // content has depth rule (IDimBounded), and it's more restrictive
                    res.minDepth = si.getDepthRule().mini;
            }

            return res;
        }

        //#region SectionMinimas Class
        var SectionMinimas = function (moduleMinimas) {
            this.MM = moduleMinimas;
            this.height = moduleMinimas.CMF.minHeight; // the user fixed heigth of zone, or min height if auto
            this.depth = moduleMinimas.CMF.minDepth; // the system fixed depth of zone, or min depth if auto
            this.minWidth = moduleMinimas.CMF.minWidth; // the mini width of zone according its content
            this.minHeight = moduleMinimas.CMF.minHeight; // the mini height of zone according its content
            this.minDepth = moduleMinimas.CMF.minDepth; // the mini depth of zone according its content
            this.sumOfDepth = 0; // The sum of depth, useful in case of in-Depth splitted zone.

            this.isSelectedZone = false;
        }

        // Resolve section recursively
        SectionMinimas.prototype.resolve = function(zone, selectedZone) {
            var me = this;
            var n, i, sz;

            var SP = zone.splitter;
            if (!SP) { // Its a leaf

                // if Has sub-items, need to check if content is more restrictive
                var n = zone.getSubCount();
                if (n > 0) {
                    var res = _getMinDimOfContent(zone, me.minWidth, me.minHeight, me.minDepth);
                    me.minWidth = res.minWidth;
                    me.minHeight = res.minHeight;
                    me.minDepth = res.minDepth;
                }

                if (zone.hasYDimAuto)
                    me.height = me.minHeight; // The minimum height according its content if any
                else
                    me.height = zone.getHeight(); // The zone dimension was fixed by user

                if (zone.hasZDimAuto)
                    me.depth = me.minDepth; // The minimum depth according its content if any
                else
                    me.depth = zone.getDepth(); // The zone dimension was fixed by system (back-panel zone)

                if (n > 0) // Depth restriction if content only
                    me.sumOfDepth += me.depth;

                if (selectedZone === zone) // Selected zone found
                    me.isSelectedZone = true;
                // Stop recursion here
            }
            else { // Must recurse deeper
                n = SP.getSubZoneCount();
                for (i = 0 ; i < n ; i++) {
                    sz = SP.getSubZone(i);
                    me.resolve(sz, selectedZone);
                }
            }
        }
        //#endregion

        //#region ModuleMinimas Class
        var ModuleMinimas = function (closetMinimasFinder) {
            this.CMF = closetMinimasFinder;

            this.width = this.CMF.minWidth; // the user fixed width of zone, or min width if auto
            this.minWidth = this.CMF.minWidth; // The minimum width of zone. Depend on content only
            this.minDepth = this.CMF.minDepth;
            this.sumOfHeight = 0;
            this.sumOfShelfThick = 0;
            this.sections = [];
            this.selectedSection = undefined;
            
            //this.minHeights = []; // Minimum height of each section of this module.
        };

        // Resolve subzones of splitter SP. 
        // C is the current compound.
        // gfm : the greater front margin of closet.
        // bpzDim : the back-panel zone dim, useful if back-panel fill whole module.
        ModuleMinimas.prototype._resolveSubZonesOf = function (SP, C, gfm, bpzDim, selectedZone) {
            var me = this;
            var i, sz, n, section, sep;

            n = SP.getSubZoneCount();
            for (i = 0 ; i < n ; i++) {
                sz = SP.getSubZone(i);

                section = new SectionMinimas(me);
                section.resolve(sz, selectedZone);

                if (me.minWidth < section.minWidth) // More restrictive width constraint
                    me.minWidth = section.minWidth;

                if (me.minDepth < section.sumOfDepth + gfm + bpzDim) // More restrictive depth constraint
                    me.minDepth = section.sumOfDepth + gfm + bpzDim;

                // sum of height of each section
                me.sumOfHeight += section.height;

                if (i < SP.getSubCount()) { // sum of horizontal separator thickness
                    sep = SP.getSub(i);
                    me.sumOfShelfThick += me.CMF.panelThickness || sep.getThickness() || menuiserieDataFactory.getThickValue(sep.getMaterialModel());
                }

                me.sections.push(section);

                if (section.isSelectedZone)
                    me.selectedSection = section;
            }
        }
        //#endregion

        //#region ClosetMinimasFinder Class
        var ClosetMinimasFinder = function () {
            this.minWidth = 0; // IN
            this.minHeight = 0; // IN
            this.minDepth = 0; // IN
            this.panelThickness; // IN

            // Result
            this.sumOfWidth = 0; // OUT
            this.sumOfSepThick = 0; // OUT
            this.modules = []; // OUT
            this.heightModule; // OUT : the most restrictive module on height
        }
        //#endregion

        //#region MinimasFinder Class
        var MinimasFinder = function () {
            this.panelThickness;
            this.minZoneW = 0;
            this.minZoneH = 0;
            this.minZoneD = 0;
            this.frontMargin = 0;
            this.selectedZone;

            this.minW = 0;
            this.minH = 0;
            this.minD = 0;
            this.selectedMinW = 0;
            this.selectedMinH = 0;
        }

        MinimasFinder.prototype.resolve = function (zone) {
            this.minW = 0;
            this.minH = 0;
            this.minD = 0;
            this.selectedMinW = 0;
            this.selectedMinH = 0;
            this._resolve(zone, 0, 0, 0);
        }

        MinimasFinder.prototype._resolve = function (zone) {
            var me = this;
            var SP = zone.splitter;

            // The minimun for this iteration. cw and ch are content mini width and height.
            var res = { w: 0, h: 0, d: 0, cw: me.minZoneW, ch: me.minZoneH, szFound: false };

            if (!SP) { // Leaf zone

                // if Has sub-items, need to check if content is more restrictive
                var contentMinis = _getMinDimOfContent(zone, me.minZoneW, me.minZoneH, 0);

                if (zone.hasXDimAuto)
                    res.w = contentMinis.minWidth; // The minimum width according its content if any
                else
                    res.w = zone.getWidth(); // The zone dimension was fixed by user

                if (zone.hasYDimAuto)
                    res.h = contentMinis.minHeight; // The minimum height according its content if any
                else
                    res.h = zone.getHeight(); // The zone dimension was fixed by user

                if (zone.hasZDimAuto)
                    res.d = contentMinis.minDepth; // The minimum depth according its content if any
                else
                    res.d = zone.getDepth(); // The zone dimension was fixed by system (back-panel zone)

                res.cw = contentMinis.minWidth;
                res.ch = contentMinis.minHeight;

                if (me.selectedZone === zone) {// The current selected zone : useful to valid zone dimension
                    if (me.selectedMinW < res.cw)
                        me.selectedMinW = res.cw;

                    if (me.selectedMinH < res.ch)
                        me.selectedMinH = res.ch;

                    res.szFound = true;
                }
            }
            else { // Recurse deeper in tree
                var orient, i, n, sz, minis, sep, C;
                var sum = 0;
                var minContentW = 0, minContentH = 0, selectedZoneFound = false;

                C = zone.getCompound();
                orient = SP.getOrientation();
                n = SP.getSubZoneCount();

                for (i = 0 ; i < n ; i++) {
                    sz = SP.getSubZone(i);
                    minis = me._resolve(sz);

                    // sum of dimensions according orientation
                    if (orient === 'horizontal') {
                        sum += minis.w;

                        if (res.h < minis.h) // More restrictive height
                            res.h = minis.h;

                        if (res.d < minis.d) // More restrictive depth
                            res.d = minis.d;

                        // Find most restrictive content
                        if (res.ch < minis.ch)
                            res.ch = minis.ch;
                    }
                    else if (orient === 'vertical') {
                        sum += minis.h;

                        if (res.w < minis.w) // More restrictive width
                            res.w = minis.w;

                        if (res.d < minis.d) // More restrictive depth
                            res.d = minis.d;

                        // Find most restrictive content
                        if (res.cw < minis.cw)
                            res.cw = minis.cw;
                    }
                    else {
                        sum += minis.d;

                        if (res.w < minis.w) // More restrictive width
                            res.w = minis.w;

                        if (res.h < minis.h) // More restrictive height
                            res.h = minis.h;

                        // Find most restrictive content
                        /*if (res.ch < minis.ch)
                            res.ch = minis.ch;*/
                        if (res.cw < minis.cw)
                            res.cw = minis.cw;
                    }

                    // sum of separator thickness
                    if (i < SP.getSubCount()) {
                        sep = SP.getSub(i);
                        sum += me.panelThickness || sep.getThickness() || C.getDefaultThickness();
                    }

                    if (minis.szFound)
                        res.szFound = true;
                }
                
                if (orient === 'horizontal') {
                    res.w = sum; 

                    if (me.minW < sum) // More restrictive width
                        me.minW = sum;
                }
                else if (orient === 'vertical') {
                    res.h = sum;

                    if (me.minH < sum) // More restrictive height
                        me.minH = sum;
                }
                else {
                    sum += me.frontMargin; // greater front margin of closet.
                    res.d = sum;
                }

                // The current selected zone : useful to valid zone dimension
                if (res.szFound) {
                    if (me.selectedMinW < res.cw)
                        me.selectedMinW = res.cw;

                    if (me.selectedMinH < res.ch)
                        me.selectedMinH = res.ch;
                }
            }

            // More restrictive depth. Min depth is global to closet.
            if (me.minD < res.d)  
                me.minD = res.d;

            return res;
        }
        //#endregion

        // Closet minimas finder singleton
        var _CMF = new ClosetMinimasFinder();
        var _MF = new MinimasFinder();

        return {

            // Return true if zone can be splitted with respect of minimal dimension for result zones.
            // zone : (Zone) zone to test
            // minDim : (Number) the minimal dimension
            // thickness : (Number) the separator thickness
            // mode: (String) mode of split 'horizontal' or 'vertical'
            // count: (Number) the count of wanted sub-zone. If not specified, default is 2.
            canSplit: function (zone, minDim, thickness, mode, count) {
                var n = count || 2;
                var dim = mode === 'horizontal' ? zone.getWidth() : zone.getHeight();
                var w = (dim - (thickness * (n - 1))) / n;

                return (w < minDim) ? false : true;
            },

            // Get the closet dimension bounds. Useful to make closet dimension validation.
            // args : {
            //  compound: (Compound1) the root compound of closet.
            //  closetWidthRule: (DimensionRule) the closet width rule.
            //  closetHeightRule: (DimensionRule) the closet height rule.
            //  closetDepthRule: (DimensionRule) the closet depth rule.
            //  zoneWidthRule: (DimensionRule) the zone width rule.
            //  zoneHeightRule: (DimensionRule) the zone height rule.
            //  forcedThickness: (Number) The separator thickness. If defined replace compound default thickness. Useful to test closet dimensions.
            // }
            getClosetDimensionBounds: function (args) {
                // The result
                var bounds = {
                    minWidth: args.closetWidthRule.mini, maxWidth: args.closetWidthRule.maxi,
                    minHeight: args.closetHeightRule.mini, maxHeight: args.closetHeightRule.maxi,
                    minDepth: args.closetDepthRule.mini, maxDepth: args.closetDepthRule.maxi
                };

                // Current compound
                var C = args.compound;

                // If compound is not empty
                if (!C.getInnerZone().isEmpty()) {

                    // Current model
                    var closetModel = C.getClosetModel();

                    // The default minimas
                    _MF.panelThickness = args.forcedThickness;

                    // resolve the minimas
                    _MF.minZoneW = args.zoneWidthRule.mini;
                    _MF.minZoneH = args.zoneHeightRule.mini;
                    _MF.minZoneD = args.closetDepthRule.mini;
                    _MF.frontMargin = C.getGreatestFrontMargin();
                    _MF.resolve(C.getInnerZone());

                   
                    // minimun dimensions according to main parts
                    var thick = C.getDefaultThickness();
                    var leftPart = C.getPart('left');
                    var rightPart = C.getPart('right');
                    var bottomPart = C.getPart('bottom');
                    var topPart = C.getPart('top');
                    var minWidth = _MF.minW + (leftPart ? thick : 0) + (rightPart ? thick : 0);
                    var minHeight = _MF.minH + (bottomPart ? thick : 0) + (topPart ? thick : 0);
                    var minDepth = _MF.minD;

                    if (bounds.minWidth < minWidth)
                        bounds.minWidth = minWidth; // More restrictive width constraint

                    if (bounds.minHeight < minHeight)
                        bounds.minHeight = minHeight; // More restrictive height constraint

                    if (bounds.minDepth < minDepth)
                        bounds.minDepth = minDepth; // More restrictive depth constraint

                }

                return bounds;
            },

            // Get the zone dimension bounds. Useful to make zone dimension validation.
            // Return object : { 
            //  minWidth: (Number) minimum allowed width, 
            //  maxWidth: (Number) maximum allowed width or undefined if unlimited, 
            //  minHeight: (Number) minimum allowed height, 
            //  maxHeight: (Number) maximum allowed height or undefined if unlimited 
            // }
            getZoneDimensionBounds: function (zone, zoneWidthRule, zoneHeightRule) {

                // The result
                var bounds = {
                    minWidth: zoneWidthRule.mini,
                    maxWidth: Infinity,
                    minHeight: zoneHeightRule.mini,
                    maxHeight: Infinity
                };

                // if root zone stop here
                var PZ = zone.parentZone;
                if (!PZ) return bounds;

                // parent splitter
                var PSp = PZ.splitter;
                
                // Current compound
                var C = zone.getCompound();
                var RZ = C.getInnerZone(); // the root zone
                var W = RZ.getWidth(); // total width
                var H = RZ.getHeight(); // total height

                // The default width minimas
                _MF.minZoneW = zoneWidthRule.mini;
                _MF.minZoneH = zoneHeightRule.mini;
                _MF.minZoneD = 0;
                _MF.selectedZone = zone;

                // resolve the width minimas from root
                _MF.resolve(C.getInnerZone());
                
                // The width minimas of current zone
                bounds.minWidth = _MF.selectedMinW;

                // Get sums of width dimension without current zone dimension
                var sumOfWidth = _MF.minW - zone.getWidth();

                // The default height minimas
                _MF.minZoneW = zoneWidthRule.mini;
                _MF.minZoneH = zoneHeightRule.mini;
                _MF.minZoneD = 0;

                // resolve the height minimas from root
                _MF.resolve(menuiserieClosetBrowser.getWZone(zone));

                // The height minimas of current zone
                bounds.minHeight = _MF.selectedMinH;

                // Get sums of height dimension without current zone dimension
                var sumOfHeight = _MF.minH - zone.getHeight();

                // The max width                
                if (!zone.hasXDimAuto)
                    bounds.maxWidth = Math.round((W - sumOfWidth) * 1000) / 1000;

                // The max height                
                if (!zone.hasYDimAuto)
                    bounds.maxHeight = Math.round((H - sumOfHeight) * 1000) / 1000;
                
                return bounds;
            },

            // Return true if zone can have back-panel according to minimum width of its content.
            canSetBackPanel: function (zone, backModel, minClosetDepth) {
                // The min depth according content
                var minDims = _getMinDimOfContent(zone, 0, 0, minClosetDepth);
                var minDepth = minDims.minDepth;

                // The thickness of backpanel model
                minDepth += menuiserieDataFactory.getThickValue(backModel);

                // The front margin
                minDepth += zone.getCompound().getGreatestFrontMargin();

                return (minDepth <= zone.getCompound().getDepth());
            }

        }
        
    }

    //registration
    thisModule.factory('menuiserieClosetValidator', ["$log", "menuiserieClosetFactory", "menuiserieClosetBrowser", "menuiserieBoundValidator", "menuiserieDataFactory", closetValidator]);

    //#endregion

    //#region Serializer
    function serializer(
        $log,
        $q,
        $timeout,
        menuiserieWebService,
        menuiserieDataFactory,
        menuiserieZoneFactory,
        menuiseriePositionerFactory,
        menuiseriePanelFactory,
        menuiserieClosetComposer,
        menuiserieCompoundFactory,
        menuiserieHangingBarFactory) {

        var _currentVersion = 1;

        //#region Serializer class
        var Serializer = function () {
            this._lazyLoadedDataMap = {};
        }

        // Write a reference to data like colour or accessory. Useful on reading to map lost references.
        Serializer.prototype._writeDataRef = function (dataType, name, o, node) {
            if (!o)
                this.write(name, null, node)
            else {
                if (!o.Id) throw new Error("[MENUISERIELoset] The data has no property 'Id'. Cannot write the data reference.");
                this.write(name, o.Id, node); // write the dataId
            }
        }

        // Read a reference to data like colour or accessory, and return the matching data object from data-factory.
        Serializer.prototype._readDataRef = function (dataType, name, node) {
            var id = this.read(name, node); // read the dataId
            if (id === null) return undefined;

            var o;
            if (dataType === 'CLR') {
                o = menuiserieDataFactory.getColourById(id);
                if (!o)
                    menuiserieDataFactory.getColourTable()[0]; // Replaced by first
            }
            else if (dataType === 'PAN') {
                o = menuiserieDataFactory.getMaterialModelById(id);
                if (!o)
                    menuiserieDataFactory.getPanelModelTable()[0]; // Replaced by first
            }
            else if (dataType === 'DRW') {
                o = menuiserieDataFactory.getDrawerModelById(id);
                if (!o)
                    menuiserieDataFactory.getDrawerModelTable()[0]; // Replaced by first
            }
            else if (dataType === 'ACC') {
                o = menuiserieDataFactory.getAccessoryModelById(id);
                if (!o)
                    menuiserieDataFactory.getAccessoryModelTable()[0]; // Replaced by first
            }
            else if (dataType === 'HGB') {
                o = menuiserieDataFactory.getHangingBarModelById(id);
                if (!o)
                    menuiserieDataFactory.getHangingBarModelTable()[0]; // Replaced by first
            }
            else
                throw new Error("[" + applicationName + "] Unknown serialized reference with data type '" + dataType + "'. Reading failed.");

            if (o.load) { // Run data loading and store object to verify its loading status.
                var key = dataType + id;
                if (!this._lazyLoadedDataMap[key]) {
                    o.load();
                    this._lazyLoadedDataMap[key] = o;
                }
            }

            return o;
        }

        // Check if all data of _lazyLoadedDataArray are loaded.
        Serializer.prototype._lazyLoadedDataComplete = function () {
            var map = this._lazyLoadedDataMap;
            for (var key in map) {
                if (!map[key].isLoaded)
                    throw new Error("[" + applicationName + "] Missing 'isLoaded' method definition.");

                if (!map[key].isLoaded()) {
                    $log.info("... waiting for lazy loading complete for '" + key + "'");
                    return false;
                }
            }
            
            return true;
        }

        // Return the serialization tree
        Serializer.prototype.getTree = function () { return this._tree }

        // Write an information in node.
        // name : (String) the name of property.
        // value : (Object) the value of property.
        // node : (Object) the node owner of property in serialization tree.
        Serializer.prototype.write = function (name, value, node) {
            if (angular.isDefined(node[name]))
                throw new Error("[" + applicationName + "] The property '" + name + "' already exists in node. Serialization writing failed.")

            node[name] = value;
        }

        // Read an information from node.
        // name : (String) the name of property.
        // node : (Object) the node owner of property in serialization tree. 
        // Return the value of property.
        Serializer.prototype.read = function (name, node) {
            if (angular.isUndefined(node[name]))
                throw new Error("[" + applicationName + "] The property '" + name + "' does not exists in node. Serialization reading failed.");

            return node[name];
        }

        // Return true if node has a property named name
        Serializer.prototype.nodeHasProp = function(name, node) { return angular.isDefined(node[name]) }

        // Write data references
        Serializer.prototype.writeColour = function (name, o, node) { this._writeDataRef('CLR', name, o, node); }
        Serializer.prototype.writePanel = function (name, o, node) { this._writeDataRef('PAN', name, o, node); }
        Serializer.prototype.writeDrawer = function (name, o, node) { this._writeDataRef('DRW', name, o, node); }
        Serializer.prototype.writeAccessory = function (name, o, node) { this._writeDataRef('ACC', name, o, node); }
        Serializer.prototype.writeHangingBar = function (name, o, node) { this._writeDataRef('HGB', name, o, node); }

        // Read data references
        Serializer.prototype.readColour = function (name, node) { return this._readDataRef('CLR', name, node); }
        Serializer.prototype.readPanel = function (name, node) { return this._readDataRef('PAN', name, node); }
        Serializer.prototype.readDrawer = function (name, node) { return this._readDataRef('DRW', name, node); }
        Serializer.prototype.readAccessory = function (name, node) { return this._readDataRef('ACC', name, node); }
        Serializer.prototype.readHangingBar = function (name, node) { return this._readDataRef('HGB', name, node); }

        // Deserialize
        Serializer.prototype.deserialize = function (typ, node, params) {
            var me = this;

            if (typ === 'Zone') {
                if (!params) throw new Error("[" + applicationName + "] Missing 'params'. Cannot deserialize Zone.");

                if (angular.isUndefined(params.parentZone)) throw new Error("[" + applicationName + "] Missing 'params.parentZone'. Cannot deserialize Zone.");
                if (angular.isUndefined(params.compound)) throw new Error("[" + applicationName + "] Missing 'params.compound'. Cannot deserialize Zone.");

                var Z = menuiserieZoneFactory.createZone("", params.compound, params.parentZone);
                Z.readFrom(me, node);
                return Z;
            }
            else if (typ === 'Splitter') {
                if (!params || !params.splittedZone)
                    throw new Error("[" + applicationName + "] Missing 'params.splittedZone'. Cannot deserialize Splitter.");

                var S = menuiserieZoneFactory.createSplitter('horizontal', 0, params.splittedZone);
                S.readFrom(me, node);
                return S;
            }
            else if (typ === 'PanelPositioner')
            {
                if (!params || !params.zone)
                    throw new Error("[" + applicationName + "] Missing 'params.zone'. Cannot deserialize PanelPositioner.");

                var PP = menuiseriePositionerFactory.createPanelPositioner('left', 0, params.zone)
                PP.readFrom(me, node);
                return PP;
            }
            else if (typ === 'Panel') {
                if (!params || !params.parentZone)
                    throw new Error("[" + applicationName + "] Missing 'params.parentZone'. Cannot deserialize Panel.");

                var P = menuiseriePanelFactory.create(params.parentZone);
                P.readFrom(me, node);
                return P;
            }
            else if (typ === 'DrawerGroup') {
                if (!params || !params.parentZone)
                    throw new Error("[" + applicationName + "] Missing 'params.parentZone'. Cannot deserialize DrawerGroup.");

                var DG = menuiserieCompoundFactory.createDrawerGroup1(params.parentZone);
                DG.readFrom(me, node);
                return DG;
            }
            else if (typ === 'HangingBar') {
                if (!params || !params.parentZone)
                    throw new Error("[" + applicationName + "] Missing 'params.parentZone'. Cannot deserialize HangingBar.");

                var HB = menuiserieHangingBarFactory.create(params.parentZone)
                HB.readFrom(me, node);
                return HB;
            }
            else
                throw new Error("[" + applicationName + "] Unknown object type '" + typ + "'. Cannot deserialize object.");
        }

        //#endregion

        return {

            // Create sereliazer intance, useful to make copy operation.
            create: function() { return new Serializer() },

            // Save a project associate with shopId. imgDataUrl is binary image content base64 encoded.
            saveProject: function (project, shopId, imgDataUrl, saveAsMode) {
                var srz = new Serializer();
                var C = project.getCompound();
                var bom = project.getBom();
                var rootDataNode = {};
                C.writeTo(srz, rootDataNode);

                var closetModelId = C.getClosetModel().Id;
                var projectId = saveAsMode ? 0 : project.getId();
                return menuiserieWebService.saveProject(closetModelId,
                    shopId,
                    projectId,
                    project.getTitle(),
                    bom.getTotalPrice(),
                    bom.getTotalEcoTax(),
                    project.getVATRate(),
                    bom.getTotalWeight(),
                    { version: _currentVersion, root: rootDataNode },
                    imgDataUrl,
                    project.cart.items);
            },

            // Save the current closet model of project. The uderlying closet model will be modified.
            saveClosetModel: function (project) {
                var srz = new Serializer();
                var C = project.getCompound();
                var rootDataNode = {};

                var modelBck = C.getClosetModel();
                C.setClosetModel(null); // closet model are never saved if model : logic isn't it !
                C.writeTo(srz, rootDataNode);
                C.setClosetModel(modelBck);

                return menuiserieWebService.saveClosetModel(C.getClosetModel().Id, { version: _currentVersion, root: rootDataNode });
            },

            // Load JsonData into compound.
            // Return promise without parameter.
            loadJsonData: function (jsonData, compound) {
                if (!compound)
                    throw new Error("[" + applicationName + "] Compound is not specified. Cannot load JsonData to null compound.");

                var srz = new Serializer();
                var defer = $q.defer();
                var me = this;

                var dataAsObj = angular.fromJson(jsonData);

                // TODO check version
                compound.clear();
                compound.readFrom(srz, dataAsObj.root);

                // Waiting for all required data are loaded
                var _loop = 0;
                var doLoop = function () {
                    _loop++;

                    if (_loop > 40)
                        throw new Error("[" + applicationName + "] Timeout error during open project. Associate data loading was not complete.")

                    if (srz._lazyLoadedDataComplete())
                        defer.resolve();
                    else
                        $timeout(doLoop, 250);
                }

                // Stat loop
                doLoop();
                
                return defer.promise;
            },

            // Load project according to projectId
            // Return promise with ProjectDto.
            loadProject: function (project, projectId) {
                var C = project.getCompound();
                
                var defer = $q.defer();
                var me = this;

                menuiserieWebService.openProject(projectId).then(function (response) {
                    var dto = response.data;

                    project.setId(projectId);
                    project.setTitle(dto.Title);
                    project._record = dto;

                    // Cart
                    project.cart.setItems(dto.Addons);

                    me.loadJsonData(dto.JsonData, C).then(function () {                        
                        defer.resolve(dto);
                    },
                    function (err) {
                        defer.reject(err)
                    })
                },
                function (err) {
                    defer.reject(err)
                });

                return defer.promise;
            },

            // Load JsonData of closetModel into project compound. Project must have valid compound.
            // Return promise without parameter.
            loadClosetModel: function (closetModel, project) {
                if (closetModel.JsonData === '')
                    throw new Error("[" + applicationName + "] Cannot set empty closet model to project. Check JsonData.");

                var C = project.getCompound();
                var defer = $q.defer();
                var me = this;

                me.loadJsonData(closetModel.JsonData, C).then(function () {
                    project.setTitle(closetModel.Title);
                    C.setClosetModel(closetModel); // Set closet model for configuration
                    defer.resolve();
                },
                function (err) {
                    defer.reject(err)
                })

                return defer.promise;
            }
        }
    }

    //registration
    thisModule.factory('menuiserieSerializer', [
        "$log",
        "$q",
        "$timeout",
        "menuiserieWebService",
        "menuiserieDataFactory",
        "menuiserieZoneFactory",
        "menuiseriePositionerFactory",
        "menuiseriePanelFactory",
        "menuiserieClosetComposer",
        "menuiserieCompoundFactory",
        "menuiserieHangingBarFactory",
        serializer
    ]);

    //#endregion
})();
