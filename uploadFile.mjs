import fs from 'fs'; // Pour lire les fichiers
import { create } from 'ipfs-http-client';

// Créez un client IPFS pour interagir avec le réseau Infura
const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  apiKey: 'e759bc5af90042a1b66c5a01aae905af', // Votre clé API Infura
});

// Fonction pour uploader et pinner un fichier
const uploadFile = async (filePath) => {
  try {
    // Lire le fichier local
    const file = fs.readFileSync(filePath);
    
    // Envoi du fichier à IPFS via le client Infura
    const added = await ipfsClient.add(file);
    
    // L'URL publique de votre fichier sur IPFS
    const fileUrl = `https://ipfs.infura.io/ipfs/${added.path}`;
    console.log("Fichier uploadé avec succès. URL IPFS : ", fileUrl);

    // Pinning automatique (optionnel si tu veux épingler immédiatement)
    await pinFile(added.path);

    return fileUrl;
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier sur IPFS", error);
    if (error.message.includes("Rate limit exceeded")) {
      console.log("Le quota de bande passante est dépassé. Veuillez vérifier votre plan Infura.");
    } else if (error.message.includes("Quota exceeded")) {
      console.log("Le quota de stockage est dépassé. Veuillez vérifier votre plan Infura.");
    }
  }
};

// Fonction pour pinner un fichier après l'upload
const pinFile = async (ipfsHash) => {
  try {
    // Demander à Infura de pinner le fichier
    const pinningResponse = await ipfsClient.pin.add(ipfsHash);
    console.log("Fichier épinglé avec succès :", pinningResponse);
  } catch (error) {
    console.error("Erreur lors du pinnage du fichier", error);
    if (error.message.includes("Rate limit exceeded")) {
      console.log("Le quota pour le service de pinnage est dépassé.");
    }
  }
};

// Utiliser le script avec un chemin de fichier spécifique
const filePath = '/home/nypsus/mon-projet-deploiement/projet-BSC-Multiproducts/pagesd_de_sauvegarde/Dossier de sauvegarde de tout mon projet indicateur/public/video/egyptfutur2.mp4';
// Remplacez par le chemin vers votre fichier
uploadFile(filePath);
