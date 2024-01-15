<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
	  <script src="assets/js/user.js"> </script>
    <link rel="stylesheet" href="./assets/style.scss" />
    <title>Chasse au trésor : interface utilisateur</title>
</head>
<body>
	<div class="nav-bar">
		<p>Bienvenue sur la carte de la course</p>
	</div>
        
        <div class="centered-div">
            <table>
              
				<?php
    			$tab = array("j0","j1", "j2", "j3", "j4","j5");
				$cpt = 0;

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
									// var_dump($cpt,$liste_size,"j=".$j);	
															
									echo "<td id=".position($i,$j)." class=".$corner_class."></td>";
									$cpt++;
									
								}
							}
						}
						else{
							if($j < 5){
								$corner_class = attributeCLass($i, $j,$liste_size);
								if($cpt < $liste_size){
									$cpt++;
								}
								echo "<td id=".position($i,$j)." class=".$corner_class."></td>";
							}
						}					
					}
					echo "</tr>";
				}
				?>
            </table>
        </div>
</body>
</html>