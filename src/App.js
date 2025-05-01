import React, { useEffect, useState, useRef } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import WalletConnectProvider from "@walletconnect/web3-provider";
import './App.css'; // Importation du fichier CSS
import './index.css'; // Ajoute cette ligne dans ton fichier JavaScript


// Adresse du contrat USDT sur BSC (assure-toi que c'est l'adresse correcte pour le réseau que tu utilises)
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955'; // Adresse du contrat USDT sur Binance Smart Chain

// ABI pour le contrat USDT
const usdtABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)"
];




const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const contractAddress = '0xCd25eee89Bb01603f0E0cf8D8C243966a926761d';
const bscTestnetRpcUrl = "https://bsc-dataseed.binance.org/"; // BSC Mainnet
const bscTestnetProvider = new ethers.providers.JsonRpcProvider(bscTestnetRpcUrl);
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "addAllowedToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "productId",
        "type": "string"
      }
    ],
    "name": "pay",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "removeAllowedToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "tokens",
        "type": "address[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "productId",
        "type": "string"
      }
    ],
    "name": "PaymentReceived",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "productId",
        "type": "string"
      }
    ],
    "name": "removeProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "productId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "setProductPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "allowedTokens",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "isTokenAllowed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "products",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"

    
  }
];



function App() {
  const [web3Modal, setWeb3Modal] = useState(null);
  const [provider, setProvider] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const [productInfo, setProductInfo] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null); // ou un ID de produit par défaut

  const [productId, setProductId] = useState('');
  const [productPrice, setProductPrice] = useState(null);
  const [bnbToUsdRate, setBnbToUsdRate] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [contractInstance, setContractInstance] = useState(null); // Déclarez `contractInstance` ici
  const products = {
    product1: { price:  0.3184, exists: true, title: "Indicateur Daily" },
    product2: { price: 0.5027, exists: true, title: "Indicateur 4h/1h" },
    product3: { price: 0.8430, exists: true, title: "Indicateur 15mn" }
  };

  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;
  };
  
  const isMobile = () => {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };
  
  

  






  
  // Initialisation de Web3Modal pour la connexion aux portefeuilles
  useEffect(() => {
    const modal = new Web3Modal({
      cacheProvider: false, // ← mieux de désactiver si tu gères manuellement les connexions
      providerOptions: {
        injected: {
          package: null,
          display: {
            name: "MetaMask",
            description: "Connexion via l'extension MetaMask",
          }
        }
      }
    });
    

  setWeb3Modal(modal);

  // Vérifie si la modale est présente dans le DOM
  const interval = setInterval(() => {
    const web3ModalElement = document.querySelector('.web3-modal-container');
    if (web3ModalElement) {
      web3ModalElement.style.zIndex = '999999'; // Modale au-dessus de tout
      clearInterval(interval);
    }
  }, 100);

  return () => clearInterval(interval);

}, []);

  


  // Masquer l'iframe si elle est présente
  const hideIframe = () => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.style.display = 'none'; // ou iframe.remove() si tu préfères
    }
  };

  // Appel de la fonction pour masquer l'iframe au moment où Web3Modal est chargé
  hideIframe();
  

  // Fonction pour reconnecter MetaMask
  const reconnectToMetaMask = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask n'est pas installé !");
      return;
    }

    try {
      
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{
          eth_accounts: {}
        }]
      });

      setTimeout(async () => {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setWalletAddress(address);
        setWalletConnected(true);
        alert(`Compte connecté : ${address}`);
      }, 1000);
    } catch (error) {
      console.error('Erreur de connexion à MetaMask :', error);
      alert('Échec de la connexion à MetaMask.');
    }
  };


  // Connexion au wallet via Web3Modal
  
  const connectWallet = async () => {
    if (isMobileDevice()) {
      // Redirection mobile vers MetaMask avec ton site embarqué
      const dappURL = "leverage-indicator.netlify.app/"; // ← remplace par ton vrai domaine SANS https://
      const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappURL}`;
  
      // Petite sécurité : tenter de rediriger proprement
      try {
        window.location.href = metamaskAppDeepLink;
      } catch (err) {
        alert("Veuillez installer MetaMask pour continuer.");
        // Redirection vers App Store ou Play Store
        window.location.href = "https://metamask.io/download/";
      }
  
      return; // On ne continue pas plus loin sur mobile
    }

     // Cas desktop → si MetaMask n’est pas installé
    if (typeof window.ethereum === "undefined" || !window.ethereum.isMetaMask) {
      alert("MetaMask nest pas installé. Vous allez être redirigé vers la page de téléchargement.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }


    // Desktop flow (comme avant)
    if (!web3Modal) {
      console.error("Web3Modal non initialisé");
      return;
    }
    
    try {
      console.log("Tentative de connexion au wallet...");
      
      
      // Connexion via Web3Modal
      const instance = await web3Modal.connect();
      const newProvider = new ethers.providers.Web3Provider(instance);
      
      // S'assurer que le provider est correctement défini
      if (!newProvider) {
        console.error("Le fournisseur Web3 n'a pas été correctement créé");
        return;
      }
      
      setProvider(newProvider);
  
      // Récupérer l'adresse du wallet
      const signer = newProvider.getSigner();
      const address = await signer.getAddress();
      
      setWalletAddress(address);
      setWalletConnected(true);
      
      console.log(`Wallet connecté: ${address}`);
    } catch (error) {
      console.error("Erreur lors de la connexion au portefeuille:", error);
      alert("Erreur de connexion au portefeuille. Veuillez connecter votre wallet.");
      // Ferme Web3Modal
      web3Modal.clearCachedProvider();

      // Relance le processus de reconnexion via MetaMask
      try {
        if (typeof window.ethereum !== "undefined") {
          await reconnectToMetaMask();
        } else {
          alert("MetaMask n'est pas installé.");
        }
      } catch (retryError) {
        console.error("Échec de la reconnexion à MetaMask", retryError);
        alert("La reconnexion à MetaMask a échoué.");
      }
    }
  };
  

  // Récupération du taux de conversion BNB vers USD
  const getBNBToUSDTRate = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
      const rate = response.data.binancecoin.usd;
  
      // Vérifie si le taux est bien récupéré et l'affiche
      console.log("Taux de conversion BNB -> USDT : ", rate);
      setBnbToUsdRate(rate);
    } catch (error) {
      console.error('Erreur lors de la récupération du taux BNB -> USDT', error);
    }
  };

   // Charger les données du contrat et les informations du produit
   useEffect(() => {
    const loadBlockchainData = async () => {
      if (provider) {
        const contractAddress = '0xCd25eee89Bb01603f0E0cf8D8C243966a926761d';
        const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());
        
        try {
          // Suppression de la récupération via le contrat
          // const productDetails = await contract.products(selectedProductId);
          // setProductInfo(productDetails);
          // setProductPrice(productDetails.price);
  
          setContractInstance(contract); // Cette ligne peut être conservée si tu veux garder une référence au contrat, mais elle est inutilisée pour le moment.
        } catch (error) {
          console.error("Erreur lors de la récupération des informations du produit:", error);
        }
      }
    };
    loadBlockchainData();
    getBNBToUSDTRate();
  }, [provider, selectedProductId]);  // Retirer cette partie puisque tu n'as plus besoin de récupérer les produits du smart contract.
  
  
  
  //Changement automatique de reseau si mauvais reseau 

  const switchNetwork = async () => {
    try {
      // Tenter de changer automatiquement le réseau
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // ID de la Binance Smart Chain (BSC)
      });
    } catch (error) {
      if (error.code === 4902) {
        // Si le réseau n'est pas disponible dans MetaMask, demander à l'utilisateur de l'ajouter
        alert("Le réseau Binance Smart Chain n'est pas configuré dans MetaMask. Ajoutez-le et réessayez.");
      } else {
        console.error("Erreur lors du changement de réseau:", error);
      }
    }
  };

  
  const checkNetwork = async () => {
    const networkId = await window.ethereum.request({ method: 'eth_chainId' });
    const expectedNetworkId = '0x38'; // ID de la Binance Smart Chain (BSC), à changer selon le réseau attendu
  
    if (networkId !== expectedNetworkId) {
      alert(`Vous êtes connecté au réseau ${networkId}. Nous allons essayer de vous connecter au réseau Binance Smart Chain.`);
      await switchNetwork(); // Tente de changer automatiquement de réseau
      return false;
    }
    return true;
  };
  
  




  const [loading, setLoading] = useState(false); // Ajout de l'état loading
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  
  
  
 
  const [errorMessage, setErrorMessage] = useState('');
  
  
  
  
  // Mise à jour des informations du produit
const updateProductInfo = (selectedProductId) => {
  if (!selectedProductId) {
    // Si aucun produit n'est sélectionné, on réinitialise tout
    setProductInfo(null);
    setProductPrice(null);
    setConvertedPrice(null);
    return;
  }

  const productDetails = products[selectedProductId];  // Utilisation de l'objet local products
  if (productDetails) {
    const { price, exists } = productDetails;
    setProductPrice(price);  // Met à jour le prix
    
    // Mise à jour des informations du produit
    setProductInfo({ 
      price, 
      exists 
    });

    // Si le taux de conversion est disponible, calculer le prix en USDT et le mettre dans productInfo
    if (bnbToUsdRate) {
      const convertedPrice = Math.round(price * bnbToUsdRate);
      setConvertedPrice(convertedPrice.toString());  // Met à jour le prix en USDT
    }
  } else {
    setProductInfo({ exists: false });  // Si le produit n'existe pas
    setProductPrice(null);
    setConvertedPrice(null);
  }
};
  
  
  


const fetchProductPrice = async (productId) => {
  if (!window.ethereum) {
    alert('MetaMask est requis pour interagir avec ce contrat.');

    // Réinitialiser l'interface si MetaMask n'est pas disponible
    setSelectedProductId("");
    setProductInfo(null);
    setProductPrice(null);
    setConvertedPrice(null);
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  try {
    setLoading(true);

    const product = await contract.products(productId);

    if (product.exists) {
      let priceInWei = product.price.toString();
      console.log('Valeur brute récupérée du smart contract :', priceInWei);

      let priceBNB = ethers.utils.formatUnits(priceInWei, 18);
      console.log('Prix du produit après conversion :', priceBNB, 'BNB');

      return { priceInBNB: parseFloat(priceBNB) };
    } else {
      console.log('Produit non trouvé');

      // Produit inexistant → réinitialiser l'interface
      setSelectedProductId("");
      setProductInfo(null);
      setProductPrice(null);
      setConvertedPrice(null);
      return null;
    }

  } catch (error) {
    console.error('Erreur lors de la récupération du prix', error);

    // En cas d'erreur → réinitialiser l'interface
    setSelectedProductId("");
    setProductInfo(null);
    setProductPrice(null);
    setConvertedPrice(null);
    return null;
  } finally {
    setLoading(false);
  }
};

  







// Fonction pour vérifier si un produit existe dans le contrat
const checkProductExistence = async (productId) => {
  try {
    console.log(`Vérification de l'existence du produit : ${productId}`);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Appeler la fonction "products" du contrat pour vérifier si le produit existe
    const product = await contract.products(productId);
    
    if (product.exists) {
      console.log(`Produit trouvé : ${productId}`);
      return true; // Le produit existe
    } else {
      console.log(`Produit non trouvé : ${productId}`);
      return false; // Le produit n'existe pas
    }
  } catch (err) {
    console.error("Erreur lors de la vérification du produit :", err);
    alert("Erreur lors de la vérification du produit.");
    return false; // En cas d'erreur, on retourne false
  }
};


