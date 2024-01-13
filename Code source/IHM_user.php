<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="./assets/style.scss" />
    <title>Chasse au trésor : interface utilisateur</title>
</head>
<body>
	<div class="nav-bar">
		<h1>Bienvenue sur la carte de la course</h1>
	</div>
        
        <div class="centered-div">
            <table>
                <!-- <tr id="1">
                    <td class="rounded-left"></td>
                    <td></td>
                    <td></td>
					<td></td>
					<td class="corner-top-right"></td>
                </tr>	
				<tr id="2">
					<td class="corner-top-left"></td>
					<td></td>
					<td></td>
					<td></td>
					<td class="corner-bottom-right"></td>
				</tr>
				<tr id="3">
                    <td class="corner-bottom-left"></td>
                    <td></td>
                    <td></td>
					<td></td>
					<td class="corner-top-right"></td>
                </tr>
				<tr id="4">
					<td class="rounded-left"></td>
					<td></td>
					<td></td>
					<td></td>
					<td class="corner-bottom-right"></td>
				</tr> -->
				<?php
    			$tab = array("j1", "j2", "j3", "j4", "j5", "j6", "j7","j8","j9","j10","j11","j12");
				$cpt = 0;

				// Utilisation de la fonction count pour obtenir la taille de la liste
				$liste_size = count($tab);

				function position($i,$j){
					if($i%2 == 0){
						return (5*$i)+$j;
					}
					else{
						return (5*$i+4)-$j;
					}
				};

				function attributeCLass( $i, $j,$liste_size){
					
					if($i%2 == 0){
						if($j == 0 && $i==0){
							return "rounded-left";
						}if ($j == 0 && $i!=0){
							return "corner-bottom-left";
						}
						else if($j == 4 ){
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
						if($j == 0){
							return "corner-top-left";
						}
						else if($j == 4){
							return "corner-bottom-right";
						}
						else if($i % 2 != 0 && position($i,$j) == $liste_size-1){
							return "rounded-left";
						}

						else{
							return "";
						}
					}


					
				};
				// liste-size on le divise par cinq et on l'arrondi au superieur
				$rep_max=$liste_size/5;
				$rep_max=ceil($rep_max);
				// var_dump($rep_max);
    
				for($i = 0; $i <1000; $i++) {
					echo "<tr id=' $i'>";
					for ($j = 0; $j <$liste_size ; $j++) {
						if($i%2 == 0){
							if($j < 5){
								if($cpt < $liste_size){	
									$corner_class = attributeCLass($i, $j,$liste_size);
									// var_dump($i,$j);							
									echo "<td id=".position($i,$j)." class=".$corner_class.">".position($i,$j)."</td>";
									$cpt++;
								}
							}
						}
						else{
							if($j < 5){
								if($cpt < $liste_size){	
									$corner_class = attributeCLass($i, $j,$liste_size);
									// var_dump($i,$j);							
									echo "<td id=".position($i,$j)." class=".$corner_class.">".position($i,$j)."</td>";
									
								}
							}
						}
						
						
					}

					

					echo "</tr>";
				}
				?>
            </table>
        </div>
        <?php
         echo"";
         ?>
</body>
</html>