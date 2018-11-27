window.onload = init;

//Les objets essentiels
var scene, camera, renderer;
var controls, clock;


//Les constantes
const fov = 90, aspect = window.innerWidth / window.innerHeight, near = 0.1, far = 1000;
const playerHeight = 1.8, playerSpeed = 1.4;

function init() {
    
	
	
	scene = new THREE.Scene();        //Crée l'espace de jeu
	
	//Charge la skybox 
	scene.background = new THREE.CubeTextureLoader()
	.setPath( 'textures/skybox/' )
	.load( [
		'px.jpg',
		'nx.jpg',
		'py.jpg',
		'ny.jpg',
		'pz.jpg',
		'nz.jpg'
	] );
	
	//Camera
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);    //Initialise le fov, l'aspect, near et far
	camera.position.set(15,playerHeight,30);
	camera.lookAt(new THREE.Vector3());
	
	
	//Rendue
	renderer = new THREE.WebGLRenderer();     // Crée le rendue de la scène en utilisant WebGL
	renderer.setSize(window.innerWidth, window.innerHeight);   //La taille de la fenetre du rendue (Ici on utilise la largeur et la hauteur de la fenêtre)
	renderer.shadowMap.enabled = true;   // Active les ombres
	renderer.shadowMap.type  = THREE.BasicShadowMap;  // Ombre de basses qualitées pour de meilleures performances
	
	
	//Lumière
	var ambientLight = new THREE.AmbientLight(0xffffff, 0.7 ); // Lumière ambiante
    scene.add( ambientLight );   // Ajout de la lumière dans la scène
	
	var shadowLight = new THREE.PointLight( 0xffffff, 1, 200);  // Lumière pour les ombres
	shadowLight.castShadow = true;  // Permet à la lumière de produire des ombres
	shadowLight.position.set( -100, 50, 100 );  // Position de la caméra 
	shadowLight.position.set( 0, 15, 0 );
	shadowLight.shadow.near = 0.1;  //Distance proche pour voir les ombres
	shadowLight.shadow.far = 30;  //Distance loingtaine pour voir les ombres
	scene.add( shadowLight );  // Ajout de la lumière dans la scène
	
	
	
	clock = new THREE.Clock();
	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = 100;
	controls.lookSpeed = 0.1;
	
	document.body.appendChild(renderer.domElement);      //Introduit le jeu dans le html
	createWorld();
	animation();
    
};



function createWorld(){

	//Axe Helper
	
	var axes = new THREE.AxisHelper(100);
	scene.add( axes );
	
	//Floor
	var floor =  new THREE.Mesh(new THREE.PlaneGeometry( 200, 200, 20, 20), new THREE.MeshPhongMaterial( { color: 0x808080 , side: THREE.DoubleSide, map: new THREE.TextureLoader().load( "textures/grass.jpg" )} ));
	floor.rotation.x += Math.PI / 2;
	//floor.castShadow = true;
	floor.receiveShadow = true;
	scene.add(floor);
	
	// Models

	/*var mtlLoader = new THREE.MTLLoader();
	mtlLoader.load("objects/Goat_Truck/Goat_Truck.mtl", function(materials){
		
		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);
		
		objLoader.load("objects/Goat_Truck/Goat_Truck.obj", function(mesh){
		
			mesh.traverse(function(node){
				if( node instanceof THREE.Mesh ){
					node.castShadow = true;
					node.receiveShadow = true;
				}
			});
		
			scene.add(mesh);
			mesh.position.set(-5, 0, 4);
			mesh.rotation.y = -Math.PI/4;
		});
		
	});*/
	
	/*var objectLoader = new THREE.ObjectLoader();
	objectLoader.load("objects/ferrari-laferrari.json", function ( obj ) {
		obj.position.set(5,2.35,0);
	scene.add( obj );
	} );
	
	objectLoader.load("objects/Tree/tree.json", function ( obj ) {
		obj.position.set(15,0,0);
		obj.scale.set( 0.2, 0.2, 0.2 );
	scene.add( obj );
	} );
	
	objectLoader.load("objects/Tree/tree2.json", function ( obj ) {
		obj.position.set(20,0,10);
		obj.scale.set( 0.2, 0.2, 0.2 );
	scene.add( obj );
	} );*/
	
	
	
	var fence = new THREE.ObjectLoader();
	fence.load("objects/Fence/chain-fence.json", function ( obj ) {
		
		obj.rotation.y += Math.PI / 2;
		obj.position.set(80,0,0);
		obj.scale.set( 8, 1, 8);
		var fence1 = obj.clone();
		fence1.position.set(-80,0,0);
		var fence2 = obj.clone();
		fence2.rotation.y += Math.PI / 2;
		fence2.position.set(0,0,80);
		var fence3= fence2.clone();
		fence3.position.set(0,0,-80);
		
		
		scene.add( obj );
		scene.add(fence1);
		scene.add(fence2);
		scene.add(fence3);
	} );
}


function animation(){
	requestAnimationFrame(animation);
	controls.update(clock.getDelta());
	
	//Collision Bordure de map
	var limite = 80;
    if(camera.position.x < -limite || camera.position.x > limite){
	camera.position.x = THREE.Math.clamp( camera.position.x, - limite, limite );
    }

    if(camera.position.z < -limite || camera.position.z > limite){
	camera.position.z = THREE.Math.clamp( camera.position.z, - limite, limite );
	
    }
	
	
	renderer.render(scene, camera);
}

