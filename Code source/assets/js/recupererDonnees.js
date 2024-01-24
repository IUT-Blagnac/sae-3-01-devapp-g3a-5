
const listNodeWithColor = [];



export async function lirePortSerie() {
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
          const lines = partialData.split('\n'); // Sépare les données en lignes
  
          // Traite chaque ligne (sauf la dernière, potentiellement incomplète)
          for (let i = 0; i < lines.length - 1; i++) {
            try {
              const jsonData = JSON.parse(lines[i]); // Convertit la ligne en objet JSON
  
              const nodeExistante = listNodeWithColor.some(item => item.node === jsonData.node);
  
              //SI C'EST UNE NOUVELLE EQUIPE
              if (!nodeExistante) {
                // Ajoute un attribut "couleur" avec une couleur générée
                jsonData.couleur = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
                
                //admin : createTableau(jsonData);
                listNodeWithColor.push(jsonData);
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

module.exports = {
    lirePortSerie: lirePortSerie
};