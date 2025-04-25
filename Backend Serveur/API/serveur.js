import express from 'express'; // Remplacer require par import
import bodyParser from 'body-parser'; // Remplacer require par import
import fetch from 'node-fetch'; // Import dynamique ES pour node-fetch
import dotenv from 'dotenv'; // Remplacer require par import
import cors from 'cors'; // Import de CORS
import serverless from 'serverless-http';

// Charger le fichier .env situé dans le répertoire parent
dotenv.config({ path: '/home/nypsus/mon-projet-deploiement/Front-end-indicateur/Backend Serveur/.env' });


// Vérifier si les variables d'environnement sont chargées correctement
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BLOCKCYPHER_API_KEY = process.env.BLOCKCYPHER_API_KEY;  // Clé API BlockCypher pour Bitcoin
const TRONSCAN_API_KEY = process.env.TRONSCAN_API_KEY;
const BSC_API_KEY = process.env.BSC_API_KEY;

if (!ETHERSCAN_API_KEY) {
    console.error("Erreur : La clé API Etherscan est manquante !");
} else {
    console.log("Clé API Etherscan chargée :", ETHERSCAN_API_KEY);
}

if (!BLOCKCYPHER_API_KEY) {
    console.error("Erreur : La clé API BlockCypher est manquante !");
} else {
    console.log("Clé API BlockCypher chargée :", BLOCKCYPHER_API_KEY);
}

if (!TRONSCAN_API_KEY) {
    console.error("Erreur : La clé API TRON est manquante !");
} else {
    console.log("Clé API TRON chargée :", TRONSCAN_API_KEY);
}
if (!BSC_API_KEY) {
    console.error("Erreur : La clé API BSC est manquante !");
} else {
    console.log("Clé API BSC chargée :", BSC_API_KEY);
}




const app = express();
// Utilisation de CORS pour permettre les requêtes cross-origin
app.use(cors({
    origin: 'http://localhost:3000', // Permettre les requêtes venant de ton frontend (localhost:3000)
    methods: ['GET', 'POST'], // Tu peux ajouter d'autres méthodes si nécessaire
}));

app.use(bodyParser.json());

// Route de base (accueil)
app.get('/', (req, res) => {
    res.send('Le serveur fonctionne !');
  });

// Stockage en mémoire des transactions en attente

let transactionsInProgress = {};  // orderId -> transaction
let addressToOrderId = {};        // address -> orderId



// Endpoint pour démarrer le processus de paiement et commencer à poller
app.post('/start-payment-check', async (req, res) => {
    const { orderId, paymentAddress, crypto, network } = req.body;  // Récupérer l'adresse directement
    console.log(`[BACKEND] Start payment check pour orderId: ${orderId}, adresse de paiement: ${paymentAddress}`);

    // Vérifie que l'orderId et l'adresse de paiement sont bien fournis
    if (!orderId || !paymentAddress) {
        return res.status(400).json({ error: 'orderId et paymentAddress sont requis' });
    }

    // Convertir network en minuscule pour correspondre aux clés dans ton mapping
    const networkKey = network.toLowerCase();  // Transformation en minuscule

    // Enregistre la transaction dans transactionsInProgress avec l'orderId comme clé
    transactionsInProgress[orderId] = {
      crypto,
      network: networkKey,  // Utilise le nom du réseau en minuscule
      paymentAddress,  // Sauvegarde l'adresse de paiement dans les transactions en cours
      orderId,  // Assure-toi que l'orderId est inclus
      status: 'pending',  // État initial
      pollingInterval: null,  // Ajoute un champ pour stocker l'intervalle
      pollingTimeout: null,   // Et un autre pour le timeout
      
    };

    // Log supplémentaire pour confirmer que les données sont bien enregistrées
    console.log(`[BACKEND] Transaction pour orderId ${orderId} enregistrée avec le réseau: ${network} et la crypto: ${crypto}`);


    addressToOrderId[paymentAddress] = orderId;

    // Démarre le polling pour vérifier l'état de la transaction
    checkPaymentStatus(orderId);

    // Retourne l'ID de la transaction au frontend
    res.json({ transactionId: orderId });
});




// Délai maximal pour le polling en secondes (ici 5 minutes)
const POLLING_TIMEOUT = 5 * 60 * 1000; // 5 minutes en millisecondes
const POLLING_INTERVAL = 10000; // 5 secondes entre chaque tentative
let transactionLastActivity = {};  // Stocke l'heure de la dernière requête reçue pour chaque transaction