// Fonction qui sera appelée au clic sur le bouton "Acheter"
const handleBuyButtonClick = async () => {
  console.log("Clic sur le bouton Payer !");

  // Vérifier si l'utilisateur est sur le bon réseau (BSC)
  const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
  const expectedChainId = '0x38'; // ID de la Binance Smart Chain (BSC)

  if (currentChainId !== expectedChainId) {
    console.log("Mauvais réseau, bascule sur le BSC...");

    // Essayer de basculer sur le réseau BSC
    await switchNetwork();

    // Attendre un peu pour s'assurer que le réseau a été changé
    setTimeout(async () => {
      // Relancer automatiquement la fonction de paiement après le changement de réseau
      await processPayment();  // Cette fonction gère la logique de paiement
    }, 1000); // Attendre 1 seconde pour s'assurer que le changement de réseau est effectué
  } else {
    // Si l'utilisateur est déjà sur le bon réseau, procéder directement à la transaction
    await processPayment();
  }
};


// Fonction pour gérer le paiement
// Fonction pour gérer le paiement
const processPayment = async () => {
  // Vérifier si le produit existe avant de procéder
  const productExists = await checkProductExistence(selectedProductId);

  if (productExists) {
    // Si le produit existe, récupérer le prix du produit
    const result = await fetchProductPrice(selectedProductId);
    console.log("Résultat fetchProductPrice:", result);

    if (result?.priceInBNB) {
      const gasPrice = ethers.utils.parseUnits("5", "gwei");
      const gasLimit = 300000;
      const amountIn = ethers.utils.parseEther(result.priceInBNB.toString());

      // Vérifier le solde de l'utilisateur avant de procéder
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const balance = await provider.getBalance(await signer.getAddress());

      // Afficher le solde actuel de l'utilisateur (facultatif, mais utile pour l'UX)
      console.log(`Solde actuel: ${ethers.utils.formatEther(balance)} BNB`);

      // Comparer le solde de l'utilisateur avec le montant de la transaction
      if (balance.lt(amountIn)) {
        alert("Vous n'avez pas assez de BNB pour effectuer cette transaction.");
        return; // Ne pas poursuivre la transaction si le solde est insuffisant
      }

      // Si le solde est suffisant, procéder à la transaction
      try {
        console.log("Tentative de paiement avec le montant:", amountIn.toString());

        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        const tx = await contract.pay(
          "0x0000000000000000000000000000000000000000", // Adresse 0 pour BNB
          amountIn,
          selectedProductId, // ID du produit
          {
            value: amountIn, // Pour les paiements en BNB, la valeur est attachée à la transaction
            gasLimit: gasLimit,
            gasPrice: gasPrice,
          }
        );

        console.log("Transaction envoyée:", tx);
        // Attendre la confirmation de la transaction
        await tx.wait();
        alert("Achat effectué avec succès !");
        
        // Rediriger l'utilisateur après un paiement réussi
        window.location.href = '/Delivrance_IndicateurD.html';
  
      } catch (error) {
        console.error("Erreur lors du paiement:", error);
        alert("Erreur lors du paiement. Veuillez réessayer.");
      }
    } else {
      alert("Le prix du produit est introuvable.");
    }
  } else {
    alert("Ce produit n'existe pas dans le contrat.");
  }
};






