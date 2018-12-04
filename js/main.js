window.onload = init;

//Les objets essentiels
var scene, camera, renderer;


//Les booleans pour les mouvements
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var sprint = false;

//Perspective de la caméra
const fov = 90, aspect = window.innerWidth / window.innerHeight, near = 0.1, far = 1000; 

//Attributs pour le personnages
const playerHeight = 1.8, playerSpeed = 0.25, playerSprint = 0.45, playerSensibility = 0.02;

//Spwans
var spawnX = new Array();
var spawnZ = new Array();
spawnX[0] = 40;
spawnX[1] = -40;
spawnX[2] = 0;
spawnX[3] = 0;
spawnZ[0] = 0;
spawnZ[1] = 0;
spawnZ[2] = 40;
spawnZ[3] = -40;

//Variables X et Y des mouvements de la souris
var moveX, moveY, halfX = window.innerWidth / 2, halfY = window.innerHeight / 2;

function init() {
    
	
	
	scene = new THREE.Scene();        //Crée l'espace de jeu
	
	//Charge la skybox 
	scene.background = new THREE.CubeTextureLoader()
	.setPath( 'textures/sor_hills/' )
	.load( [
		'hills_ft.jpg',
		'hills_bk.jpg',
		'hills_up.jpg',
		'hills_dn.jpg',
		'hills_rt.jpg',
		'hills_lf.jpg'
	] );
	
	//Camera
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);    //Initialise le fov, l'aspect, near et far
	var random = Math.floor(Math.random() * 4); //Nombre random entre 0 et 3 inclus pour déterminer le spawn
	camera.position.set(spawnX[random],playerHeight,spawnZ[random]);
	camera.lookAt(new THREE.Vector3(0,playerHeight,0));
	
	//Rendue
	renderer = new THREE.WebGLRenderer();     // Crée le rendue de la scène en utilisant WebGL
	renderer.setSize(window.innerWidth, window.innerHeight - 10);   //La taille de la fenetre du rendue (Ici on utilise la largeur et la hauteur de la fenêtre)
	renderer.shadowMap.enabled = true;   // Active les ombres
	renderer.shadowMap.type  = THREE.BasicShadowMap;  // Ombre de basses qualitées pour de meilleures performances
	
	
	//Lumières
	var ambientLight = new THREE.AmbientLight(0xffffff, 0.7 ); // Lumière ambiante
    scene.add( ambientLight );   // Ajout de la lumière dans la scène
	
	var shadowLight = new THREE.PointLight( 0xffffff, 1, 200);  // Lumière pour les ombres
	shadowLight.castShadow = true;  // Permet à la lumière de produire des ombres
	shadowLight.position.set( -100, 50, 100 );  // Position de la caméra 
	shadowLight.position.set( 0, 15, 0 );
	shadowLight.shadow.near = 0.1;  //Distance proche pour voir les ombres
	shadowLight.shadow.far = 30;  //Distance loingtaine pour voir les ombres
	scene.add( shadowLight );  // Ajout de la lumière dans la scène
	
	
	//Controles du joueurs
	window.addEventListener('keydown', keyDown); //Lorsque une touche du clavier est enclenchée
	window.addEventListener('keyup', keyUp); //Lorsque une touche du clavier est désenclenchée
	window.addEventListener('mousemove', mouseMouvement); //Lorsque un mouvement de la souris est capté

	//Fenêtre de jeu
	document.body.appendChild(renderer.domElement);      //Introduit le jeu dans le html
	window.addEventListener('resize', onWindowResize, false); //Fonction pour ajuster la fenêtre en cas de resize
	
	//Fonction qui génère le jeu
	createWorld(); //Introduit les objets et modèles dans la scène
	animation(); //Fonction pour l'aniamtion de la scène
    
};


function keyDown(event){
	switch ( event.keyCode ) {
        case 38: // Flèche haut
		case 90: // Touche Z
			moveForward = true;
			break;

		case 37: // Flèche gauche
		case 81: // Touche Q
			moveLeft = true;
			break;

		case 40: // Flèche bas
		case 83: // Touche S
			moveBackward = true;
			break;

		case 39: // Flèche Droite
		case 68: // Touche D
			moveRight = true;
			break;
		case 16:
			sprint = true;
			break;
	}

};

function keyUp(event){
	switch ( event.keyCode ) {
        case 38: // Flèche haut
		case 90: // Touche Z
			moveForward = false;
			break;

		case 37: // Flèche gauche
		case 81: // Touche Q
			moveLeft = false;
			break;

		case 40: // Flèche bas
		case 83: // Touche S
			moveBackward = false;
			break;

		case 39: // Flèche Droite
		case 68: // Touche D
			moveRight = false;
			break;
		case 16:
			sprint = false;
			break;
	}

};

function mouseMouvement(event){
	moveX = event.clientX - halfX;
	moveY = event.clientY - halfY;
}



function createWorld(){

	//Axe Helper
	
	var axes = new THREE.AxisHelper(100);
	scene.add( axes );
	
	//Floor
	var floor =  new THREE.Mesh(new THREE.PlaneGeometry( 200, 200, 20, 20), new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, map: new THREE.TextureLoader().load( "textures/grass.jpg" )} ));
	floor.rotation.x += Math.PI / 2;
	//floor.castShadow = true;
	floor.receiveShadow = true;
	scene.add(floor);
	
	// Models

	
	
	
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

	var house = new THREE.ObjectLoader();
	house.load("objects/House/old-house.json", function (obj2){
		obj2.position.set(10,0,0);
		scene.add(obj2);
	});
}


function animation(){
	requestAnimationFrame(animation);
	
	//Collision Bordure de map
	var limite = 80;
	
    if(camera.position.x < -limite || camera.position.x > limite){
		camera.position.x = THREE.Math.clamp( camera.position.x, - limite, limite );
    }
	if(camera.position.z < -limite || camera.position.z > limite){
		camera.position.z = THREE.Math.clamp( camera.position.z, - limite, limite );
	}
	if(camera.position.y < playerHeight || camera.position.y > playerHeight){
		camera.position.y = THREE.Math.clamp( camera.position.y, playerHeight, playerHeight );
	}
	
	//Controles pour les mouvements du joueurs
	if(moveForward && !sprint){
	camera.translateZ(-playerSpeed);
    }
	if(moveForward && sprint){
	camera.translateZ(-playerSprint);
    }
    if(moveBackward){
	camera.translateZ(playerSpeed);
    }
    if(moveLeft){
	camera.translateX(-playerSpeed);
    }
    if(moveRight){
	camera.translateX(playerSpeed);
    }

	//Mouvement de la caméra
	camera.rotation.x = Math.max( - (Math.PI / 2), Math.min( Math.PI / 2,moveY * playerSensibility));
	camera.rotation.y = moveX * playerSensibility;
	
	
	renderer.render(scene, camera);
}



function onWindowResize() {
	  camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
}



