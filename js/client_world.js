

//Les objets essentiels
var scene, camera, renderer;


//Les booleans pour les mouvements
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var sprint = false;
var shoot = false;

//Perspective de la caméra
const fov = 90, aspect = window.innerWidth / window.innerHeight, near = 0.1, far = 1000; 

//Attributs pour le personnages et les munitions
const playerHeight = 1.8, playerSpeed = 0.25, playerSprint = 0.45, playerSensibility = 0.005;
var player, playerHealth = 100, playerId, playerData, playerDeath = 0;
var otherPlayers = new Array(); 
var otherPlayersId = new Array();; 
var objects = new Array();
var bullets = new Array();
var bulletsX = new Array();
var bulletsY = new Array();
var bulletsZ = new Array();
var bulletsOtherX = [new Array(), new Array()];
var bulletsOtherY = [new Array(), new Array()];
var bulletsOtherZ = [new Array(), new Array()];

//Spwans pour le respwan lors de la mort
var spawnX = new Array();
var spawnZ = new Array();
spawnX[0] = 20;
spawnX[1] = -20;
spawnX[2] = 0;
spawnZ[0] = -20;
spawnZ[1] = 20;
spawnZ[2] = 40;

// Variable pour le canvas du jeu, obligatoire pour les fonctions du pointer lock
var canvas;
var container;

//Audio du jeu
var listener, walkingSound, shootSound;
var loaderWalkingSound = new THREE.AudioLoader(), loaderShootSound = new THREE.AudioLoader();

// Raycaster (pour les collisions)
var raycasterFront, raycasterBack, raycasterLeft, raycasterRight;

// HUD
var circle, healthText, weapon;

