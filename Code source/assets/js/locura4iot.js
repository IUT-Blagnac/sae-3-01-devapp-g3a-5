
const listNodeWithColor = {};
// Le listNodeWithColor est de la forme
// [0:{node: "0xFD24", targets: ["0x35A1", "0x2EF4", "0x8C05", "0x907D", "0xBA89"], times: [23.0, 0.0, 0.0, 0.0, 0.0], couleur: "#FFFFFF"}]
// Nous voulons le passer à la forme
// {"0xFD24": {targets: ["0x35A1", "0x2EF4", "0x8C05", "0x907D", "0xBA89"], times: [23.0, 0.0, 0.0, 0.0, 0.0], couleur: "#FFFFFF"}}



///////////////////////
///////////////////////
////LECTURE DONNEES////
///////////////////////
///////////////////////

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
            }
          }
          
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

  if (!auto){
      contenu = prompt("Veuillez saisir votre message :")
  }
  
  if(contenu.length > 0){
      popupContent.innerHTML = contenu;

      popup.style.display = "block";

      popup.style.animation = "deplacementInformation 5s";

      setTimeout(function() {
          popup.style.display = "none";
      }, 5000); 
  } 
}

function togglepause() {

  //stop timer si timer ?

  //Block réception données ?

  var pause = document.getElementById("pause_icon");
  var dark = document.getElementById("dark");

  if (pause.style.display == "none"){
      pause.style.display = "block";
      dark.style.display = "block";
  }
  else {
      pause.style.display = "none";
      dark.style.display = "none"; 
  }
}

function finJeu(){
  //TODO
}

function createTableau(){
  
  const obj1 = JSON.parse(JSON.stringify({
      node: "0xFD24",
      targets: ["0x35A1", "0x2EF4", "0x8C05", "0x907D", "0xBA89"],
      times: [23.0, 0.0, 0.0, 0.0, 0.0]
    }));
  
  
  $nbIndex = obj1.targets.length;


  var tbl = document.createElement("table");
  tbl.id = obj1.node;


  //Ligne labels
  var rowLabels = document.createElement("tr");

      var cellNoeud = document.createElement("td");
      cellNoeud.classList.add("equipe");
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

          var cellCheckpointA = document.createElement("td");
          cellCheckpointA.textContent = obj1.targets[i];
          rowCheckpoint.appendChild(cellCheckpointA);

          var cellTrouveA = document.createElement("td");
          if(obj1.times[i] > 0){
              cellTrouveA.innerHTML = '<img class="icon" src="assets/images/check.png"></img>';
          }
          rowCheckpoint.appendChild(cellTrouveA);

          var cellTempsA = document.createElement("td");
          cellTempsA.textContent = obj1.times[i];
          rowCheckpoint.appendChild(cellTempsA);

      tbl.appendChild(rowCheckpoint);
  }


  //Afficher tableau

  var tabEquipesDiv = document.getElementsByClassName("tabEquipes")[0];
  console.log(tabEquipesDiv);
  tabEquipesDiv.appendChild(tbl);
}

/**
* Change l'apprence du noeud hors-connexion et informe les joueurs.
* 
* @param {*} id du noeud déconnectée
*/
function gererDeconnection(id){
  $popup = "L'équipe " + id + " est déconnectée !";
  afficherPopup(popup, true)
  
  document.getElementById(id).classList.add("deconnecte");

  //Modifier pion sur interface user ?
}


$(document).ready(function() {
  $("#consoleJson").on("click", function() {
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
var joueursCaches = true;

		function afficherJoueurs() {
		rotationJoueurs += 180;
		document.getElementById('toggleJoueurs').style.transform = `rotate(${rotationJoueurs}deg)`;
		joueursCaches = !joueursCaches;

        
        if (joueursCaches){
            document.getElementById('listJoueurs').style.display = "none";
        }
        else {
            document.getElementById('listJoueurs').style.display = "block";
        }
    }
		
    let rotationCheckpoints = 0;
    var CheckpointsCaches = true;
    
            function afficherCheckpoints() {
            rotationCheckpoints += 180;
            document.getElementById('toggleCheckpoints').style.transform = `rotate(${rotationCheckpoints}deg)`;
            CheckpointsCaches = !CheckpointsCaches;
    
            
            if (CheckpointsCaches){
                document.getElementById('listCheckpoints').style.display = "none";
            }
            else {
                document.getElementById('listCheckpoints').style.display = "block";
            }
        }
            
    function getListJoueurs(){
        //TODO
        joueurs = ["A", "B", "C", "D", "E"];

        text = "";

        for (let i = 0; i < joueurs.length; i++) {
            text += "Joueur " + i + " : " + joueurs[i] + "<br>";
          }

        return text;
    }

    function getListCheckpoints(){
        //TODO

        return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    }


    function getNbJoueurs(){
        //TODO

        return 5
    }

    function getNbCheckpoints(){
        //TODO

        return 10
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

    

    function rafraichir(){
        document.getElementById('nbJoueurs').innerText = getNbJoueurs();
        document.getElementById('listJoueurs').innerText = getListJoueurs();
    }