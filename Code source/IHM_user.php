<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8" />
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.68/pdfmake.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.68/vfs_fonts.js"></script>
	<script src="assets/libs/jquery-3.7.1.min.js"></script>
	<script src="assets/js/locura4iot.js"> </script>
	<link rel="stylesheet" href="./assets/user.css" />
	<title>Chasse au trésor : interface utilisateur</title>
</head>

<body>
    <div class="nav-bar">
        <h1> Bienvenue sur la carte de la course LocURa4IoT!</h1>
    </div>

    <!-- For notifications -->
    <div class="popup" id="popup">
        <div class="popup-content" id="popupContent">
        </div>
    </div>

    <div class="classMere">
        <div class="centered-div">
            <table>
                <tr>
                    <td class="label">Joueur en tête</td>
                    <td id="joueur1-color"></td>
                    <td id="joueur1-name"></td>
                </tr>
                <tr>
                    <td class="label">2eme joueur</td>
                    <td id="joueur2-color"></td>
                    <td id="joueur2-name"></td>
                </tr>
                <tr>
                    <td class="label">3eme joueur</td>
                    <td id="joueur3-color"></td>
                    <td id="joueur3-name"></td>
                </tr>
            </table>
        </div>
        <div class="modal-background" id="myModal">
            <div class="modal">
                <span class="close-button" onclick="closeModal()">&times;</span>
                <div id="classementContent-pop-up"></div>
                <button id="genererPDF">Générer PDF</button>
                <button id="genererJson" onclick="downloadJSON()">Générer JSON</button>
            </div>
        </div>
        <script>
            // Add your JavaScript code here for the client-side logic
            // Remember to include the necessary logic from your locura4iot.js file
            // ...

            $(document).ready(function () {
                $('#genererPDF').on('click', function () {
                    // Use pdfmake to generate the PDF
                    console.log('Générer PDF');
                    // ... (rest of the PDF generation logic)
                });
            });
        </script>
        <div class="centered-div">
            <table id="gameTable">
                <!-- JavaScript will generate the table content here -->
            </table>
        </div>

        <script>
            // JavaScript code to generate the game table dynamically
            var liste_size = getTaillePlateau();
			setInterval(() => {
				creerClassement();
			}, 1500);
			openModal();// a changer par un if qui verifie si un joueur a gagner

            var rep_max = Math.ceil(liste_size / 5);
            var color = 0;
            var increment = true;

            function position(i, j) {
                if (i % 2 === 0) {
                    return 5 * i + j;
                } else {
                    return 5 * i + 4 - j;
                }
            }
			// faire une classe qui active la fonction openModal au moment ou un joueur gagne c'est a dire quand il arrive a la fin du plateau
			

            function fonctionColor() {
                if (increment) {
                    color++;
                    if (color >= 5) {
                        increment = false;
                    }
                } else {
                    color--;
                    if (color <= 1) {
                        increment = true;
                    }
                }
                return color;
            }

            function attributeClass(i, j) {
				if (i % 2 === 0) {
					if (j === 0 && i === 0) {
						return "rounded-left";
					} else if (j === 0 && position(i, j) === liste_size - 1) {
						return "rounded-down";
					} else if (j === 0 && i !== 0) {
						return "corner-bottom-left";
					} else if (j === 4 && position(i, j) !== liste_size - 1) {
						return "corner-top-right";
					} else if (i % 2 === 0 && position(i, j) === liste_size - 1) {
						return "rounded-right";
					} else {
						return "";
					}
				} else {
					if (j === 4 && position(i, j) === liste_size - 1) {
						return "rounded-down";
					} else if (j === 0 && position(i, j) < liste_size - 1) {
						return "corner-top-left";
					} else if (j === 4 && position(i, j) !== liste_size - 1) {
						return "corner-bottom-right";
					} else if (i % 2 !== 0 && position(i, j) === liste_size - 1) {
						return "rounded-left";
					} else if (i % 2 !== 0 && position(i, j) > liste_size - 1) {
						return "hidden";
					} else {
						return "";
					}
				}
			}

            var table = document.getElementById("gameTable");

            for (var i = 0; i < rep_max; i++) {
                var row = table.insertRow(i);
                for (var j = 0; j < liste_size; j++) {
                    if (i % 2 === 0 && j < 5) {
                        var cornerClass = attributeClass(i, j);
                        color = fonctionColor();
                        var cell = row.insertCell(j);
                        cell.id = position(i, j);
                        cell.className = cornerClass + " color-" + color;
                    } else if (i % 2 !== 0 && j < 5) {
                        var cornerClass = attributeClass(i, j);
                        color = fonctionColor();
                        var cell = row.insertCell(j);
                        cell.id = position(i, j);
                        cell.className = cornerClass + " color-" + color;
                    }
                }
            }
			
        </script>
    </div>
</body>

</html>
