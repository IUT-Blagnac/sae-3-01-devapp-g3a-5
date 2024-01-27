/////////////////////////////////////
/////////////////////////////////////
//Déclaration de variables globales//
/////////////////////////////////////
/////////////////////////////////////

let lectureDonneesEnCours = false;
let rotationJoueurs = 0;
let joueursCaches = true;
let rotationCheckpoints = 0;
let CheckpointsCaches = true;
var listNodeWithColor = {};

// Le listNodeWithColor est de la forme
// [0:{node: "0xFD24", targets: ["0x35A1", "0x2EF4", "0x8C05", "0x907D", "0xBA89"], times: [23.0, 0.0, 0.0, 0.0, 0.0], couleur: "#FFFFFF"}]
// Nous voulons le passer à la forme
// {"0xFD24": {targets: ["0x35A1", "0x2EF4", "0x8C05", "0x907D", "0xBA89"], times: [23.0, 0.0, 0.0, 0.0, 0.0], couleur: "#FFFFFF"}}



/////////////////////////
/////////////////////////
//Lecture du port série//
/////////////////////////
/////////////////////////

async function lirePortSerie() {
  try {
    const port = await navigator.serial.requestPort(); // Demande la permission d'accéder au port série    
    await port.open({ baudRate: 115200, dataBits: 8, stopBits: 1 }); // Ouvre le port série avec la configuration souhaitée  
    // Configure le décodeur pour convertir les données JSON
    const decoder = new TextDecoderStream('utf-8');
    const readableStreamClosed = port.readable.pipeTo(decoder.writable);
    const textStreamReader = decoder.readable.getReader();
    let partialData = ''; // Stockage temporaire pour les fragments de données
    // Lis les données en continu
    while (true) {
      const { value, done } = await textStreamReader.read();
      if (done) {
        console.log('Décodage terminé !');
        break;
      }
      partialData += value; // Concatène les fragments de données
      console.log(partialData);
      const lines = partialData.split('\n'); // Sépare les données en lignes
      // Traite chaque ligne (sauf la dernière, potentiellement incomplète)
      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const jsonData = JSON.parse(lines[i]); // Convertit la ligne en objet JSON
          const nodeExistante = jsonData.node in listNodeWithColor;

          if (!nodeExistante) {
            // Ajoute un attribut "couleur" avec une couleur générée
            jsonData.couleur = genererCouleur();
          }

          jsonData.lastUpdate = Date.now();
          listNodeWithColor[jsonData.node] = jsonData;

          localStorage.setItem('listNodeWithColor', JSON.stringify(listNodeWithColor));
          
        } catch (jsonError) {
          console.error('Erreur lors de l\'analyse JSON :', jsonError);
        }
        partialData = lines[lines.length - 1]; // Garde le dernier fragment potentiellement incomplet
      }
    }
    textStreamReader.releaseLock(); // Ferme les flux après la lecture
    await readableStreamClosed;
  }
  catch (error) {
    console.error('Erreur lors de la demande ou de l\'ouverture du port série :', error);
  }
};



////////////////////////////////
////////////////////////////////
//Fonctionnalités pour l'admin//
////////////////////////////////
////////////////////////////////

////////////////////////////////////////////////////
//Fonctions en continu (bon fonctionnement du jeu)//
////////////////////////////////////////////////////

/** Initialisation interface
 * Dès le chargement du l'interface administrateur, on construit les tableaux de toutes les équipes qui ont eu le temps de se connecter. 
 */
window.addEventListener('load', function () {
  if (window.location.href.includes("IHM_admin.php")) {
    let cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
    verifierDeconnection();
    for (const joueur in cacheCacheData) {
      createTableau(cacheCacheData[joueur]);
    }
  }
});

/** 
 * Met à jour le jeu dès qu'un changement est détecté dans les équipes contenues dans le local storage
 */
