<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.68/pdfmake.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.68/vfs_fonts.js"></script>
	<script src="assets/js/locura4iot.js" defer> </script>
	<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <link rel="stylesheet" href="./assets/style.scss" />

    <title>Chasse au trésor : interface utilisateur</title>
</head>
<body>
	<div class="nav-bar">
		<h1> Bienvenue sur la carte de la course LocURa4IoT!</h1>
	</div>
	
	<div class="classMere">
		<div class="centered-div">
			<!-- vraiment utile cette table? -->
			<table>
				<tr>
					<td class="label">Joueur en tete</td>
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
				<div id="classementContent"></div>
				<button id="genererPDF">Générer PDF</button>
				<button id="genererJson" onclick="downloadJSON()">Générer JSON</button> 
			</div>
		</div>
		<script>
			
			
			// Récupérer l'objet depuis le localStorage
			const cacheCacheData = JSON.parse(localStorage.getItem('listNodeWithColor'));

			// Calculer le score pour chaque joueur (nombre de balises trouvées)
			const classement = [];
			for (const joueurId in cacheCacheData) {
				const joueurData = cacheCacheData[joueurId];
				const balisesTrouvees = joueurData.times.filter(temps => temps === 0).length;
				const tempsTotal = joueurData.times.reduce((total, temps) => total + temps, 0);
				const couleur = joueurData.couleur;
				classement.push({ joueurId, balisesTrouvees, tempsTotal, couleur});
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
			titleclassemnt = ["Premier","Deuxième","Troisième"];
			// on affiche le classement des 3 premiers joueurs
			for (let i = 0; i < 3; i++) {
				const joueurNameHtml = document.getElementById('joueur'+(i+1)+'-name');
				const joueurColorHtml = document.getElementById('joueur'+(i+1)+'-color');
				const joueur = classement[i];
				const tempsTotalText = joueur.tempsTotal === 0 ? "Temps non classé" : `${joueur.tempsTotal} secondes`;
				classementContent.innerHTML += `<p>${titleclassemnt[i]}: ${joueur.joueurId} (${joueur.balisesTrouvees} balises trouvées, ${tempsTotalText})</p>`;
				joueurNameHtml.innerHTML = joueur.joueurId;
				// joueur possede l'attribut couleur qui contient l'hexa de la couleur
				console.log(joueur.couleur);
  				joueurColorHtml.style.backgroundColor = joueur.couleur;
				
				
			}
		
			openModal();
			$(document).ready(function() {
				$('#genererPDF').on('click', function() {
					// Utilisez pdfmake pour générer le PDF
					console.log('Générer PDF');
					var content = [
						{ text: 'Date: ' + new Date().toLocaleDateString() },
						{ text: 'Heure: ' + new Date().toLocaleTimeString() },
						{ text: '\n' },
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
										// je veux que les milisecondes depassent pas 2 chiffres apres la virgule
										const tempsTotalText = joueur.tempsTotal === 0 ? "Temps non classé" : `${(joueur.tempsTotal).toFixed(2)} secondes`;
										return [index + 1, joueur.joueurId, tempsTotalText, joueur.balisesTrouvees];
									})
								]
							}
						},
						// ecrire en bas de la page



					];

					pdfMake.createPdf({ content }).download('compte_rendu.pdf');
					});
			});



		</script>
        <div class="centered-div">
            <table>

				<?php
    			
				$cpt = 0; 
				$liste_size = 25;
				static $color = 0;
				function position($i,$j){
					if($i%2 == 0){
						return (5*$i)+$j;
					}
					else{
						return (5*$i+4)-$j;
					}
				};
				//fonction qui va de 1 a 5, une fois a 5 on va de 5 a 1
				function fonction_color() {
					global $color;
					static $increment = true;
					if($increment){
						$color++;
						if($color >= 5){
							$increment = false;
						}
					}
					else{
						$color--;
						if($color <= 1){
							$increment = true;
						}
					}
					return $color;
				}

				function attributeCLass( $i, $j,$liste_size){
					
					if($i%2 == 0){
						if($j == 0 && $i==0){
							return "rounded-left";
						}else if($j == 0 && position($i,$j) == $liste_size-1){
							return "rounded-down";
						}
						else if ($j == 0 && $i!=0){
							return "corner-bottom-left";
						}
						else if($j == 4 && position($i,$j) != $liste_size-1){
							return "corner-top-right";
						}
						else if($i % 2 == 0 && position($i,$j) == $liste_size-1){
							return "rounded-right";
						}
						
						else{
							return "";
						}
					}
					else{
						if($j == 4 && position($i,$j) == $liste_size-1){
							return "rounded-down";
						}
						else if($j == 0 && position($i,$j) < $liste_size-1){
							return "corner-top-left";
						} 
						else if($j == 4 && position($i,$j) != $liste_size-1){
							return "corner-bottom-right";
						}
						else if($i % 2 != 0 && position($i,$j) == $liste_size-1){
							return "rounded-left";
						}else if($i % 2 != 0 && position($i,$j) > $liste_size-1){
							return "hidden";
						}
						else{
							return "";
						}
					}
				};
				
				$rep_max=$liste_size/5;
				$rep_max=ceil($rep_max);
				for($i = 0; $i <$rep_max; $i++) {
					
					echo "<tr id=' $i'>";
					for ($j = 0; $j <$liste_size ; $j++) {
						
						if($i%2 == 0){
							if($j < 5){
								if($cpt < $liste_size){	
									$corner_class = attributeCLass($i, $j,$liste_size);
									$color = fonction_color($color);
									// var_dump($cpt,$liste_size,"j=".$j);	
															
									echo "<td id=".position($i,$j)." class='".$corner_class." color-".$color."'></td>";
									$cpt++;
									
								}
							}
						}
						else{
							if($j < 5){
								$corner_class = attributeCLass($i, $j,$liste_size);
								if($cpt < $liste_size){
									$color = fonction_color($color);
									$cpt++;
								}
								echo "<td id=".position($i,$j)." class='".$corner_class." color-".$color."'></td>";
							}
						}					
					}
					echo "</tr>";
				}
				?>
            </table>
        </div>
	</div>
</body>
</html>