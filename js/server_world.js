var players = [];    //Liste de tout les joueurs


/** function Player()
	Fonction qui attribue les valeurs (comme positions ou encore la rotation) au joueurs
	Appelé lors de la création du joueurs
**/
function Player(){

    this.playerId = players.length;	//Atribue un id
    this.x = -20;	//position.x
    this.y = 0;	//position.y
	this.z = 0;	//position.z
    this.r_x = 0; 	//rotation.x
    this.r_y = 0;	//rotation.y	
    this.r_z = 0;	//rotation.z
	this.bulletsXPlayer = [];	//position.x des balles
	this.bulletsYPlayer = [];	//position.y des balles
	this.bulletsZPlayer = [];	//position.z des balles

}

/** var addPlayer = function(id)
	argument: id
	Ajoute un id déclarer dans app.js
	Ajoute le joueur dans la liste players
	return: le joueur créer
**/
var addPlayer = function(id){

    var player = new Player();	//Creer un nouveau joueur
    player.playerId = id;	//Attribue l'id de socket.io
    players.push( player );	//Ajoute le joueur dans la liste players[]

    return player;
};



/**var removePlayer = function(player)
	argument: player
	Cherche le joueur en argument dans la liste player pour le retirer
**/
	
var removePlayer = function(player){

    var index = players.indexOf(player);	//Trouve le joueur concerné

    if (index > -1) {
        players.splice(index, 1);	//Retire le joueur
    }
};



/**var updatePlayerData = function(data)
	argument: data
	Met a jour les données du joueur concerné grace a ces nouvelles données de l'argument data
	Return le joueur avec ces nouvelle données 
	return: player
**/
var updatePlayerData = function(data){
    var player = findPlayer(data.playerId);	//Trouve le joueur concerné
    player.x = data.x;	//MAJ de position.x    
	player.y = data.y;	//MAJ de position.y
    player.z = data.z;	//MAJ de position.z   
    player.r_x = data.r_x;	//MAJ rotation.x
    player.r_y = data.r_y;	//MAJ rotation.y
    player.r_z = data.r_z;	//MAJ rotation.z
	player.bulletsXPlayer = data.bulletsXPlayer;	//MAJ position.x des balles
	player.bulletsYPlayer = data.bulletsYPlayer;	//MAJ position.y des balles
	player.bulletsZPlayer = data.bulletsZPlayer;	//MAJ position.z des balles
    return player;
};


/** var findPlayer = function(id)
	argument: id
	Prend un id en argument et return le joueur concerné
	return: player
**/
var findPlayer = function(id){

    var player;
    for (var i = 0; i < players.length; i++){
        if (players[i].playerId === id){

            player = players[i];
            break;

        }
    }

    return player;
};



//Modules exportées pour être utilisé dans client_world.js
module.exports.players = players;
module.exports.addPlayer = addPlayer;
module.exports.removePlayer = removePlayer;
module.exports.updatePlayerData = updatePlayerData;
module.exports.findPlayer = findPlayer;