// Fonction pour vérifier l'état de la transaction en utilisant l'API appropriée
const checkPaymentStatus = async (transactionId) => {
    const transaction = transactionsInProgress[transactionId];

    

    // Si la transaction est déjà confirmée, ne rien faire
    if (transaction.status === 'confirmed') {
        console.log(`[BACKEND] Transaction ${transactionId} déjà confirmée, pas de nouvelles vérifications.`);
        clearInterval(transaction.pollingInterval);  // Annuler l'intervalle
        clearTimeout(transaction.pollingTimeout);   // Annuler le timeout
        return;
    }

    // Annuler le polling s'il est en cours pour une autre transaction
    if (transaction.pollingInterval) {
        console.log(`[BACKEND] Annulation du polling pour la transaction ${transactionId}`);
        clearInterval(transaction.pollingInterval);
        clearTimeout(transaction.pollingTimeout);
    }

    // 💡 Ne pas lancer de polling pour Bitcoin et autres réseaux non pris en charge
    const unsupportedNetworks = ['bitcoin', 'tron', 'solana']; // Les réseaux à ne pas traiter avec polling
    if (unsupportedNetworks.includes(transaction.network)) {
        console.log(`[BACKEND] Réseau ${transaction.network} détecté pour ${transactionId}, le polling est ignoré (webhook utilisé).`);
        return;
    }

    // Initialiser un nouveau polling
    let attempts = 0;
    const startTime = Date.now();
    const maxRetries = 60;
    const retryDelay = 5000; // 5 secondes

    // Suivi de la dernière activité côté backend (mise à jour à chaque requête de frontend)
    let lastActivityTime = Date.now();

    transaction.pollingInterval = setInterval(async () => {
        // Vérification si 30 secondes d'inactivité sont passées
        if (Date.now() - lastActivityTime > 30000) {
            console.log(`[BACKEND] 30 secondes sans activité du frontend, arrêt du polling.`);
            transaction.status = 'failed';
            clearInterval(transaction.pollingInterval);
            clearTimeout(transaction.pollingTimeout);
            return;
        }


   
        if (transaction.status === 'confirmed' || Date.now() - startTime >= POLLING_TIMEOUT) {
            clearInterval(transaction.pollingInterval);
            clearTimeout(transaction.pollingTimeout);

            if (transaction.status !== 'confirmed') {
                transaction.status = 'failed';  // Marquer comme échouée après délai
                console.log(`[BACKEND] La transaction ${transactionId} a échoué après ${attempts} tentatives.`);
            }
            return;
        }

        let isTransactionConfirmed = false;
        console.log(`[BACKEND] Vérification de la transaction ${transactionId} sur le réseau ${transaction.network} pour l'adresse: ${transaction.paymentAddress}`);

        // Vérification du statut selon le réseau
        if (transaction.network === 'ethereum') {
            isTransactionConfirmed = await checkEthereumTransaction(transactionId);
        } else if (transaction.network === 'binance smart chain') {
            isTransactionConfirmed = await checkBSCTransaction(transactionId);
        } else if (transaction.network === 'polygon') {
            isTransactionConfirmed = await checkPolygonTransaction(transactionId);
        }

        if (isTransactionConfirmed) {
            if (transaction.status !== 'confirmed') {
                transaction.status = 'confirmed';
                console.log(`[BACKEND] Transaction ${transactionId} confirmée.`);
            }
            clearInterval(transaction.pollingInterval);
            clearTimeout(transaction.pollingTimeout);
        } else {
            attempts++;
            console.log(`Tentative ${attempts}: Transaction ${transactionId} (${transaction.paymentAddress}) non confirmée, réessayer dans 5 secondes.`);

            if (attempts >= maxRetries) {
                transaction.status = 'failed';
                console.error(`[BACKEND] Transaction ${transactionId} échouée après ${attempts} tentatives.`);
                clearInterval(transaction.pollingInterval);
            }
        }
    }, retryDelay);

    // Délai maximal pour arrêter le polling après 5 minutes
    transaction.pollingTimeout = setTimeout(() => {
        if (transaction.status === 'pending') {
            console.error(`[BACKEND] Timeout de 5 minutes pour la transaction ${transactionId}.`);
            transaction.status = 'failed';
            clearInterval(transaction.pollingInterval);  // Arrêter le polling
        }
    }, POLLING_TIMEOUT);

    // Fonction pour mettre à jour la dernière activité du frontend
    // Cela doit être appelé chaque fois qu'une requête de frontend est reçue pour cette transaction
    const updateLastActivity = () => {
        lastActivityTime = Date.now();
    };

    // Expose une méthode pour que le frontend puisse appeler cette fonction et signaler qu'il est toujours actif
    return updateLastActivity;
};




  

