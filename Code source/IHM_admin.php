<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"/>
	<title>Chasse au trésor : interface administrateur</title>
	<link rel="stylesheet" href="style.css">
	<script src="admin.js" defer></script>
	<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
</head>
<body>
		<h1>Bienvenue sur l'interface administrateur !</h1>

		<button onclick="afficherPopup('contenu', false)"> MESSAGE </button>
		<button> FIN </button>
		<button onclick="togglepause()"> PAUSE </button>
		<button onclick="window.open('IHM_user.php', '_blank', 'noopener noreferrer')">IHM User</button>

		
		<!-- Pour mettre en pause -->
		<div class="dark" id="dark"></div>

		<div class="overlaycenter" id="pause_icon">
    		<img src="assets/images/pause_icon.png" onclick="togglepause()">
		</div>


		<!-- Pour les notifications -->
		<div class="popup" id="popup">
				<div class="popup-content" id="popupContent">
				</div>
			</div>


		<!-- Tableau des équipes -->
		<div class="tabEquipes">
			
			<table>
				<tr>
					<b>
					<td rowspan ="4" style="width:15%"> <center> Equipe A </center> </td>
					<td class = "label" > Id Capteur </td>
					<td class = "label" > Trouvé ? </td>
					<td class = "label" > Tps </td>
					</b>
				</tr>
				<tr>
					<td> 123 </td>
					<td> <img class= "icon" src="assets/images/check.png"> </td>
					<td> 00:45 </td>
				</tr>
				<tr>
					<td> 456 </td>
					<td> <img class= "icon" src="assets/images/check.png">  </td>
					<td> 01:26 </td>
				</tr>
				<tr>
					<td> 789 </td>
					<td>  </td>
					<td> --:-- </td>
				</tr>
			</table>

			<table>
				<tr>
					<b>
					<td rowspan ="4" style="width:15%"> <center> Equipe B </center> </td>
					<td class = "label" > Id Capteur </td>
					<td class = "label" > Trouvé ? </td>
					<td class = "label" > Tps </td>
					</b>
				</tr>
				<tr>
					<td> 123 </td>
					<td> <img class= "icon" src="assets/images/check.png"> </td>
					<td> 00:32 </td>
				</tr>
				<tr>
					<td> 456 </td>
					<td>   </td>
					<td> --:-- </td>
				</tr>
				<tr>
					<td> 789 </td>
					<td>  </td>
					<td> --:-- </td>
				</tr>
			</table>
		</div>
</body>
</html>

