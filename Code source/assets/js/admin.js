

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

        //stop timer

        //Block réception données

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

    