// useEffect pour récupérer les taux de conversion quand la crypto ou le produit change
useEffect(() => {
  if (selectedProductId) {
    
    getBNBToUSDTRate();
  }
}, [selectedProductId]);

  

// Charger les taux de conversion et les données au démarrage
useEffect(() => {
  getBNBToUSDTRate();
}, []);




const handleProductSelection = async (event) => {
  const selectedId = event.target.value;
  setSelectedProductId(selectedId);

  if (selectedId === "") {
    setProductInfo(null);
    setProductPrice(null);
    setConvertedPrice(null);
    return;
  }

  updateProductInfo(selectedId);

  const result = await fetchProductPrice(selectedId);

  if (result?.priceInBNB !== null && !isNaN(result.priceInBNB)) {
    setProductInfo((prevState) => ({
      ...prevState,
      priceInBNB: result.priceInBNB
    }));
  } else {
    // En cas d’erreur (ex : MetaMask manquant), on réinitialise le selecteur
    setSelectedProductId("");
    setProductInfo(null);
    setProductPrice(null);
    setConvertedPrice(null);
    alert("Impossible de charger les données du produit. Veuillez vous assurer que MetaMask est installé.");
  }
};


const redirectToMetaMaskApp = () => {
  const dappURL = "www.tonsite.com"; // Remplace par ton domaine
  const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappURL}`;

  try {
    window.location.href = metamaskAppDeepLink;
  } catch (err) {
    alert("MetaMask n'est pas installé. Vous pouvez le télécharger ici : https://metamask.io/download/");
  }
};


  
  
  
// Affichage de l'interface utilisateur
return (
  <div className="App">
    <div className="parallax-container">
      <video id="video-background" autoPlay loop muted>
        <source src="https://gateway.pinata.cloud/ipfs/QmPZ8v3KzeyH2Dqz29TZFWe4kswkUETJyesZFCFULtagwv" type="video/mp4" />
        Votre navigateur ne supporte pas les vidéos HTML5.
      </video>


      {/* Affichage du bouton sur mobile seulement */}
      {isMobileDevice() && !walletConnected && (
        <div className="mobile-wallet-redirect">
          <button onClick={redirectToMetaMaskApp}>Ouvrir dans MetaMask</button>
        </div>
      )}

      <div className="content">
        <div className="wallet-connect-button">
          <button onClick={connectWallet} disabled={walletConnected}>
            {walletConnected ? (
              <>
                <span>Wallet connecté : {walletAddress}</span>
                <span className="arrow-icon">→</span>
              </>
            ) : (
              'Connecter le wallet'
            )}
          </button>
        </div>

        <div className="payment-wrapper">
          <h1>Les Indicateurs à Levier</h1>

          {productInfo && (
            <div>
              <p>Produit choisi : {products[selectedProductId]?.title}</p>
              <p>Prix du produit en BNB : {productInfo.priceInBNB ? productInfo.priceInBNB + " BNB" : "Chargement..."}</p>
              <p>Prix du produit en USDT : {convertedPrice || "Chargement..."} USDT</p>
              <p>Le produit est {productInfo.exists ? 'disponible' : 'indisponible'}</p>
            </div>
          )}

          <select
            key={selectedProductId || 'empty'}
            onChange={handleProductSelection} 
            value={selectedProductId}
          >
            <option value="">Sélectionnez un produit</option>
            <option value="product1">Indicateur Daily</option>
            <option value="product2">Indicateur 4h/1h</option>
            <option value="product3">Indicateur 15mn</option>
          </select>

          <button onClick={handleBuyButtonClick}>
            Payer pour le produit en BNB
          </button>

          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
      </div>
    </div>
  </div>
);

};

export default App;