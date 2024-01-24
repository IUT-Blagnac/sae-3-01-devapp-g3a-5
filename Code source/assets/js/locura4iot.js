
let lectureDonneesEnCours = false;
const listNodeWithColor = {};

let partieCommencee = false;
// Le listNodeWithColor est de la forme
// [0:{node: "0xFD24", targets: ["0x35A1", "0x2EF4", "0x8C05", "0x907D", "0xBA89"], times: [23.0, 0.0, 0.0, 0.0, 0.0], couleur: "#FFFFFF"}]
// Nous voulons le passer à la forme
// {"0xFD24": {targets: ["0x35A1", "0x2EF4", "0x8C05", "0x907D", "0xBA89"], times: [23.0, 0.0, 0.0, 0.0, 0.0], couleur: "#FFFFFF"}}


const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));


///////////////////
///////////////////
//LECTURE DONNEES//
///////////////////
///////////////////

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

              const nodeExistante = jsonData.node in listNodeWithColor ? true : false;
  
              //SI C'EST UNE NOUVELLE EQUIPE
              if (!nodeExistante) {
                // Ajoute un attribut "couleur" avec une couleur générée
                jsonData.couleur = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
                //admin : createTableau(jsonData);
                listNodeWithColor[jsonData.node] = jsonData;
                localStorage.setItem('listNodeWithColor', JSON.stringify(listNodeWithColor));
                if (partieCommencee) {
                  createTableau(jsonData);
                }
              }
              else {
                // si les valeurs dans times sont différentes, on met à jour
                for (let j = 0; j < jsonData.times.length; j++) {
                  if (jsonData.times[j] !== listNodeWithColor[jsonData.node].times[j]) {
                    listNodeWithColor[jsonData.node].times[j] = jsonData.times[j];
                  }
                }
              }
              console.log(listNodeWithColor);
            } catch (jsonError) {
              console.error('Erreur lors de l\'analyse JSON :', jsonError);
          // else{
          //   if(jsonData != listNodeWithColor.contai(jsonData.node)){
          //     listNodeWithColor.set(jsonData.node, jsonData);
          //     localStorage.setItem('listNodeWithColor', JSON.stringify(listNodeWithColor));
          //     if(partieCommencee){
          //       modifierTableau(jsonData);
          //     }
          //   }
          // }


      partialData = lines[lines.length - 1]; // Garde le dernier fragment potentiellement incomplet
    }

    textStreamReader.releaseLock(); // Ferme les flux après la lecture
    await readableStreamClosed;
  }
  catch (error) {
    console.error('Erreur lors de la demande ou de l\'ouverture du port série :', error);
  }
}

////////////////////////////////
////////////////////////////////
//Fonctionnalités pour l'admin//
////////////////////////////////
////////////////////////////////

function afficherPopup(contenu, auto) {
  var popup = document.getElementById("popup");
  var popupContent = document.getElementById("popupContent");

  if (!auto) {
    contenu = prompt("Veuillez saisir votre message :")
  }

  if (contenu.length > 0) {
    popupContent.innerHTML = contenu;

    popup.style.display = "block";

    popup.style.animation = "deplacementInformation 5s";

    setTimeout(function () {
      popup.style.display = "none";
    }, 5000);
  }
}

function togglepause() {

  //stop timer si timer ?

  //Block réception données ?

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

function finJeu() {
  //TODO
}

function initialiserPartie() {
  console.log("BBBBBBBBBBBBBBBB");
  partieCommencee = true;

  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  for (var joueur of cacheCacheData) {
    console.log(joueur);
    createTableau(joueur);
  }
}

function createTableau(jsonData) {
  const obj1 = JSON.parse(JSON.stringify(
    jsonData
  ));


  $nbIndex = getNbCheckpoints();

  var tbl = document.createElement("table");
  tbl.id = obj1.node;

  //Ligne labels
  var rowLabels = document.createElement("tr");

  var cellNoeud = document.createElement("td");
  cellNoeud.classList.add("equipe");
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
    cellCheckpoint.id = obj1.targets[i];
    cellCheckpoint.textContent = obj1.targets[i];
    rowCheckpoint.appendChild(cellCheckpoint);

    //ICON TROUVE
    var cellTrouve = document.createElement("td");
    cellTrouve.id = obj1.targets[i] + ".icon";
    if (obj1.times[i] > 0) {
      cellTrouve.innerHTML = '<img class="icon" src="assets/images/check.png"></img>';
    }
    rowCheckpoint.appendChild(cellTrouve);

    //TEMPS
    var cellTemps = document.createElement("td");
    cellTemps.id = obj1.targets[i] + ".time";
    cellTemps.textContent = (obj1.times[i] > 0) ? obj1.times[i] : "--:--";
    rowCheckpoint.appendChild(cellTemps);

    tbl.appendChild(rowCheckpoint);
  }


  //Afficher tableau

  var tabEquipesDiv = document.getElementById("tabEquipes");
  console.log(tabEquipesDiv);
  console.log(tbl);
  tabEquipesDiv.appendChild(tbl);
}

