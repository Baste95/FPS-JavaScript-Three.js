var app = require('express')();   //Envoie les données aux serveur
var http = require('http').Server(app);  //Créer un serveur local
var io = require('socket.io')(http);	// Permet le broadcast
var world = require('./js/server_world');  //Fonction serveur du jeu


///// Fichiers JS et HTML /////

// Index html
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');	
});

// Bibliotheque THREE js
app.get('/js/three.min.js', function(req, res){
	res.sendFile(__dirname + '/js/three.min.js');
});

// Fichier client_world.js (fichier ou est définie le monde)
app.get('/js/client_world.js', function(req, res){
	res.sendFile(__dirname + '/js/client_world.js');
});



///// Models, Textures, Audios et Skybox du jeu /////


// Barrières 
app.get('/objects/Fence/chain-fence.json', function(req, res){
	res.sendFile(__dirname + '/objects/Fence/chain-fence.json');
});


// Maison 
app.get('/objects/House/old-house.json', function(req, res){
	res.sendFile(__dirname + '/objects/House/old-house.json');
});

app.get('/objects/House/List_1_dom_derevnja.jpg', function(req, res){
	res.sendFile(__dirname + '/objects/House/List_1_dom_derevnja.jpg');
});

app.get('/objects/House/List_2_dom_derevnja.jpg', function(req, res){
	res.sendFile(__dirname + '/objects/House/List_1_dom_derevnja.jpg');
});

app.get('/objects/House/List_3_dom_derevnja.jpg', function(req, res){
	res.sendFile(__dirname + '/objects/House/List_1_dom_derevnja.jpg');
});

// Camion
app.get('/objects/Truck/truck.json', function(req, res){
	res.sendFile(__dirname + '/objects/Truck/truck.json');
});

// Personnage
app.get('/objects/Character/steve.json', function(req, res){
	res.sendFile(__dirname + '/objects/Character/steve.json');
});

app.get('/objects/Character/steve.png', function(req, res){
	res.sendFile(__dirname + '/objects/Character/steve.png');
});



// Skybox
app.get('/textures/sor_hills/hills_ft.JPG', function(req, res){
	res.sendFile(__dirname + '/textures/sor_hills/hills_ft.JPG');
});

app.get('/textures/sor_hills/hills_bk.JPG', function(req, res){
	res.sendFile(__dirname + '/textures/sor_hills/hills_bk.JPG');
});

app.get('/textures/sor_hills/hills_up.JPG', function(req, res){
	res.sendFile(__dirname + '/textures/sor_hills/hills_up.JPG');
});

app.get('/textures/sor_hills/hills_dn.JPG', function(req, res){
	res.sendFile(__dirname + '/textures/sor_hills/hills_dn.JPG');
});

app.get('/textures/sor_hills/hills_rt.JPG', function(req, res){
	res.sendFile(__dirname + '/textures/sor_hills/hills_rt.JPG');
});

app.get('/textures/sor_hills/hills_lf.JPG', function(req, res){
	res.sendFile(__dirname + '/textures/sor_hills/hills_lf.JPG');
});


// Texture du sol
app.get('/textures/grass.jpg', function(req, res){
	res.sendFile(__dirname + '/textures/grass.jpg');
});


// Musique d'ambiance
app.get('/audio/ambientSound.mp3', function(req, res){
	res.sendFile(__dirname + '/audio/ambientSound.mp3');
});

// Arme
app.get('/objects/AK47/AK47.json', function(req, res){
	res.sendFile(__dirname + '/objects/AK47/AK47.json');
});

app.get('/objects/AK47/wood.jpg', function(req, res){
	res.sendFile(__dirname + '/objects/AK47/wood.jpg');
});
 



///// Connection //////


io.on('connection', function(socket){		//Fonctions qui vont se lancé lors de la connection
	console.log("A user is connected.");	//Ecrit "A user is connected" dans le terminal node
	
	var id = socket.id;	//Attribue un id lors de la connection
	world.addPlayer(id); //Ajoute le joueur dans la liste des jouers du serveur
	
	var player = world.findPlayer(id);	//Renvoie le joueur précédement créer
	socket.emit('createPlayer', player);	// Créer le joueur dans le fichier server_world.js
	
	socket.broadcast.emit('addOtherPlayer', player);	//Ajoutee les joueurs qui se connectent dans le fichier server_world.js
	
	socket.on('requestOldPlayers', function(){	// Cherche si des joueurs étaient déjà connectés
		    for (var i = 0; i < world.players.length; i++){
            if (world.players[i].playerId != id)
                socket.emit('addOtherPlayer', world.players[i]);	//Ajoutent les déjà connectés dans le fichier server_world.js
        }
    });
	
	socket.on('updatePosition', function(data){	// A chaque fois que la fonction updatePosition() à lieu met à jour les positions du joueur concerné dans le fichier server_world.js
        var newData = world.updatePlayerData(data);
        socket.broadcast.emit('updatePosition', newData);
    });
	
	socket.on('disconnect', function(){		// Supprime le joueur lors de sa déconnections
		console.log("A user is disconnected.");//Ecrit "A user is disconnected" dans le terminal node
		io.emit('removeOtherPlayer', player);
        world.removePlayer( player );
	});
});

	

http.listen(3000, function(){	// Adresse du jeu http://localhost:3000/
	console.log("Listening to port 3000");
});