/** var loadWorld = function()
	Fonction qui géneres tout le monde du jeu et ces commandes
	Est composée de plusieurs autres fonction
**/
var loadWorld = function(){
	
	init();	//Lance la fonction qui initialise le monde
	animation(); //Lance la fonction des animations 
	
	/**function init() 
	Fonction qui initialise les variables indispensable (La caméra, le rendue, les lumières, les controles...)
	**/
	function init() {
		
		
		container =  document.getElementById('container'); //Obtient la div dans laquelle le jeu sera déployé
		scene = new THREE.Scene();        //Crée l'espace de jeu
		
		//Charge la skybox 
		scene.background = new THREE.CubeTextureLoader()	//La skybox est généré dans un cube
		.setPath( 'textures/sor_hills/' )	//Les images de la skybox son dans ce dossiers
		.load( [	//Charge les 6 images de la skybox (nord positif/negatif, sud positif/negatif, est et oueus
			'hills_ft.jpg',
			'hills_bk.jpg',
			'hills_up.jpg',
			'hills_dn.jpg',
			'hills_rt.jpg',
			'hills_lf.jpg'
		] );
		
		//Camera
		camera = new THREE.PerspectiveCamera(fov, aspect, near, far);    //Initialise le fov, l'aspect, near et far
		camera.position.set(-20,playerHeight,0);	//Fait apparaitre la caméra a cette position
		camera.lookAt(new THREE.Vector3(0,playerHeight,0)); //Fait regarde la caméra le centre de la map lors du spawn
		camera.rotation.order = "YXZ"; // Change l'ordre de rotation de la caméra (obligatoire pour les mouvements)
		listener = new THREE.AudioListener(); //Permet d'entendre du son
		camera.add(listener); //Ajoute l'objet pour entendre des sons à la caméra
		
		//Rendue
		renderer = new THREE.WebGLRenderer();     // Crée le rendue de la scène en utilisant WebGL
		renderer.setSize(window.innerWidth, window.innerHeight - 10);   //La taille de la fenetre du rendue (Ici on utilise la largeur et la hauteur de la fenêtre)
		renderer.shadowMap.enabled = true;   // Active les ombres
		renderer.shadowMap.type  = THREE.BasicShadowMap;  // Ombre de basses qualitées pour de meilleures performances
		
		
		//Lumières
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.1 ); // Lumière ambiante
		scene.add( ambientLight );   // Ajout de la lumière dans la scène
		
		var shadowLight = new THREE.PointLight( 0xffffff, 1, 200);  // Lumière pour les ombres
		shadowLight.castShadow = true;  // Permet à la lumière de produire des ombres
		shadowLight.position.set( 0, 15, 0 );	// Position de la caméra 
		shadowLight.shadow.near = 0.1;  //Distance proche pour voir les ombres
		shadowLight.shadow.far = 30;  //Distance loingtaine pour voir les ombres
		scene.add( shadowLight );  // Ajout de la lumière dans la scène
		
		
		//Controles du joueurs
		window.addEventListener('keydown', keyDown); //Lorsque une touche du clavier est enclenchée
		window.addEventListener('keyup', keyUp); //Lorsque une touche du clavier est désenclenchée
		//window.addEventListener('mousemove', mouseMouvement); //Lorsque un mouvement de la souris est capté
		
		

		//Fenêtre de jeu
		document.body.appendChild(renderer.domElement);      //Introduit le jeu dans le html
		window.addEventListener('resize', onWindowResize, false); //Fonction pour ajuster la fenêtre en cas de resize
		
		//Fonction qui génère le jeu
		createWorld(); //Introduit les objets et modèles dans la scène
		createHUD();	//Introduit le HUD (La vie et le nombre de morts) à l'écran
		
		//Pointer Lock
		canvas = document.getElementsByTagName("canvas");	//Obtient le canvas dans lequel le rendue est fait
		canvas[0].requestPointerLock = canvas[0].requestPointerLock ||	
								canvas[0].mozRequestPointerLock ||
								canvas[0].webkitPointerLock;

		canvas[0].onclick = function() {
			canvas[0].requestPointerLock();	
		};
		//Lorsque le pointeur est bloqué ou débloqué ou lors d'un clic, appel de la fonction changeCallback
		document.addEventListener('pointerlockchange', changeCallback, false);
		document.addEventListener('mozpointerlockchange', changeCallback, false);
		document.addEventListener('webkitpointerlockchange', changeCallback, false);
		
		document.exitPointerLock = document.exitPointerLock ||
				                   document.mozExitPointerLock ||
				                   document.webkitExitPointerLock;
		document.exitPointerLock();
		
		container.appendChild( renderer.domElement );	//Ajoute le rendue dans le container HTML
        document.body.appendChild( container );	//Ajoute le container dans l'index HTML
		
	};

	/** function changeCallback()
		Fonction qui permet de bloquer le pointeur (pour une meilleur immersion) et permet de tirer des balles lors d'un click
	**/
	function changeCallback() {
	  if (document.pointerLockElement === canvas[0] ||	//Si le pointer est bloqué ou lors d'un click
		  document.mozPointerLockElement === canvas[0] ||
		  document.webkitPointerLockElement === canvas[0]
		  ) {
		//console.log('The pointer lock status is now locked');
		shoot = true;	//Permet de tirer
		document.addEventListener("mousemove", mouseMouvement, false);	//Active les mouvements de la caméra
	  } else {
		console.log('The pointer lock status is now unlocked');  	//Affiche dans le terminal que le pointer est débloqué
		document.removeEventListener("mousemove", mouseMouvement, false);	//Desactive les mouvements de la caméra
	  }
	}
	
	
	/**function keyDown(event)
		argument: event
		Fonction qui permet d'activer des variables pour permettre le déplacement du joueur
		Prend en argument l'événement d'un touche
	**/
	function keyDown(event){
		switch ( event.keyCode ) {
			case 38: // Flèche haut
			case 90: // Touche Z
				moveForward = true;	//Avancer
				break;

			case 37: // Flèche gauche
			case 81: // Touche Q
				moveLeft = true;	//Aller à gauche
				break;

			case 40: // Flèche bas
			case 83: // Touche S
				moveBackward = true;	//Reculer
				break;

			case 39: // Flèche Droite
			case 68: // Touche D
				moveRight = true;	//Aller en droite
				break;
			case 16: // Touche Shift
				sprint = true;	//Permet de sprinter
				break;
		}

	};

	
	/**function keyDown(event)
		argument: event
		Fonction qui permet de désactiver des variables de déplacement du joueur
		Prend en argument l'événement d'un touche
	**/
	function keyUp(event){
		switch ( event.keyCode ) {
			case 38: // Flèche haut
			case 90: // Touche Z
				moveForward = false;//Avancer
				break;

			case 37: // Flèche gauche
			case 81: // Touche Q
				moveLeft = false;//Aller à gauche
				break;

			case 40: // Flèche bas
			case 83: // Touche S
				moveBackward = false;//Reculer
				break;

			case 39: // Flèche Droite
			case 68: // Touche D
				moveRight = false;//Aller en droite
				break;
			case 16: // Touche Shift
				sprint = false;//Permet de sprinter
				break;
		}

	};
	
	
	/** function mouseMouvement(event)
		argument: event
		Fonction qui permet la rotation de personnage à l'aide de la souris
		Prend en argument les événements des mouvement de la souris
	**/
	function mouseMouvement(event){
		var moveX = (event.movementX             ||	//Mouvement Axe X de la souris
				 event.mozMovementX          ||
				 event.webkitMovementX       ||
				 0);
		var moveY =( event.movementY             ||	//Mouvement Axe Y de la souris
				 event.mozMovementY          ||
				 event.webkitMovementY       || 
				 0) ;
		
		//Mouvements de la caméra
		camera.rotation.y += -(moveX * playerSensibility);	//Rotation honrizontal de la caméra
		camera.rotation.x += -(moveY * playerSensibility);	//Rotation vertical de la caméra
		camera.rotation.x = THREE.Math.clamp( camera.rotation.x, - (Math.PI / 2), Math.PI / 2 );	//Permet de ne pas retourner la caméra dans la rotation vertical
	}

	/** function createHUD()
		Fonction qui va créer l'affichage du viseur, de la vie et des nombres de morts
	**/
	function createHUD(){
		circle = document.createElement("div");	//Créeation du div 
		circle.style.background = "red";	//Couleur du viseur rouge (permet une meilleure visibilité que le blanc)
		circle.style.position = "absolute";	//Position absolute pour le déplacement
		circle.style.top = window.innerHeight / 2 + "px";	//Cercle au milieur de l'écran
		circle.style.left = window.innerWidth / 2 + "px";	//Cercle au milieur de l'écran
		circle.style.height = circle.style.width = "5px";	//Cercle de 5px
		circle.style.borderRadius = "50%";	//Permet la forme du cercle
		document.body.appendChild(circle);	//Ajoute le viseur
		
		healthText = document.createElement("div");	//Variable div pour la vie et les morts
		healthText.style.position = "absolute";	//Position absolute pour le déplacement
		healthText.style.bottom = "10%";	//10% en bas de page
		healthText.style.left = "10%";	//10% à gauche de la page
		document.body.appendChild(healthText);	//Ajout de la div
	}
	
	
	/** function respawn()
		Fonction qui permet de respawn en cas de mort
	**/
	function respawn(){
		playerHealth = 100;	//Redonne 100PV
		playerDeath += 1;	//Ajoute une mort 
		var random = Math.floor(Math.random() * 3); //Nombre random entre 0 et 2 inclus pour déterminer le spawn 
		camera.position.set(spawnX[random],playerHeight,spawnZ[random]); //Place la caméra dans le jeu
	}
		
	
	/** function createWorld()
		Fonction qui charge les différents models, textures, musique, et le sol
	**/
	function createWorld(){

		
		
		//Floor
		var floor =  new THREE.Mesh(new THREE.PlaneGeometry( 200, 200, 20, 20), new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, map: new THREE.TextureLoader().load( "textures/grass.jpg" )} )); //Crée un plateau de 200x200 et lui charge une texture
		floor.rotation.x += Math.PI / 2;	//Permet de mettre le sol dans le bon sens
		floor.receiveShadow = true;	//Active la réception des ombres sur le sol
		scene.add(floor);	// Ajoute le sol dans le jeu


		// Models //
		
		//Barrière
		var fence = new THREE.ObjectLoader();	//Crée un chargeur d'objet pour les barrières
		fence.load("objects/Fence/chain-fence.json", function ( obj ) {	//Charge l'objet des barrières 
			// Donne la position, le sens et clone d'autre barrières
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
			//Ajoute les barrières dans le jeu
			scene.add( obj );
			scene.add(fence1);
			scene.add(fence2);
			scene.add(fence3);
		} );

		
		// Maisons
		
		var house = new THREE.ObjectLoader();	//Crée un chargeur d'objet pour les maisons
		house.load("objects/House/old-house.json", function (obj2){	//Charge l'objet des Maisons
			// Donne la position, le sens et clone une autre maison
			obj2.position.set(25,0,0);
			obj2.rotation.y += Math.PI / 2;
			obj2.scale.set(2.5,2.5,2.5);
			var clone = obj2.clone();
			clone.position.set(-45,0,0);
			clone.rotation.y += Math.PI;
			// Ajoute les maison dans le jeu
			scene.add(obj2);
			scene.add(clone);
		});
		
		//Crée les collisions des maisons
		var houseCollider = new THREE.Mesh(new THREE.BoxGeometry(21,10,20.4), new THREE.MeshBasicMaterial({wireframe: true}));
		//new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0}
		//Normalement le Collider devrait invisible mais lorsque c'est le cas cela produit des erreurs de blending
		houseCollider.position.set(25,playerHeight,0);
		scene.add(houseCollider);
		var houseCollider2 = houseCollider.clone();
		houseCollider2.position.set(-45,0,0);
		scene.add(houseCollider2);
		
		
		
		
		//Camion      !!!!!!!!!!! Il se peut que l'objet ne charge pas sur Google Chrome pour des raisons inconnues
		
		var truck = new THREE.ObjectLoader();//Crée un chargeur d'objet du camion
		truck.load("objects/Truck/truck.json", function(obj3){	//Charge l'objet du camion
			// Donne la position, le sens et ajoute le camion
			obj3.position.set(-10,0,0);
			obj3.rotation.y += Math.PI / 2 + 50;
			obj3.scale.set(0.1,0.1,0.1);
			scene.add(obj3);
		});
		//Crée la collision du camion
		var truckCollider = new THREE.Mesh(new THREE.BoxGeometry(6,10,34), new THREE.MeshBasicMaterial({wireframe: true}));
		//new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0}
		//Normalement le Collider devrait invisible mais lorsque c'est le cas cela produit des erreurs de blending
		truckCollider.position.set(-10,0,0);
		truckCollider.rotation.y += 50;
		scene.add(truckCollider);
		
		//Sons du jeu (bruitages et musique d'ambiance)
		var ambientSound = new THREE.Audio(listener); //L'objet qui contient la musique d'ambiance
		scene.add(ambientSound); //Ajout de l'objet dans la scnène
		
		var loaderAmbientSound = new THREE.AudioLoader(); //Le loader de la musique d'ambiance
		loaderAmbientSound.load(
		'audio/ambientSound.mp3',
		function ( audioBuffer ) {
			ambientSound.setBuffer( audioBuffer );	//Buffer
			ambientSound.setLoop(true);	//Répete l'audio
			ambientSound.setVolume(0.1);	//Volume de l'audio
			ambientSound.play();	//Joue l'audio
		});
		
		// Weapon
	
		var weaponLoader = new THREE.ObjectLoader();
		weaponLoader.load("objects/AK47/AK47.json", function(objAk){
			weapon = objAk;
			weapon.scale.set(0.005,0.005,0.005);
			weapon.rotation.y += Math.PI - 25;
			camera.add(weapon);
			scene.add(camera);
			weapon.position.set(0.15,-0.05,-0.15);
		});
		
		
		walkingSound = new THREE.Audio(listener); //L'objet contenant le bruitages des bruits de pas
		scene.add(walkingSound);//Ajout de l'objet dans la scnène
		
		
		raycasterFront = new THREE.Raycaster();
		raycasterBack = new THREE.Raycaster();
		raycasterLeft = new THREE.Raycaster();
		raycasterRight = new THREE.Raycaster();
		
		
	}

	/** function animation()
		Fonction pour l'animation du jeu toute les 60 images pas secondes
		Gères le déplacement, le tire, les collisions, la santé du joueur, et l'animation du HUD
	**/
	function animation(){
		requestAnimationFrame(animation);	//Exécute la fonction toutes les 60 images pas secondes
		
		//Collision Bordure de map
		var limite = 80;	// La map à pour largeur et longeur -80 à 80
		
		if(camera.position.x < -limite || camera.position.x > limite){
			camera.position.x = THREE.Math.clamp( camera.position.x, - limite, limite );	//Permet au joueur de rester dans les limites de -80/80 en largeur
		}
		if(camera.position.z < -limite || camera.position.z > limite){
			camera.position.z = THREE.Math.clamp( camera.position.z, - limite, limite );	//Permet au joueur de rester dans les limites de -80/80 en longeur
		}
		if(camera.position.y < playerHeight || camera.position.y > playerHeight){
			camera.position.y = THREE.Math.clamp( camera.position.y, playerHeight, playerHeight );	//Permet au joueur de ne pas voler ni tomber en dessous du sol
		}
		
		//Controles pour les mouvements du joueurs, le tir de l'arme et les dégats encaissés
		if(moveForward && !sprint){
			camera.translateZ(-playerSpeed);	//Si la variable moveForward est activer le joueur avance
		}
		if(moveForward && sprint){
			camera.translateZ(-playerSprint);	//Si la variable moveForward et sprint est activer le joueur avance en courant
		}
		if(moveBackward){
			camera.translateZ(playerSpeed);	//Si la variable moveBackward est activer le joueur recule 
		}
		if(moveLeft){
			camera.translateX(-playerSpeed);	//Si la variable moveLeft est activer le joueur va sur sa gauche
		}
		if(moveRight){
			camera.translateX(playerSpeed);	//Si la variable moveRight est activer le joueur va sur sa droite
		}
		if(shoot){	//Si la variable shoot est activé
			var bullet = new THREE.Mesh(
			new THREE.SphereGeometry(0.05,8,8),
			new THREE.MeshBasicMaterial({color:0xfff000})
			);	//Crée une balle rounde de couleur jaune (pour une meilleur visibilité
			bullet.position.set(
			camera.position.x ,
			camera.position.y ,
			camera.position.z 
			);	// Attribut une position a la balle égale à la caméra (pour que la balle parte du centre de l'écran)
			bullet.rotation.set(
			camera.rotation.x,
			camera.rotation.y,
			camera.rotation.z
			);	//Attribut une rotation à la balle égale à celle de la caméra (pour que la balle parte dans la même direction que la caméra)
			shoot = false;	//Désactiver la variable shoot pour obliger le joueur à toujour clicker pour tirer
			
			bullets.push(bullet);	//Ajoute l'objet de la balle dans le tableau bullets (pour gérer son déplacement)
			scene.add(bullet);	//Ajoute la balle dans la scène
		}
		
		//Dégats des balles énnemies (!!!!!!!! Impossible d'afficher sur l'ecran les balles de l'aversaires)
		if(bulletsOtherX.length > 0){	// Si un adversaire (au minimum) à tirer
			for(let i =0; i < bulletsOtherX.length; i++){	
				if( bulletsOtherX[i][0] === undefined)	//Si l'un des adversaires n'a pas déja tirer on passe au suivant
					continue;
				for(let u =0; u < bulletsOtherX[i].length; u++){
					if(bulletsOtherX[i][u] === null || bulletsOtherY[i][u] === null || bulletsOtherZ[i][u] === null)	// Si l'une des positions est nul on passe à la balle suivantante (pour éviter les bugs) 
						continue;
					if((bulletsOtherX[i][u] < camera.position.x + 1 && bulletsOtherX[i][u] > camera.position.x - 1 ) && (bulletsOtherY[i][u] > 0 && bulletsOtherY[i][u] < 2.2) && (bulletsOtherZ[i][u] < camera.position.z + 1 && bulletsOtherZ[i][u] > camera.position.z - 1 ))
					   playerHealth -= 5;	//Si la balle nous touche, elle nous enleve de la vie
				}
			}
		}
		
		//Déplacement des balles
		for(let i = 0; i < bullets.length; i++){
			if(bullets[i] === undefined)	//Pour éviter les bugs
				continue;
			if(bullets[i].position.z < -limite || bullets[i].position.x < -limite || bullets[i].position.z > limite ||bullets[i].position.z > limite ||bullets[i].position.y > limite ||bullets[i].position.y < -limite){
				scene.remove(bullets[i]);	
				bullets.splice(i,1);
				continue;	// Si la balle dépacent les limites on les enlèves de la scène et on les supprimes du tableau bullets
			}
			bulletsX[i] = bullets[i].position.x;	
			bulletsY[i] = bullets[i].position.y;
			bulletsZ[i] = bullets[i].position.z;
			//Donne la position X,Y et Z pour que les adversaires les sachent
			bullets[i].translateZ(-0.5);	// Fait bouger les balles
		
		}
		
		
		
			//// Collisions avec les objets de la map  ////
	
		var originPoint = camera.position.clone(); //Clone la position de la camera
	
		//Front
		var directionFront = new THREE.Vector3();	//Crée un nouveau verteur de 3 éléments
		camera.getWorldDirection(directionFront);	//Copie la direction de la direction de la caméra
		raycasterFront.set(originPoint, directionFront);	//Prend comme direction le devant de la caméra
		var intersectsFront = raycasterFront.intersectObjects(scene.children);	//Intercepte tout les objets de la scène
		// Si collision avec un objet, arrete les mouvements du joueurs
		if(intersectsFront.length > 0){
			for(var i = 0; i < intersectsFront.length; i++){
				if(intersectsFront[i].distance < 0.5){
					if(moveForward && !sprint){
						camera.translateZ(playerSpeed);
					}
					if(moveForward && sprint){
						camera.translateZ(playerSprint);
					}
					if(moveBackward){
						camera.translateZ(-playerSpeed);
					}
					if(moveLeft){
						camera.translateX(playerSpeed);
					}
					if(moveRight){
						camera.translateX(-playerSpeed);
					}
				}
			}
		}
		
		//Back
		var directionBack = new THREE.Vector3();	//Crée un nouveau verteur de 3 éléments
		directionBack.copy(directionFront);	//Copie la direction de la camera
		//Permet d'avoir la direction de l'arriere de la caméra
		directionBack.x = (-directionBack.x)
		directionBack.z = (-directionBack.z)
		raycasterBack.set(originPoint, directionBack);//Prend comme direction l'arriere de la caméra
		var intersectsBack = raycasterBack.intersectObjects(scene.children);	//Intercepte tout les objets de la scène
		// Si collision avec un objet, arrete les mouvements du joueurs
		if(intersectsBack.length > 0){
			for(var i = 0; i < intersectsBack.length; i++){
				if(intersectsBack[i].distance < 0.5){
					if(moveForward && !sprint){
						camera.translateZ(playerSpeed);
					}
					if(moveForward && sprint){
						camera.translateZ(playerSprint);
					}
					if(moveBackward){
						camera.translateZ(-playerSpeed);
					}
					if(moveLeft){
						camera.translateX(playerSpeed);
					}
					if(moveRight){
						camera.translateX(-playerSpeed);
					}
				}
			}
		}
		
		//Left 
		var directionLeft = new THREE.Vector3();	//Crée un nouveau verteur de 3 éléments
		directionLeft.copy(directionFront);	//Copie la direction de la camera
		// Permet d'avoir la direction de la caméra sur sa gauche
		if((directionLeft.x < 0 && directionLeft.z > 0) || (directionLeft.x > 0 && directionLeft.z < 0)){
			directionLeft.x = (-directionLeft.x);
		}
		if((directionLeft.x > 0 && directionLeft.z > 0) || (directionLeft.x < 0 && directionLeft.z < 0)){
			directionLeft.z = (-directionLeft.z);
		}
		raycasterLeft.set(originPoint, directionLeft);	//Prend comme direction la gauche de la caméra
		var intersectsLeft = raycasterLeft.intersectObjects(scene.children);	//Intercepte tout les objets de la scène
		// Si collision avec un objet, arrete les mouvements du joueurs
		if(intersectsLeft.length > 0){
			for(var i = 0; i < intersectsLeft.length; i++){
				if(intersectsLeft[i].distance < 0.5){
					if(moveForward && !sprint){
						camera.translateZ(playerSpeed);
					}
					if(moveForward && sprint){
						camera.translateZ(playerSprint);
					}
					if(moveBackward){
						camera.translateZ(-playerSpeed);
					}
					if(moveLeft){
						camera.translateX(playerSpeed);
					}
					if(moveRight){
						camera.translateX(-playerSpeed);
					}
				}
			}
		}
		
		
		//Right
		var directionRight = new THREE.Vector3();	//Crée un nouveau verteur de 3 éléments
		directionRight.copy(directionFront);	//Copie la direction de la camera
		// Permet d'avoir la direction de la caméra sur sa droite
		if((directionRight.x < 0 && directionRight.z > 0) || (directionRight.x > 0 && directionRight.z < 0)){
			directionRight.z = (-directionLeft.z);
		}
		if((directionLeft.x > 0 && directionLeft.z > 0) ||(directionLeft.x < 0 && directionLeft.z < 0)){
			directionRight.x = (-directionRight.z);
		}
		raycasterRight.set(originPoint, directionRight);	//Prend comme direction la droite de la caméra
		var intersectsRight = raycasterRight.intersectObjects(scene.children);	//Intercepte tout les objets de la scène
		// Si collision avec un objet, arrete les mouvements du joueurs
		if(intersectsRight.length > 0){
			for(var i = 0; i < intersectsRight.length; i++){
				if(intersectsRight[i].distance < 0.5){
					if(moveForward && !sprint){
						camera.translateZ(playerSpeed);
					}
					if(moveForward && sprint){
						camera.translateZ(playerSprint);
					}
					if(moveBackward){
						camera.translateZ(-playerSpeed);
					}
					if(moveLeft){
						camera.translateX(playerSpeed);
					}
					if(moveRight){
						camera.translateX(-playerSpeed);
					}
				}
			}
		}
		
		// Si la variable du Player est initialisé (pour évité des bug lors du chargement des models)
		if(player){
			givePosition();	//Transmet les coordonnées de notre personnages aux autres joueurs
		}
		
		// Met à jour le HUD
		if(playerHealth < 1)
			respawn();	// Si plus de vie, fait respawn le joueur
		healthText.innerHTML = "<span style='color: red; font-size: 50px'>Vie: " +  playerHealth + "<br />Mort: "+ playerDeath + "</span>";	//Met à jour l'affichage de la vie et des nombres de vies
		
		renderer.render(scene, camera);	//Fait le rendue de la scène
	}


	/**	function onWindowResize()
		Fonction pour réajuste la taille de la scène lors d'un changement de taille de la fênetre
	**/
	function onWindowResize() {
		  camera.aspect = window.innerWidth / window.innerHeight;	//Donne de nouvelle coordonnées à l'aspect de la caméra
			camera.updateProjectionMatrix();	//Met à jour la projection de la caméra
			circle.style.top = window.innerHeight / 2 + "px";	//Réajuste la taille du viseur
			circle.style.left = window.innerWidth / 2 + "px";	//Réajuste la taille du viseur
			renderer.setSize( window.innerWidth, window.innerHeight );	//Donne une nouvelle taille au rendue
	}

}