window.addEventListener("storage", function (event) {
  if (event.key === "listNodeWithColor") {
    const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

    //activatedModal();

    for (let joueurId in cacheCacheData) {
      var joueur = cacheCacheData[joueurId]

      if(isEquipeDeconnectee(joueur.node)){
        gererReconnection(joueur.node);
      }

      //C'est une nouvelle équipe
      if (!(joueur.node in listNodeWithColor)) {
        console.log("Nouvelle équipe : " + joueur.node)
        createTableau(joueur);
        joueur.lastUpdate = Date.now();
      }

      //C'est une maj
      else if (!arraysEqual(joueur.times, listNodeWithColor[joueur.node].times)) {

        console.log(joueur.node + " : " + joueur.times.filter(temps => temps > 0).length + "/" + getNbCheckpoints())
        joueur.lastUpdate = Date.now();
        modifierTableau(joueur);
        updatePopup(joueur, joueur.times.filter(temps => temps > 0).length);
      }
      
      
    }

    listNodeWithColor = cacheCacheData;
  }
});

////////////////////
//Pour les pop-ups//
////////////////////

function updatePopup(jsonData, nbBalises){

  jsonData = JSON.parse(JSON.stringify(jsonData));
  let contenu = "";

  if(nbBalises == Math.round(getNbCheckpoints()/2)){
    contenu = "L'équipe " + jsonData.node + " a trouvé la moitié des trésors !";
    afficherPopup(contenu, true);
  }
  else if(nbBalises == getNbCheckpoints()){
    contenu = "L'équipe " + jsonData.node + " a fini le jeu !";
    afficherPopup(contenu, true);
  }
}

function afficherPopup(contenu, auto) {

  if (!auto) {
    contenu = prompt("Veuillez saisir votre message :")
  }

  localStorage.setItem("popupContent", contenu);
}

window.addEventListener("storage", function (event) {
  if (event.key === "popupContent") {
    var popup = document.getElementById("popup");
    var popupContent = document.getElementById("popupContent");

    // Affichez la popup avec le contenu du localStorage
    if(localStorage.getItem("popupContent") != ""){
      popupContent.innerHTML = localStorage.getItem("popupContent");
      popup.style.display = "block";
      popup.style.animation = "deplacementInformation 5s";
    }
    
    setTimeout(function () {
      popup.style.display = "none";
    }, 5000);
  }
});

/////////////////////////////////
//Gérer les tableaux des noeuds//
/////////////////////////////////

function createTableau(jsonData) {
  
  //Anomalie, un noeud n'a pas de couleur, on en génère une et on modifie le localStorage
  if(!jsonData.couleur){
    jsonData.couleur = genererCouleur();
    listNodeWithColor[jsonData.node] = jsonData;
    localStorage.setItem('listNodeWithColor', JSON.stringify(listNodeWithColor));
  }

  const obj1 = JSON.parse(JSON.stringify(
    jsonData
  ));

  //On vérifie que le tableau n'existe pas déjà, au cas où 
  if (!document.getElementById(obj1.node)) {
    $nbIndex = getNbCheckpoints();

    var tbl = document.createElement("table");
    tbl.id = obj1.node;

    //Ligne labels
    var rowLabels = document.createElement("tr");

    var cellNoeud = document.createElement("td");
    cellNoeud.classList.add("equipe");
    
    if (isCouleurClaire(obj1.couleur)) {
      cellNoeud.style.color = "#242729";
    }
    cellNoeud.style.setProperty("background-color", obj1.couleur);
    cellNoeud.rowSpan = $nbIndex + 1;
    cellNoeud.textContent = "Noeud " + obj1.node;
    rowLabels.appendChild(cellNoeud);

    var cellCheckpoint = document.createElement("td");
    cellCheckpoint.classList.add("label");
    cellCheckpoint.textContent = "Id Checkpoint";
    rowLabels.appendChild(cellCheckpoint);

    var cellTrouve = document.createElement("td");
    cellTrouve.classList.add("label");
    cellTrouve.textContent = "Trouvé ?";
    rowLabels.appendChild(cellTrouve);

    var cellTemps = document.createElement("td");
    cellTemps.classList.add("label");
    cellTemps.textContent = "Temps (s)";
    rowLabels.appendChild(cellTemps);

    tbl.appendChild(rowLabels);


    //Contenu checkpoints
    for (var i = 0; i < $nbIndex; i++) {
      var rowCheckpoint = document.createElement("tr");

      //ID CHECKPOINT 
      var cellCheckpoint = document.createElement("td");
      cellCheckpoint.id = obj1.node + obj1.targets[i];
      cellCheckpoint.textContent = obj1.targets[i];
      rowCheckpoint.appendChild(cellCheckpoint);

      //ICON TROUVE
      var cellTrouve = document.createElement("td");
      cellTrouve.id = obj1.node + obj1.targets[i] + ".icon";
      if (obj1.times[i] > 0) {
        cellTrouve.innerHTML = '<img class="icon" src="assets/images/check.png"></img>';
      }
      rowCheckpoint.appendChild(cellTrouve);

      //TEMPS
      var cellTemps = document.createElement("td");
      cellTemps.id = obj1.node + obj1.targets[i] + ".time";
      cellTemps.textContent = (obj1.times[i] > 0) ? obj1.times[i] : "--:--";
      rowCheckpoint.appendChild(cellTemps);

      tbl.appendChild(rowCheckpoint);
    }

    //Afficher tableau
    var tabEquipesDiv = document.getElementById("tabEquipes");
    tabEquipesDiv.appendChild(tbl);
  }
  else {
    if (!arraysEqual(obj1.times, listNodeWithColor[obj1.node].times)){
      modifierTableau(jsonData)
    }
    
  }
}