// Fonction pour vérifier une transaction Ethereum (ou BSC, etc.)
const checkEthereumTransaction = async (orderId) => {
    const transaction = transactionsInProgress[orderId];  // Récupère la transaction en cours via l'orderId
    const address = transaction.paymentAddress;  // Récupère l'adresse de paiement
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${ETHERSCAN_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Réponse de l'API Ethereum:", data);

        // Vérifie que la réponse contient des résultats valides sous forme de tableau
        if (Array.isArray(data.result)) {
            // Vérifie si une transaction est confirmée (isError === '0' signifie réussite)
            return data.result.some(tx => tx.isError === '0');
        } else {
            console.error("Réponse inattendue d'Etherscan:", data);
            return false;  // Si la réponse n'est pas valide
        }
    } catch (error) {
        console.error("Erreur de vérification Ethereum", error);
        return false;
    }
};

  

// Fonction pour vérifier une transaction BSC
// Un objet global pour suivre l'état de chaque transaction
// Objet pour suivre l'état de chaque transaction de manière persistante
let transactionStatus = {};  // { orderId: { status: 'confirmed' / 'pending', confirmedAt: timestamp } }

// Fonction pour vérifier la transaction et ne pas changer le statut une fois confirmé
const checkBSCTransaction = async (orderId) => {
    const transaction = transactionsInProgress[orderId];
    if (!transaction) {
        console.error(`Transaction non trouvée pour orderId: ${orderId}`);
        return false;
    }
    
    const address = transaction.paymentAddress;
    const expectedAmount = transaction.amount;  // Le montant attendu pour cette transaction
    const pollingStartTime = transaction.pollingStartTime || Date.now();  // Enregistrement du moment du polling

    // Vérification du format d'adresse avant de faire la requête
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        console.error(`Adresse BSC invalide: ${address}`);
        return false;
    }

    const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&apikey=${BSC_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "1" && Array.isArray(data.result)) {
            console.log(`[BACKEND] Réponse de l'API BSCScan pour ${orderId} pour l'adresse ${address}:`, data.result);

            // Vérification de la transaction en fonction de l'adresse et du moment du polling
            const transactionConfirmed = data.result.some(tx => {
                console.log(`Vérification de la transaction:`, tx);

                // Vérifie que la transaction a bien eu lieu après le démarrage du polling
                const isAfterPollingStart = Number(tx.timeStamp) * 1000 >= pollingStartTime;  // Convertir timestamp en millisecondes

                // Vérifie si l'adresse correspond et si la transaction a bien eu lieu après le début du polling
                const isCorrectAddress = tx.to.toLowerCase() === address.toLowerCase();
                const isNoError = tx.isError === '0';

                // Vérifie que l'orderID est correct (si l'orderID est transmis dans le tx hash ou un autre champ)
                const isCorrectOrderID = tx.hash === orderId;  // Supposons que tx.hash soit l'ID de la transaction associée à l'orderID

                // Confirmer la transaction uniquement si elle a eu lieu après le début du polling et si l'orderID correspond
                return isCorrectAddress && isNoError && isAfterPollingStart && isCorrectOrderID;
            });

            if (transactionConfirmed) {
                console.log(`[BACKEND] Transaction ${orderId} confirmée pour l'adresse BSC: ${address}`);
                transactionStatus[orderId] = { status: 'confirmed', confirmedAt: Date.now() };
                return true;
            } else {
                console.log(`Transaction ${orderId} non confirmée, réessayer dans 5 secondes.`);
                return false;
            }
        } else {
            console.error(`Réponse invalide de l'API BSC pour ${orderId}: ${JSON.stringify(data)}`);
            return false;
        }
    } catch (error) {
        console.error(`Erreur de vérification BSC pour ${orderId}:`, error);
        return false;
    }
};




  