////// Fonction pour le fonctionnement du MultiJoueurs /////


/**	var createPlayer = function(data)
	argument: data
	Prend la data créer dans le fichier server_world.js et l'attribue à un objet3D
**/
var createPlayer = function(data){
	playerData = data;	//Copie la data pour pouvoir la modifier et la mettre à jour lors des déplacements
	player = new THREE.Object3D();	//Crée un objet3D pour notre joueur, pour transmettre les données aux autres joueurs
	player.rotation.set(0,0,0);	// Rotation du joueur 
	player.position.x = data.x - 0.2;	//Position x du joueur (-0.2 pour gerer le skin)
	player.position.y = data.y;	//Position y du joueur 
	player.position.z = data.z;	//Position z du joueur 
	player.rotation.y -= Math.PI;	//Pivotre le joueur à 180 degrés (pour le skin)
	playerId = data.playerId;	//Ajoute l'id de notre joueurs
	objects.push(player);	//Ajoute le joueurs dans le tableau objects
	scene.add(player);	//Ajoute le joueur à la scene
}

/**	var createPlayer = function(data)
	argument: data
	Prend la data d'un adversaire créer dans le fichier server_world.js et met a jour les données du joueur adversaire concerné
**/
var updatePlayer = function(data){
	var somePlayer = findPlayer(data.playerId); 	//Trouve le joueur 
	//MAJ de la position et de la rotation
	somePlayer.position.x = data.x;
    somePlayer.position.y = data.y;
    somePlayer.position.z = data.z;
    somePlayer.rotation.x = data.r_x;
    somePlayer.rotation.y = data.r_y;
    somePlayer.rotation.z = data.r_z;
	
	//Permet de gerer la position des balles de l'adversaires pour faire des dégats à notre joueur
	var somePlayerId;
	for(let i = 0; i < otherPlayersId.length; i++){
		if(otherPlayersId[i] == data.playerId){
			somePlayerId = i;
		}
	}
	
	if(data.bulletsXPlayer.length > 0){
		for(let i = 0; i < data.bulletsXPlayer.length; i++){
			bulletsOtherX[somePlayerId][i] = data.bulletsXPlayer[i];
			bulletsOtherY[somePlayerId][i] = data.bulletsYPlayer[i];
			bulletsOtherZ[somePlayerId][i] = data.bulletsZPlayer[i];
		}
	}
}