function modifierTableau(jsonData) {
  const obj1 = JSON.parse(JSON.stringify(jsonData));

  $nbIndex = getNbCheckpoints();

  for (var i = 0; i < $nbIndex; i++) {
    var cellTemps = document.getElementById(obj1.node + obj1.targets[i] + ".time");
    var cellIcon = document.getElementById(obj1.node + obj1.targets[i] + ".icon");

    if (cellTemps && cellIcon) {
      cellTemps.textContent = (obj1.times[i] > 0) ? obj1.times[i] : "--:--";
      if (obj1.times[i] > 0) {
        cellIcon.innerHTML = '<img class="icon" src="assets/images/check.png"></img>';
      }
    }
  }
}


////////////////////////////////////
//Gérer les connections des noeuds//
////////////////////////////////////

async function verifierDeconnection() {
  setInterval(() => {
    const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
    const currentTime = Date.now();

    for (const joueurId in cacheCacheData) {
      const joueurData = cacheCacheData[joueurId];

      if (!isEquipeDeconnectee(joueurData.node) && (currentTime - joueurData.lastUpdate) / 1000 > 7) {
        gererDeconnection(joueurData.node);
      }
    }
  }, 1000);
}


/**
* Change l'apprence du noeud hors-connexion et informe les joueurs.
* 
* @param {*} id du noeud déconnectée
*/
function gererDeconnection(id) {
  let popup = "L'équipe " + id + " est déconnectée !";
  console.log(popup);
  afficherPopup(popup, true)

  
  document.getElementById(id).classList.add("deconnecte");

  //Modifier pion sur interface user ?
}

/**
* Change l'apprence du noeud hors-connexion et informe les joueurs.
* 
* @param {*} id du noeud déconnectée
*/
function gererReconnection(id) {
  let popup = "L'équipe " + id + " s'est reconnectée !";
  console.log(popup);
  afficherPopup(popup, true)

  document.getElementById(id).classList.remove("deconnecte");

  //Modifier pion sur interface user ?
}

function isEquipeDeconnectee(id){
  return document.getElementById(id).classList.contains("deconnecte")
}