// Fonction pour réessayer la vérification des transactions de manière continue
const pollTransactions = async () => {
    for (const orderId in transactionsInProgress) {
      const transaction = transactionsInProgress[orderId];
  
      // Ne traite pas les transactions déjà confirmées, annulées ou échouées
    if (!transaction || transaction.status === 'confirmed' || transaction.status === 'cancelled' || transaction.status === 'failed') {
        continue;
      }
  
      let checkFn;
      // Convertir network en minuscule pour la comparaison
      const networkKey = transaction.network.toLowerCase();
      switch (transaction.network) {
        case 'ethereum':
          checkFn = checkEthereumTransaction;
          break;
        case 'binance smart chain':
        case 'bsc':
          checkFn = checkBSCTransaction;
          break;
        case 'polygon':
          checkFn = checkPolygonTransaction;
          break;
        case 'bitcoin':
        case 'solana':
        case 'tron':
           // Rien à faire pour ces réseaux, peut-être avec un webhook
          console.log(`[BACKEND] Réseau ${transaction.network} détecté pour ${orderId}, le polling est ignoré.`);
          continue;

        // tu peux en ajouter d'autres si tu gères Solana, Tron, etc.
        default:
          console.warn(`[BACKEND] Réseau inconnu pour l'orderId ${orderId}: ${transaction.network}`);
          continue;
      }
  
      try {
        if (typeof checkFn !== 'function') {
            console.error('checkFn n\'est pas une fonction valide.');
            return;
          }
        const isConfirmed = await checkFn(orderId);
  
        if (isConfirmed) {
          transaction.status = 'confirmed';
          transactionStatus[orderId] = { status: 'confirmed', confirmedAt: Date.now() };
          clearInterval(transaction.pollingInterval);
          clearTimeout(transaction.pollingTimeout);
          console.log(`[BACKEND] ✅ Transaction confirmée pour ${orderId}`);
  
          // 🧼 Nettoyage du mapping adresse -> orderId
          Object.keys(addressToOrderId).forEach(address => {
            if (addressToOrderId[address] === orderId) {
              delete addressToOrderId[address];
            }
          });
        } else {
          console.log(`[BACKEND] ⏳ Transaction ${orderId} toujours en attente...`);
        }
      } catch (error) {
        console.error(`[BACKEND] Erreur lors du check de la transaction ${orderId}:`, error);
      }
    }
  };
  
  

// Démarrage de la vérification pour toutes les transactions en cours
const startTransactionPolling = () => {
  setInterval(() => {
    pollTransactions();  // Vérifier toutes les transactions en cours toutes les 5 secondes
  }, 5000);
};

// Appel de la fonction pour démarrer le processus
startTransactionPolling();





  

// Fonction pour vérifier une transaction Polygon
const checkPolygonTransaction = async (orderId) => {
  const transaction = transactionsInProgress[orderId];
  const address = transaction.paymentAddress;  // Utiliser l'adresse de paiement directement
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Réponse de l'API Polygon:", data);
    if (data.status === "1") {
      const transactions = data.result;
      // Vérifie si des transactions sont envoyées à l'adresse
      const isPaymentReceived = transactions.some(tx => tx.to.toLowerCase() === address.toLowerCase());
      return isPaymentReceived; // Renvoie 'true' si des paiements sont reçus
    }
    return false; // Renvoie 'false' si aucun paiement n'est trouvé
  } catch (error) {
    console.error("Erreur de vérification de l'adresse Polygon", error);
    return false; // Si une erreur survient, on renvoie false
  }
};



const SOLANA_RPC_URL = 'https://nameless-flashy-diagram.solana-mainnet.quiknode.pro/12155a9597e3d09f71131d27a9cbad481a307238/';


  




  


// Endpoint pour vérifier le statut de la transaction
app.get('/check-payment-status', (req, res) => {
  const { transactionId } = req.query;
  console.log(`[BACKEND] Requête pour vérifier le statut : ${transactionId}`);
  const transaction = transactionsInProgress[transactionId];

  if (transaction) {
    res.json({ status: transaction.status });
  } else {
    console.log(`[BACKEND] Transaction ${transactionId} non trouvée`);
    res.status(404).json({ status: 'Transaction non trouvée' });
  }
});




// Webhook pour Bitcoin via BlockCypher
// Webhook pour Bitcoin via BlockCypher
app.post('/webhook/bitcoin', async (req, res) => {
    const { address, txs } = req.body;  // Récupère l'adresse et les transactions envoyées
    console.log("[BACKEND] Webhook reçu pour l'adresse Bitcoin:", address);

    // Recherche la transaction dans transactionsInProgress par l'adresse
    const orderId = addressToOrderId[address];
    const transactionFound = transactionsInProgress[orderId];

    if (!transactionFound) {
        console.log(`Aucune transaction trouvée pour l'adresse ${address}. Impossible de confirmer la transaction.`);
        return res.status(404).json({ status: 'Transaction non trouvée' });
    }

    // Si la transaction est déjà confirmée, ignorer le webhook
    if (transactionFound.status === 'confirmed') {
        console.log(`La transaction ${transactionFound.orderId} est déjà confirmée.`);
        return res.status(200).json({ status: 'confirmed' });
    }

    // Vérifie si un paiement a été reçu en vérifiant les sorties de la transaction
    const isPaymentReceived = txs.some(tx => tx.outputs.some(output => output.addresses.includes(address)));
    
    if (isPaymentReceived) {
        console.log(`Paiement reçu pour l'adresse Bitcoin : ${address}`);
        transactionFound.status = 'confirmed';
        console.log(`[BACKEND] Transaction confirmée pour l'orderId: ${transactionFound.orderId}`);

        // Arrête le polling si la transaction est confirmée
        clearInterval(transactionFound.pollingInterval);
        clearTimeout(transactionFound.pollingTimeout);
    } else {
        console.log(`Aucun paiement reçu pour l'adresse Bitcoin : ${address}`);
    }

    res.status(200).json({ status: 'received' });
});