/**	var updatePlayerData = function()
	Met a jour la data de notre joueur pour l'emmètre aux autres joueurs
	On modifie les donées de position, rotations et les positions des différentes balles que l'on à tirer
**/
var updatePlayerData = function(){
    playerData.x = player.position.x;
    playerData.y = player.position.y;
    playerData.z = player.position.z;

    playerData.r_x = player.rotation.x;
    playerData.r_y = player.rotation.y;
    playerData.r_z = player.rotation.z;
	
	playerData.bulletsXPlayer = bulletsX;
	playerData.bulletsYPlayer = bulletsY;
	playerData.bulletsZPlayer = bulletsZ;
}

/** var givePosition = function()
	Donne la position de notre personnage aux autres joueurs
**/
	
var givePosition = function(){
	if(moveBackward  || moveLeft || moveRight || moveForward){
		//Si il y un mouvement, on modifie la position du player par rapport a la caméra
		player.position.x = camera.position.x - 0.2;
		player.position.z = camera.position.z;
	}
	player.rotation.y = camera.rotation.y - (Math.PI / 2);	//On modifie la rotation du personnage pas rapport à la caméra ( - (Math.PI / 2) pour une bonne rotation du skin
	updatePlayerData();	//On met à jour les données data
	socket.emit('updatePosition', playerData);	//On envoie les données aux autres joueurs
}


