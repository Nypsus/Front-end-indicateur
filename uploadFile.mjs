import fs from 'fs';  // Assure-toi que fs est bien importé
import axios from 'axios';  // Utilisation d'axios pour faire les requêtes HTTP
import FormData from 'form-data'; // FormData pour envoyer le fichier en multipart/form-data

const pinataApiKey = '2ccabcdc88ee09cfa216'; // Remplace par ta clé API Pinata
const pinataApiSecret = '992bad1378e39700d84af258ce8d37ae1efaea84436148234147dbb2fe5def4b'; // Remplace par ta clé secrète Pinata

const uploadFile = async (filePath) => {
  try {
    // Lire le fichier à uploader
    const file = fs.createReadStream(filePath);

    // Préparer la requête pour Pinata
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataApiSecret,
        ...formData.getHeaders() // Ajouter les headers pour FormData
      }
    };

    // Faire la requête pour uploader le fichier
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, config);
    
    // Afficher l'URL du fichier uploadé
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    console.log('Fichier uploadé avec succès, URL IPFS:', ipfsUrl);

    return ipfsUrl;

  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier sur Pinata:', error.response ? error.response.data : error.message);
  }
};

// Exemple d'appel à la fonction uploadFile
const filePath = '/home/nypsus/mon-projet-deploiement/Front-end-indicateur/public/video/egyptfutur2.mp4'; // Remplace ce chemin par le chemin réel de ton fichier
uploadFile(filePath);