function downloadJSON() {
  // Récupérez les données du jeu
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  // Convertissez l'objet en chaîne JSON
  const jsonData = JSON.stringify(cacheCacheData, null, 2);

  // Créez un objet Blob avec le contenu JSON
  const blob = new Blob([jsonData], { type: 'application/json' });

  // Créez un objet URL pour le Blob
  const url = URL.createObjectURL(blob);

  // Créez un élément <a> pour le téléchargement
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cacheCacheData.json';

  // Ajoutez l'élément <a> à la page et déclenchez le téléchargement
  document.body.appendChild(a);
  a.click();

  // Supprimez l'élément <a> de la page
  document.body.removeChild(a);

  // Révoquez l'URL de l'objet Blob
  URL.revokeObjectURL(url);
}

//////////
//Autres//
//////////

function togglepause() {

  var pause = document.getElementById("pause_icon");
  var dark = document.getElementById("dark");

  if (pause.style.display == "none") {
    pause.style.display = "block";
    dark.style.display = "block";
  }
  else {
    pause.style.display = "none";
    dark.style.display = "none";
  }
}

////////////////////////////////
////////////////////////////////
//FONCTIONNALITEES POUR L'USER//
////////////////////////////////
////////////////////////////////

function creerClassementPopUp() {
  // Récupérer l'objet depuis le localStorage
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  // Calculer le score pour chaque joueur (nombre de balises trouvées)
  const classement = [];
  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];
    const balisesTrouvees = joueurData.times.filter(temps => temps === 0).length;
    const tempsTotal = joueurData.times.reduce((total, temps) => total + temps, 0);
    const couleur = joueurData.couleur;
    classement.push({ joueurId, balisesTrouvees, tempsTotal, couleur });
  }

  // Trier les joueurs en fonction du nombre de balises trouvées et du temps total
  classement.sort((a, b) => {
    if (a.balisesTrouvees !== b.balisesTrouvees) {
      return b.balisesTrouvees - a.balisesTrouvees; // Trie par nombre de balises trouvées décroissant
    } else {
      return a.tempsTotal - b.tempsTotal; // En cas d'égalité, trie par temps total croissant
    }
  });

  // Afficher le classement
  const classementContent = document.getElementById('classementContent');
  classementContent.innerHTML += '<h2>Classement Cache-Cache</h2>';
  titleclassemnt = ["Premier", "Deuxième", "Troisième"];
  // on affiche le classement des 3 premiers joueurs
  for (let i = 0; i < 3; i++) {
    const joueurNameHtml = document.getElementById('joueur' + (i + 1) + '-name');
    const joueurColorHtml = document.getElementById('joueur' + (i + 1) + '-color');
    const joueur = classement[i];
    const tempsTotalText = joueur.tempsTotal === 0 ? "Temps non classé" : `${joueur.tempsTotal} secondes`;
    classementContent.innerHTML += `<p>${titleclassemnt[i]}: ${joueur.joueurId} (${joueur.balisesTrouvees} balises trouvées, ${tempsTotalText})</p>`;
    joueurNameHtml.innerHTML = joueur.joueurId;
    // joueur possede l'attribut couleur qui contient l'hexa de la couleur
    console.log(joueur.couleur);
    joueurColorHtml.style.backgroundColor = joueur.couleur;
  }
  return classement;
}


// ================================== A MODIFIER ==================================
// function creerPions(){
// event listener on load page
// window.addEventListener('load', function() {
//   var monElement = document.getElementById('0');
//   console.log(monElement);

// });
// }

$(document).ready(function () {
  window.addEventListener('load', function () {
    // Récupérez l'élément <td> avec l'id "0"
    var tdElement = document.getElementById('0');

    var divElement = document.createElement('div');
    // Créez un nouvel élément <div>
    divElement.style.display = "flex";

    // Récupérez les valeurs du localStorage
    var cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor')) || [];
    console.log(cacheCacheData);
    // Boucle pour créer et ajouter de nouvelles div avec des IDs basées sur les valeurs du localStorage
    for (var i = 0; i < cacheCacheData.length; i++) {
      var nouvelleDiv = document.createElement('div');
      nouvelleDiv.id = cacheCacheData[i].node;  // Utilisez la valeur du localStorage pour l'ID
      tdElement.appendChild(divElement);
      divElement.appendChild(nouvelleDiv);

      // Ajoutez une classe à chaque nouvelle div en fonction de la logique existante
      if (i % 3 === 0) {
        nouvelleDiv.classList.add('square');
      } else if (i % 3 === 1) {
        nouvelleDiv.classList.add('circle');
      } else {
        nouvelleDiv.classList.add('triangle');
      }
    }
  });
});