/** var addOtherPlayer = function(data)
	argument: data
	Prend la data d'un joueur adversaires et crée un objet pour l'ajouter à notre scène
**/
var addOtherPlayer = function(data){
	var otherPlayerLoader = new THREE.ObjectLoader();	//Loader du model de l'adversaire 
	var otherPlayer;	//La variable du joueur adversaire
	otherPlayerLoader.load("objects/Character/steve.json", function(obj6){	//Charge le model
		//Attribue la position, la taille du joueur 
		otherPlayer = obj6;
		otherPlayer.position.x = data.x;
		otherPlayer.position.y = data.y;
		otherPlayer.position.z = data.z;
		otherPlayer.scale.set(0.3,0.3,0.3);
		//Ajoute le joueurs, l'id dans différents tableaux
		otherPlayersId.push(data.playerId);
		otherPlayers.push(otherPlayer);
		objects.push(otherPlayer);
		scene.add(otherPlayer);	//Ajoute le joueur dans la scène
	});
}

/** var removeOtherPlayer = function(data)
	Retire le joueur advairse de la scène lors de sa déconnection
**/	
var removeOtherPlayer = function(data){
    scene.remove( findPlayer(data.playerId) );
};

/** var findPlayer = function(id)
	argument: id
	Trouve le joueur concercé par l'id en arguments
**/
var findPlayer = function(id){
	var index;
	for(var i = 0; i < otherPlayersId.length; i++){
		if(otherPlayersId[i] == id){
			index = i;
			break;
		}
	}
	return otherPlayers[index];
}