function modifierTableau(jsonData) {

  const obj1 = JSON.parse(JSON.stringify(
    jsonData
  ));

  //Récupérer tableau
  table = document.getElementById(obj1.node);

  //Modifier les lignes ou le joueur a trouvé un checkpoint
  for (var i = 0; i < $nbIndex; i++) {
    if (obj1.times[i] > 0 && table.getElementById(obj1.targets[i] + ".time") > 0) {
      table.getElementById(obj1.targets[i] + ".time") = obj1.times[i];
      table.getElementById(obj1.targets[i] + ".icon").innerHTML = '<img class="icon" src="assets/images/check.png"></img>';
    }
  }
}
/**
* Change l'apprence du noeud hors-connexion et informe les joueurs.
* 
* @param {*} id du noeud déconnectée
*/
function gererDeconnection(id) {
  $popup = "L'équipe " + id + " est déconnectée !";
  afficherPopup(popup, true)

  document.getElementById(id).classList.add("deconnecte");

  //Modifier pion sur interface user ?
}



function downloadJSON() {
  // Récupérez le contenu du localStorage
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


$(document).ready(function () {
  $("#consoleJson").on("click", function () {

    window.location.href = "consoleJson.php";
  });
});


///////////////////////////////
///////////////////////////////
//Fonctionnalités pour l'user//
///////////////////////////////
///////////////////////////////

// function creerPions(){
  // event listener on load page
  // window.addEventListener('load', function() {
  //   var monElement = document.getElementById('0');
  //   console.log(monElement);

  // });
// }


// ================================== A MODIFIER ==================================
$(document).ready(function() {
  window.addEventListener('load', function() {
    lirePortSerie();
    // Récupérez l'élément <td> avec l'id "0"
    var tdElement = document.getElementById('0');

    var divElement = document.createElement('div');
    // Créez un nouvel élément <div>
    divElement.style.display = "flex";

    // Récupérez les valeurs du localStorage
    var listNodeWithColor = JSON.parse(localStorage.getItem('listNodeWithColor')) || [];
    console.log(listNodeWithColor);
    // Boucle pour créer et ajouter de nouvelles div avec des IDs basées sur les valeurs du localStorage
    for (var i = 0; i < listNodeWithColor.length; i++) {
      var nouvelleDiv = document.createElement('div');
      nouvelleDiv.id = listNodeWithColor[i].node;  // Utilisez la valeur du localStorage pour l'ID
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

let rotationJoueurs = 0;
let joueursCaches = true;

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

let rotationCheckpoints = 0;
let CheckpointsCaches = true;

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

function getListJoueurs() {

  text = "";

  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];
    text += "Joueur " + joueurData.node + "<br>";
    console.log("test");

  }

  return text;
}



    function openModal() {
      document.getElementById("myModal").style.display = "flex";
    }
    function closeModal() {
      document.getElementById("myModal").style.display = "none";
    }

function getListCheckpoints() {

  if (getNbJoueurs() === 0) {
    return "";
  }
  text = "";

    function rafraichir(){
        document.getElementById('nbJoueurs').innerText = getNbJoueurs();
        document.getElementById('listJoueurs').innerText = getListJoueurs();
    }

  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];
    for (const target in joueurData.targets) {
      text += "Checkpoint " + joueurData.targets[target] + "<br>";
    }
    return text;
  }

}

function getNbJoueurs() {

  return Object.keys(JSON.parse(localStorage.getItem('listNodeWithColor'))).length;

}

function getNbCheckpoints() {

  if (getNbJoueurs() === 0) {
    return 0;
  }

  const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

  for (const joueurId in cacheCacheData) {
    const joueurData = cacheCacheData[joueurId];
    return joueurData.targets.length;
  }

}


//   $(document).ready(function() {
//   $('#genererPDF').on('click', function() {
//     // Créez une instance de jsPDF
//     var doc = new jsPDF();
//     console.log("on cree le pdf");
//     // Ajoutez du contenu au PDF
//     doc.text('Compte rendu', 10, 10);

//     // Ajoutez le reste du contenu ici

//     // Sauvegardez le fichier PDF
//     doc.save('compte_rendu.pdf');
//   });
// });

function openModal() {
  document.getElementById("myModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("myModal").style.display = "none";
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
  document.getElementById('listJoueurs').innerHTML = getListJoueurs();
  document.getElementById('nbCheckpoints').innerText = getNbCheckpoints();
  document.getElementById('listCheckpoints').innerHTML = getListCheckpoints();
}


///////////////////////////////////
///////////////////////////////////
//Fonctionnalités pour la console//
///////////////////////////////////
///////////////////////////////////

window.addEventListener('load', function () {
  if (window.location.href.includes('consoleJson.php')) {
    // Récupérer les données depuis le stockage local
    console.log(listNodeWithColor);
  } else {
    console.error('Aucune donnée disponible.');
  }
});


$(document).ready(function () {
  $(".donnee").on("click", function () {

    lirePortSerie();
  });
});