////////////////////////////////
////////////////////////////////
//Fonctionnalités pour l'index//
////////////////////////////////
////////////////////////////////

function afficherJoueurs() {
  rotationJoueurs += 180;
  document.getElementById('toggleJoueurs').style.transform = `rotate(${rotationJoueurs}deg)`;
  joueursCaches = !joueursCaches;

  if (joueursCaches) {
    document.getElementById('listJoueurs').style.display = "none";
  }
  else {
    document.getElementById('listJoueurs').style.display = "block";
  }
}

function afficherCheckpoints() {
  rotationCheckpoints += 180;
  document.getElementById('toggleCheckpoints').style.transform = `rotate(${rotationCheckpoints}deg)`;
  CheckpointsCaches = !CheckpointsCaches;

  if (CheckpointsCaches) {
    document.getElementById('listCheckpoints').style.display = "none";
  }
  else {
    document.getElementById('listCheckpoints').style.display = "block";
  }
}

function rafraichir() {

  if (!lectureDonneesEnCours) {
    lirePortSerie();
    lectureDonneesEnCours = true;
    document.getElementById("rafraichir").innerText = "Rafraîchir";

  }
  if (getNbJoueurs() > 0) {
    document.getElementById('commencerPartie').style.display = "block";
  }
  document.getElementById('nbJoueurs').innerText = getNbJoueurs();
  document.getElementById('listJoueurs').innerHTML = getListText("Joueur", getListJoueurs());
  document.getElementById('nbCheckpoints').innerText = getNbCheckpoints();
  document.getElementById('listCheckpoints').innerHTML = getListText("Checkpoint", getListCheckpoints());
}

function openModal() {
  document.getElementById("myModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("myModal").style.display = "none";
}

///////////
///////////
// UTILS //
///////////
///////////

function getListText(mot, list){
  let text = "";

  for(let i in list){
    text += mot + " " + list[i] + "<br>";
  }

  return text;
}

function getListJoueurs() {
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  let listJoueurs = [];

  for (const joueurId in cacheCacheData) {
    listJoueurs.push(cacheCacheData[joueurId].node);
  }

  return listJoueurs;
}

function getListCheckpoints() {
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  if (getNbJoueurs() === 0) {
    return [];
  }
  let listCheckpoints = [];

  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];
    for (const target in cacheCacheData[joueurId].targets) {
      listCheckpoints.push(joueurData.targets[target]);
    }
    return listCheckpoints;
  }
}

function getNbJoueurs() {

  const listNodeWithColor = JSON.parse(localStorage.getItem('listNodeWithColor'));

  if (!listNodeWithColor) {
    return 0;
  }

  return Object.keys(listNodeWithColor).length;
}

function getNbCheckpoints() {
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  if (getNbJoueurs() === 0) {
    return 0;
  }

  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];
    return joueurData.targets.length;
  }

}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
      return false;
  }

  for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
          return false;
      }
  }

  return true;
}

function genererCouleur(){
  return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
}

function isCouleurClaire(couleur) {
  console.log(couleur);
  if (couleur && typeof couleur === 'string') {
    let r = parseInt(couleur.slice(1, 3), 16);
    let g = parseInt(couleur.slice(3, 5), 16);
    let b = parseInt(couleur.slice(5, 7), 16);

    let brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128;
  } else {
    // Gérer le cas où couleur n'est pas défini ou n'est pas une chaîne de caractères
    console.error("La couleur n'est pas définie ou n'est pas une chaîne de caractères");
    return false; // ou une autre valeur par défaut
  }
}