// Webhook pour Tron (via Tronscan ou autre service)
app.post('/webhook/tron', async (req, res) => {
    const { address, transaction } = req.body;

    console.log("[BACKEND] Webhook reçu pour l'adresse Tron:", address);

    const orderId = addressToOrderId[address];
    const transactionRecord = transactionsInProgress[orderId];

    if (!transactionRecord) {
        console.log(`Aucune transaction trouvée pour l'adresse Tron : ${address}`);
        return res.status(404).json({ status: 'Transaction non trouvée' });
    }

    if (transactionRecord.status === 'confirmed') {
        console.log(`La transaction ${orderId} est déjà confirmée.`);
        return res.status(200).json({ status: 'confirmed' });
    }

    if (transaction && transaction.to_address === address) {
        console.log(`Paiement reçu sur l'adresse Tron : ${address}`);
        transactionRecord.status = 'confirmed';
        clearInterval(transactionRecord.pollingInterval);
        clearTimeout(transactionRecord.pollingTimeout);
        console.log(`[BACKEND] Transaction confirmée pour l'orderId: ${orderId}`);
    } else {
        console.log(`Aucun paiement reçu pour l'adresse Tron : ${address}`);
    }

    res.status(200).json({ status: 'received' });
});




  // Webhook pour Solana (via Solscan ou autre service)
  app.post('/webhook/solana', async (req, res) => {
    const { address, transaction } = req.body;

    console.log("[BACKEND] Webhook reçu pour l'adresse Solana:", address);

    const orderId = addressToOrderId[address];
    const transactionRecord = transactionsInProgress[orderId];

    if (!transactionRecord) {
        console.log(`Aucune transaction trouvée pour l'adresse Solana : ${address}`);
        return res.status(404).json({ status: 'Transaction non trouvée' });
    }

    if (transactionRecord.status === 'confirmed') {
        console.log(`La transaction ${orderId} est déjà confirmée.`);
        return res.status(200).json({ status: 'confirmed' });
    }

    if (transaction && transaction.to_address === address) {
        console.log(`Paiement reçu sur l'adresse Solana : ${address}`);
        transactionRecord.status = 'confirmed';
        clearInterval(transactionRecord.pollingInterval);
        clearTimeout(transactionRecord.pollingTimeout);
        console.log(`[BACKEND] Transaction confirmée pour l'orderId: ${orderId}`);
    } else {
        console.log(`Aucun paiement reçu pour l'adresse Solana : ${address}`);
    }

    res.status(200).json({ status: 'received' });
});





// Route pour annuler une transaction
// Route pour annuler le processus de polling pour une transaction donnée
app.post('/cancel-payment-check', (req, res) => {
    const { transactionId } = req.body;
    console.log('[BACKEND] Requête d’annulation reçue pour:', transactionId); // 👈 Ajoute ça
    
    // Vérifie si la transaction existe
    const transaction = transactionsInProgress[transactionId];
    
    if (transaction) {
        // Arrête le polling et le timeout
        clearInterval(transaction.pollingInterval);
        clearTimeout(transaction.pollingTimeout);
        
        // Marque la transaction comme annulée
        transaction.status = 'cancelled';
        

        // Supprimer le mapping dans addressToOrderId pour éviter des conflits d’adresses
        Object.keys(addressToOrderId).forEach(address => {
            if (addressToOrderId[address] === transactionId) {
            delete addressToOrderId[address];
            }
        });
  


        
        console.log(`Polling annulé pour la transaction ${transactionId}`);
        res.json({ status: 'Transaction annulée' });
    } else {
        res.status(404).json({ status: 'Transaction non trouvée' });
    }
});




  

// Tu exportes l'API comme une fonction serverless
export default serverless(app);
