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

const usedColors = ['#1DC2AF', '#18A090', '#137C70', '#0E5850', '#083530'];
const generatedColors = new Set(usedColors);

async function lirePortSerie() {
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200, dataBits: 8, stopBits: 1 });

    const decoder = new TextDecoderStream('utf-8');
    const readableStreamClosed = port.readable.pipeTo(decoder.writable);
    const textStreamReader = decoder.readable.getReader();
    let partialData = '';

    while (true) {
      const { value, done } = await textStreamReader.read();
      if (done) {
        console.log('Décodage terminé !');
        break;
      }
      partialData += value;
      console.log(partialData);
      const lines = partialData.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const jsonData = JSON.parse(lines[i]);

          const nodeExistante = jsonData.node in listNodeWithColor ? true : false;

          if (!nodeExistante) {
            // Génère une couleur unique qui n'est pas dans la liste usedColors
            let uniqueColor;
            do {
              uniqueColor = '#' + ('000000' + (Math.random() * 0xFFFFFF << 0).toString(16)).slice(-6);
            } while (generatedColors.has(uniqueColor) || usedColors.includes(uniqueColor));

            jsonData.couleur = uniqueColor;

            generatedColors.add(uniqueColor);
            listNodeWithColor[jsonData.node] = jsonData;
            localStorage.setItem('listNodeWithColor', JSON.stringify(listNodeWithColor));
          } else {
            for (let j = 0; j < jsonData.times.length; j++) {
              if (jsonData.times[j] !== listNodeWithColor[jsonData.node].times[j]) {
                listNodeWithColor[jsonData.node].times[j] = jsonData.times[j];
              }
            }
            localStorage.setItem('listNodeWithColor', JSON.stringify(listNodeWithColor));
          }
          console.log(listNodeWithColor);
        } catch (jsonError) {
          console.error('Erreur lors de l\'analyse JSON :', jsonError);
        }
        partialData = lines[lines.length - 1];
      }
    }

    textStreamReader.releaseLock();
    await readableStreamClosed;
  } catch (error) {
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
  if (window.location.href.includes("IHM_admin.html")) {
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
if (window.location.href.includes("IHM_admin.php")) {

  window.addEventListener("storage", function (event) {
    if (event.key === "listNodeWithColor") {
      const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

      // creerClassement();
      // activatedModal();

      for (let joueurId in cacheCacheData) {
        var joueur = cacheCacheData[joueurId]

        if (isEquipeDeconnectee(joueur.node)) {
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
          updateMessage(joueur, joueur.times.filter(temps => temps > 0).length);
        }
        else if (isEquipeDeconnectee()) {
          gererReconnection(joueur.node);
        }

      }

      listNodeWithColor = cacheCacheData;
    }
  });
}


////////////////////
//Pour les pop-ups//
////////////////////

function updateMopup(jsonData, nbBalises) {

  jsonData = JSON.parse(JSON.stringify(jsonData));
  let contenu = "";

  if (nbBalises == Math.round(getNbCheckpoints() / 2)) {
    contenu = "L'équipe " + jsonData.node + " a trouvé la moitié des trésors !";
    afficherMessage(contenu, true);
  }
  else if (nbBalises == getNbCheckpoints()) {
    contenu = "L'équipe " + jsonData.node + " a fini le jeu !";
    afficherMessage(contenu, true);

  }
}

function afficherMessage(contenu, auto) {

  if (!auto) {
    contenu = prompt("Veuillez saisir votre message :")
  }

  localStorage.setItem("messageContent", contenu);
}

window.addEventListener("storage", function (event) {
  if (event.key === "messageContent") {
    var message = document.getElementById("message");
    var messageContent = document.getElementById("messageContent");

    // Affichez la message avec le contenu du localStorage
    if (localStorage.getItem("messageContent") != "") {
      messageContent.innerHTML = localStorage.getItem("messageContent");
      message.style.display = "block";
      message.style.animation = "deplacementInformation 5s";
    }

    setTimeout(function () {
      message.style.display = "none";
    }, 5000);
  }
});

/////////////////////////////////
//Gérer les tableaux des noeuds//
/////////////////////////////////
function createTableau(jsonData) {
  //Anomalie, un noeud n'a pas de couleur, on en génère une et on modifie le localStorage
  if (!('couleur' in jsonData)) {
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
    if (!arraysEqual(obj1.times, listNodeWithColor[obj1.node].times)) {
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
  let message = "L'équipe " + id + " est déconnectée !";
  console.log(message);
  afficherMessage(message, true)


  document.getElementById(id).classList.add("deconnecte");

  //Modifier pion sur interface user ?
}

/**
* Change l'apprence du noeud hors-connexion et informe les joueurs.
* 
* @param {*} id du noeud déconnectée
*/
function gererReconnection(id) {
  let message = "L'équipe " + id + " s'est reconnectée !";
  console.log(message);
  afficherMessage(message, true)

  document.getElementById(id).classList.remove("deconnecte");

  //Modifier pion sur interface user ?
}

function isEquipeDeconnectee(id) {
  return document.getElementById(id).classList.contains("deconnecte")
}

function downloadJSON() {
  // Récupérez les données du jeu
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  // Convertissez l'objet en chaîne JSON
  const jsonData = JSON.stringify(cacheCacheData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cacheCacheData.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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

function creerClassementHTML() {
  // Récupérer l'objet depuis le localStorage
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  // Calculer le score pour chaque joueur (nombre de balises trouvées)
  const classement = creerClassement();


  // Afficher le classement

  // on affiche le classement de TOUT joueurs classement.length
  for (let i = 0; i < 3; i++) {
    const joueurNameHtml = document.getElementById('joueur' + (i + 1) + '-name');
    const joueurColorHtml = document.getElementById('joueur' + (i + 1) + '-color');
    const joueur = classement[i];
    const tempsTotalText = joueur.tempsTotal === 0 ? "Temps non classé" : `${joueur.tempsTotal} secondes`;

    joueurNameHtml.innerHTML = joueur.joueurId;
    // joueur possede l'attribut couleur qui contient l'hexa de la couleur
    // console.log(joueur.couleur);
    // if (i % 3 === 0) {
    //   joueurColorHtml.classList.add('square');

    // } else if (i % 3 === 1) {
    //   joueurColorHtml.classList.add('circle');

    // } else {
    //   joueurColorHtml.classList.add('triangle');

    // }

    joueurColorHtml.style.backgroundColor = joueur.couleur;

  }
  return classement;
}

function creerClassement() {
  // Récupérer l'objet depuis le localStorage
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  // Calculer le score pour chaque joueur (nombre de balises trouvées)
  const classement = [];
  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];
    const balisesTrouvees = joueurData.times.filter(temps => temps != 0).length;
    const targets = joueurData.targets;
    const tempsTotal = joueurData.times.reduce((total, temps) => total + temps, 0);
    const couleur = joueurData.couleur;
    classement.push({ joueurId, balisesTrouvees, targets, tempsTotal, couleur });
  }

  // Trier les joueurs en fonction du nombre de balises trouvées et du temps total
  classement.sort((a, b) => {
    if (a.balisesTrouvees !== b.balisesTrouvees) {
      return b.balisesTrouvees - a.balisesTrouvees; // Trie par nombre de balises trouvées décroissant
    }
    else {
      return a.tempsTotal - b.tempsTotal; // En cas d'égalité, trie par temps total croissant
    }
  });
  return classement;
}



function creerClassementPopUp() {
  // Faire une querySelector pour récupérer la classe modal

  // Afficher le classement
  document.addEventListener("DOMContentLoaded", function () {
    const classementContent = document.getElementById('classementContent-pop-up');

    console.log(classementContent);
    classementContent.innerHTML += '<h2>Classement Cache-Cache</h2>';
    titleclassemnt = ["Premier", "Deuxième", "Troisième"];
    // on affiche le classement des 3 premiers joueurs
    for (let i = 0; i < 3; i++) {
      const joueurNameHtml = document.getElementById('joueur' + (i + 1) + '-name');
      const joueurColorHtml = document.getElementById('joueur' + (i + 1) + '-color');
      classement = creerClassement();
      const joueur = classement[i];
      const tempsTotalText = joueur.tempsTotal === 0 ? "Temps non classé" : `${joueur.tempsTotal} secondes`;
      classementContent.innerHTML += `<p>${titleclassemnt[i]}: ${joueur.joueurId} (${joueur.balisesTrouvees} balises trouvées, ${tempsTotalText})</p>`;
      joueurNameHtml.innerHTML = joueur.joueurId;
      // joueur possede l'attribut couleur qui contient l'hexa de la couleur
      console.log(joueur.couleur);
      joueurColorHtml.style.backgroundColor = joueur.couleur;
    }
    return classement;
  });
}

// function creerClassement() {
//   // Récupérer l'objet depuis le localStorage
//   const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

//   // Calculer le score pour chaque joueur (nombre de balises trouvées)
//   const classement = [];
//   for (const joueurId in cacheCacheData) {
//     const joueurData = cacheCacheData[joueurId];
//     const balisesTrouvees = joueurData.times.filter(temps => temps != 0).length;
//     const targets = joueurData.targets;
//     const tempsTotal = joueurData.times.reduce((total, temps) => total + temps, 0);
//     const couleur = joueurData.couleur;
//     classement.push({ joueurId, balisesTrouvees, targets, tempsTotal, couleur });
//   }

//   // Trier les joueurs en fonction du nombre de balises trouvées et du temps total
//   classement.sort((a, b) => {
//     if (a.balisesTrouvees !== b.balisesTrouvees) {
//       return b.balisesTrouvees - a.balisesTrouvees; // Trie par nombre de balises trouvées décroissant
//     } else {
//       return a.tempsTotal - b.tempsTotal; // En cas d'égalité, trie par temps total croissant
//     }
//   });

//   // Afficher le classement


//   // on affiche le classement de TOUT joueurs classement.length
//   for (let i = 0; i < 3; i++) {
//     for (let i = 0; i < 3 ; i++) {
//       const joueurNameHtml = document.getElementById('joueur' + (i + 1) + '-name');
//       const joueurColorHtml = document.getElementById('joueur' + (i + 1) + '-color');
//       const joueur = classement[i];
//       const tempsTotalText = joueur.tempsTotal === 0 ? "Temps non classé" : `${joueur.tempsTotal} secondes`;

//       joueurNameHtml.innerHTML = joueur.joueurId;
//       // joueur possede l'attribut couleur qui contient l'hexa de la couleur
//       // console.log(joueur.couleur);
//       // if (i % 3 === 0) {
//       //   joueurColorHtml.classList.add('square');

//       // } else if (i % 3 === 1) {
//       //   joueurColorHtml.classList.add('circle');

//       // } else {
//       //   joueurColorHtml.classList.add('triangle');

//       // }

//       joueurColorHtml.style.backgroundColor = joueur.couleur;

//     }
//   }
//   return classement;
// }

function créerPions() {
  nbTargets = getTaillePlateau();
  var cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  var ListJoueurs = Object.keys(cacheCacheData);
  var tabCouleurs = [];
  for (const joueur in cacheCacheData) {
    const couleur = cacheCacheData[joueur].couleur;
    tabCouleurs.push(couleur);
  }
  var nbJoueurs = getNbJoueurs();
  // Récupérer le tableau
  var table = document.getElementById("gameTable");
  // recupérer tous les tr du tableau
  var tr = table.getElementsByTagName("tr");
  // pour chaque tr on récupère les td
  for (var i = 0; i < tr.length; i++) {
    var td = tr[i].getElementsByTagName("td");
    // pour chaque td on créer autant de div que de joueurs
    for (var j = 0; j < td.length; j++) {
      //pour chaque joueur on créer une div
      for (var k = 0; k < nbJoueurs; k++) {
        var nouvelleDiv = document.createElement('div');
        nouvelleDiv.id = ListJoueurs[k];  // la node du localStorage est utilisé pour l'ID
        td[j].appendChild(nouvelleDiv);
        // Ajoute une classe à chaque nouvelle div
        if (k % 3 === 0) {
          nouvelleDiv.classList.add('square');
          nouvelleDiv.style.backgroundColor = tabCouleurs[k];
          nouvelleDiv.style.display = "none";
        } else if (k % 3 === 1) {
          nouvelleDiv.classList.add('circle');
          nouvelleDiv.style.backgroundColor = tabCouleurs[k];
          nouvelleDiv.style.display = "none";
        } else {
          nouvelleDiv.classList.add('triangle');
          nouvelleDiv.style.borderBottomColor = tabCouleurs[k];
          nouvelleDiv.style.display = "none";
        }
      }
    }
  }
};

function afficherPions() {
  var cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  const ListJoueurs = Object.keys(cacheCacheData);

  for (node in ListJoueurs) {
    for (var i = 0; i < nbTargets; i++) {
      var pionAfficher = document.getElementById(i).children[node];
      pionAfficher.style.display = "none";
    }
  }

  for (var i = 0; i < ListJoueurs.length; i++) {
    const positionPion = getCapteursTrouvés(ListJoueurs[i]);
    var numeroLigne = Math.floor(positionPion / 5);
    var ligne = document.getElementsByTagName('tr')["row-" + numeroLigne]
    var cellules = ligne.getElementsByTagName('td');
    var cellule = Array.from(cellules).find(cellule => parseInt(cellule.id) === positionPion);
    var pion = cellule.getElementsByTagName('div')[i];
    pion.style.display = "block";
  }
}

$(document).ready(function () {
  $('#genererPDF').on('click', function () {
    // appel de la fonction qui genere le classement pour etre sur que le classement est a jour
    const classement = creerClassement();
    console.log('Générer PDF');


    var content = [
      { text: 'Date: ' + new Date().toLocaleDateString() },
      { text: 'Heure: ' + new Date().toLocaleTimeString() },
      { text: 'Par Loïs PACQUETEAU\n' },
      { text: 'Compte rendu', fontSize: 16, bold: true, alignment: 'center' },
      // saut de ligne
      { text: '\n' },
      { text: '\n' },
      { text: '\n' },
      { text: '\n' },
      { text: '\n' },
      { text: '\n' },
      // tableau
      { text: 'Score de la course:', fontSize: 14, margin: [0, 10, 0, 5] },
      {
        style: 'tableExample',
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            ['Position', 'Joueur', 'Temps', 'Balises trouvées'],
            ...classement.map((joueur, index) => {
              // ci dessous les milisecondes depassent pas 2 chiffres apres la virgule (d'ou le toFixed(2))
              const tempsTotalText = joueur.tempsTotal === 0 ? "Temps non classé" : `${(joueur.tempsTotal).toFixed(2)} secondes`;
              return [index + 1, joueur.joueurId, tempsTotalText, joueur.balisesTrouvees];
            })
          ]
        }
      },
      // bas de page
      { text: '\n' },
      { text: '\n' },
      { text: '\n' },
      { text: '\n' },
      { text: '\n' },
      // ajouter le logo de l'iut 
      // { image: '../assets/images/Logo_IUT_Blagnac.png', width: 100, height: 100, alignment: 'center' },
      { text: 'Cache-Cache LocURa4IoT sae-3-01devapp-g3a-5', fontSize: 12, alignment: 'center' },
      { text: '© 2024', fontSize: 12, alignment: 'center' }
    ];

    pdfMake.createPdf({ content }).download('compte_rendu_LocURa4IoT.pdf');
  });
});

// faire une fonction qui active la fonction openModal() quand tout les elements d'une liste target sont trouvés (times != 0)
// on parcours toute la liste des joueurs si un joueur a un temps = 0 on passe au joueur suivant si on arrive à la fin de la liste et que toute les joueurs ont au mois un temps = 0 on return false
function estFinDuJeu() {
  // Récupérer les données du localStorage
  const jeuData = getJeuDataFromLocalStorage();
  // Vérifier si tous les temps pour au moins un nœud sont différents de zéro
  for (const nodeId in jeuData) {
    const node = jeuData[nodeId];
    const tempsNonZero = node.times.every(time => time !== 0);

    // Si tous les temps pour un nœud sont différents de zéro, le jeu est terminé
    if (tempsNonZero) {
      return true;
    }
  }

  // Si aucun nœud n'a tous les temps différents de zéro, le jeu n'est pas terminé
  return false;
}

function getTaillePlateau() {
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  const cachecacheTable = [];
  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];

    const targets = joueurData.targets;

    cachecacheTable.push({ targets });
  }
  return cachecacheTable[0].targets.length;
}

function getCapteursTrouvés(node) {
  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));
  const joueurData = cacheCacheData[node];
  const targets = joueurData.targets;
  const times = joueurData.times;
  const capteursTrouvés = [];
  for (let i = 0; i < times.length; i++) {
    if (times[i] > 0) {
      capteursTrouvés.push(targets[i]);
    }
  }
  return capteursTrouvés.length;
}

function activatedModal() {
  if (estFinDuJeu()) {
    openModal();
  }
}


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

function getListText(mot, list) {
  let text = "";

  for (let i in list) {
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

function genererCouleur() {
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