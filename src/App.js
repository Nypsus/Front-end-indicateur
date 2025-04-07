import React, { useEffect, useState, useRef } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import WalletConnectProvider from "@walletconnect/web3-provider";
import process from 'process';
import './App.css'; // Importation du fichier CSS
import './index.css'; // Ajoute cette ligne dans ton fichier JavaScript


// Adresse du contrat USDT sur BSC (assure-toi que c'est l'adresse correcte pour le réseau que tu utilises)
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955'; // Adresse du contrat USDT sur Binance Smart Chain

// ABI pour le contrat USDT
const usdtABI = [
  // Seules les parties nécessaires pour ton utilisation, par exemple :
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_to",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];



const contractAddress = '0xCd25eee89Bb01603f0E0cf8D8C243966a926761d';
const bscTestnetRpcUrl = "https://bsc-dataseed.binance.org/"; // BSC Mainnet
const bscTestnetProvider = new ethers.providers.JsonRpcProvider(bscTestnetRpcUrl);




function App() {
  const [web3Modal, setWeb3Modal] = useState(null);
  const [provider, setProvider] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const [productInfo, setProductInfo] = useState(null);
  const [productId, setProductId] = useState('');
  const [productPrice, setProductPrice] = useState(null);
  const [bnbToUsdRate, setBnbToUsdRate] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [contractInstance, setContractInstance] = useState(null); // Déclarez `contractInstance` ici







  
  // Initialisation de Web3Modal pour la connexion aux portefeuilles
  useEffect(() => {
  const modal = new Web3Modal({
    cacheProvider: true, // Gardera en cache la dernière connexion
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider, // Utilisation de WalletConnectProvider
        options: {
          infuraId: "e759bc5af90042a1b66c5a01aae905af" // Remplace avec ton propre infura ID
        }
      },
      metamask: {
        package: null, // MetaMask ne nécessite pas de package
        
      },
      trustwallet: {
        package: WalletConnectProvider, // Utilisation de WalletConnectProvider pour Trust Wallet
        options: {
          infuraId: "pDtEhrK4AAiPfirK7qsQI25NJlgrtMu1bBcFDqV4J95GTCAR2d/8Lg" // Remplace avec ton propre infura ID
        }
      },
      
      // Ajoute d'autres options de portefeuille ici si nécessaire (par exemple : Fortmatic, etc.)
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
  const fetchBnbToUsdRate = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
      setBnbToUsdRate(response.data.binancecoin.usd);
    } catch (error) {
      console.error('Erreur lors de la récupération du taux BNB -> USD', error);
    }
  };

   // Charger les données du contrat et les informations du produit
   useEffect(() => {
    const loadBlockchainData = async () => {
      if (provider) {
        const contractAddress = '0xD62B5CFdDfd26F6219E4BF366d9DB6B1450D5905';
        const contractABI = 
[
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




        // Crée une nouvelle instance du contrat
        const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());

        // Stocke cette instance dans l'état
        setContractInstance(contract);
        
        try {
          const productDetails = await contractInstance.products("product1");
          setProductInfo(productDetails);
          setProductPrice(productDetails.price);
        } catch (error) {
          console.error("Erreur lors de la récupération des informations du produit:", error);
        }

        
      }
    };

    loadBlockchainData();
    fetchBnbToUsdRate();
  }, [provider]);



  const [loading, setLoading] = useState(false); // Ajout de l'état loading

  const fetchProductInfo = async () => {
    setLoading(true);  // On met à true pour indiquer qu'on charge les données
    try {
      // URL du fichier JSON hébergé sur IPFS via Pinata
      const ipfsUrl = 'https://gateway.pinata.cloud/ipfs/Qme4BKfGHuMukLnbf7LqZTqK6snH57eFbENeqVzLfg28eg';
      const response = await axios.get(ipfsUrl);
      const productsFromIpfs = response.data;
    
      // Vérification de la structure du JSON
      if (productsFromIpfs && productsFromIpfs.product1 && productsFromIpfs.product2 && productsFromIpfs.product3) {
        setProductInfo(productsFromIpfs);
      } else {
        console.error("Structure des produits invalide sur IPFS.");
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations du produit depuis IPFS:', error);
    } finally {
      setLoading(false);  // Lorsque les données sont chargées ou en cas d'erreur, on met loading à false
    }
  };

  
  
  useEffect(() => {
    fetchProductInfo();
  }, []);
  
  

  const sendTransaction = async (amountIn) => {
    if (!provider) {
      alert("Le provider n'est pas défini, veuillez connecter votre wallet.");
      return;
    }
  
    try {
      // Utilise le provider et signer déjà définis via Web3Modal
      const signer = provider.getSigner();
      const amountInEther = ethers.utils.parseUnits(amountIn.toString(), 18);
  
      // Obtenez le prix du gaz actuel
      const gasLimit = 200000;  // Limite de gaz pour la transaction
      const gasPrice = await provider.getGasPrice();  // Utilise le prix actuel du gaz
      const adjustedGasPrice = gasPrice.mul(2);  // Ajuste le prix du gaz si nécessaire
  
      // Vérifiez que vous avez assez de fonds
      const walletBalance = await provider.getBalance(signer.getAddress());
      if (selectedCurrency === 'BNB' && walletBalance.lt(amountInEther.add(adjustedGasPrice))) {
        alert("Solde insuffisant pour couvrir la transaction et les frais de gaz en BNB.");
        return;
      }
  
      if (selectedCurrency === 'USDT') {
        // Vérification du solde en USDT
        const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
        const usdtBalance = await usdtContract.balanceOf(signer.getAddress());
        if (usdtBalance.lt(amountInEther)) {
          alert("Solde insuffisant en USDT pour couvrir la transaction.");
          return;
        }
      }
  
      // Préparez la transaction
      const tx = {
        to: contractAddress,
        value: selectedCurrency === 'BNB' ? amountInEther : 0,  // Montant en BNB
        gasLimit: gasLimit,
        gasPrice: adjustedGasPrice,
      };
  
      // Si la devise est USDT, envoyer les tokens via le contrat
      let transactionResponse;
      if (selectedCurrency === 'USDT') {
        const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
        const tokenAmount = ethers.utils.parseUnits(amountIn.toString(), 6); // USDT a 6 décimales
        transactionResponse = await usdtContract.transferFrom(signer.getAddress(), contractAddress, tokenAmount);
        console.log("USDT envoyés au contrat.");
      } else {
        // Si la devise est BNB, envoyer la transaction en BNB
        transactionResponse = await signer.sendTransaction(tx);
        console.log("Transaction envoyée:", transactionResponse.hash);
      }
  
      // Attendez la confirmation de la transaction
      const receipt = await transactionResponse.wait(); // Cela récupère le `receipt`
      console.log("Transaction confirmée dans le bloc:", receipt.blockNumber);
  
      // Rediriger vers une nouvelle page après la transaction réussie
      window.location.href = '/Delivrance_IndicateurD.html';  // Remplace '/confirmation.html' par le chemin de la page HTML
  
    } catch (error) {
      console.error("Erreur lors de l'envoi de la transaction:", error);
      alert("Une erreur s'est produite lors de l'envoi de la transaction.");
    }
  };
  


  const checkNetwork = async () => {
    if (typeof window.ethereum !== "undefined") {
      const network = await window.ethereum.request({
        method: 'eth_chainId'
      });
  
      // Vérifie si l'utilisateur est bien sur BSC Testnet (chainId 97)
      if (network !== '0x38') { // 0x38 est le chainId pour BSC Mainnet
        alert("Veuillez vous connecter au réseau Binance Smart Chain Mainnet.");
        return false;
      }
      
      return true;
    } else {
      console.error("Ethereum n'est pas disponible.");
      alert("MetaMask ou un autre portefeuille Ethereum n'est pas installé.");
      return false;
    }
  };






  // Fonction pour réinitialiser le provider
  const resetProvider = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(newProvider); // Mettre à jour le provider

        // Attendre que React ait bien mis à jour le provider
        return newProvider.getSigner(); // Retourner le signer après que le provider ait été mis à jour
      } else {
        throw new Error("Aucun fournisseur Ethereum n'est disponible.");
      }
    } catch (error) {
      console.error("Erreur dans resetProvider:", error);
      alert("Erreur lors de la réinitialisation du provider.");
      return null;
    }
  };

  // Vérification du réseau à chaque fois qu'il change
  useEffect(() => {
    const changeNetworkHandler = async () => {
      try {
        await resetProvider(); // Remet à jour le provider lorsque le réseau change
        console.log("Le provider a été réinitialisé après le changement de réseau.");
      } catch (error) {
        console.error("Erreur lors du changement de réseau et réinitialisation du provider:", error);
      }
    };

    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on('chainChanged', changeNetworkHandler);
    }

    // Nettoyage quand le composant est démonté
    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener('chainChanged', changeNetworkHandler);
      }
    };
  }, []);
  
  


  // Fonction de gestion du paiement
  const handlePayment = async () => {
    if (loading) return;  // Empêche d'envoyer une nouvelle transaction si une est déjà en cours
    setLoading(true);  // Bloque les actions tant que la transaction est en cours

    if (!walletConnected) {
      alert("Veuillez connecter votre wallet avant de procéder.");
      setLoading(false);  // Permet de déverrouiller le bouton si une erreur survient
      return;
    }

    // Vérifie que le contrat est bien initialisé
    if (!contractInstance) {
      console.error("Le contrat n'est pas initialisé.");
      setLoading(false);  // Permet de déverrouiller le bouton si une erreur survient
      return;
    }

    // Vérifie que le produit est bien sélectionné
    if (!productId || !productInfo[productId]) {
      alert("Veuillez sélectionner un produit valide et essayer de nouveau.");
      setLoading(false);  // Permet de déverrouiller le bouton si une erreur survient
      return;
  }

    // Vérifie que l'utilisateur est sur le bon réseau
  const isCorrectNetwork = await checkNetwork();
  if (!isCorrectNetwork) {
    setLoading(false);  // Permet de déverrouiller le bouton si une erreur survient
    return; // Ne pas procéder à la transaction si l'utilisateur n'est pas sur le bon réseau
  }

  // Vérifier que le provider est disponible
  if (!provider) {
    alert(" Reconnection au provider effectué. Veuillez renouveler l'opération ");
    await resetProvider(); // Réinitialise le provider si nécessaire
    setLoading(false);
    return;
  }

  

  // Récupérer les détails du produit
  const productDetails = productInfo[productId];

  if (!productDetails || !productDetails.exists || productDetails.price <= 0) {
    alert("Produit invalide ou prix incorrect.");
    setLoading(false);
    return;
  }

  // Mise à jour du produit dans le smart contrat
  try {
    const tx = await contractInstance.setProductPrice(productId, productDetails.price);
    await tx.wait();  // Attends que la transaction soit minée
    console.log("Produit mis à jour dans le contrat avec succès !");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du produit dans le contrat:", error.message);
    alert("Erreur lors de la mise à jour du produit dans le smart contrat.");
    setLoading(false);
    return; // Si l'update échoue, on ne poursuit pas le paiement
  }

    let amountIn = 0;
    try {
      // Calculer le montant à envoyer en fonction de la devise sélectionnée
      if (selectedCurrency === 'USD') {
        amountIn = productPrice; // Pas de conversion nécessaire si en USD
      } else if (selectedCurrency === 'BNB') {
        // Si la devise est BNB, on effectue la conversion avec le taux BNB/USD
        if (!bnbToUsdRate) {
          alert("Le taux de conversion BNB vers USD est encore en cours de chargement.");
          setLoading(false);
          return;
        }
        amountIn = productPrice / bnbToUsdRate;
      } else {
        alert("Devise non supportée pour ce paiement.");
        setLoading(false);
        return;
      }
  
      // Convertir le montant à un format acceptable (fixé à 18 décimales)
      amountIn = parseFloat(amountIn).toFixed(18);
      console.log('Montant final pour la transaction:', amountIn);
  
      // Envoyer la transaction
      await sendTransaction(amountIn); // Attendre la réponse de la transaction
      setLoading(false);  // Permet de déverrouiller le bouton si une erreur survient
    } catch (error) {
      console.error("Erreur lors de l'envoi de la transaction:", error.message);
      alert("Une erreur s'est produite lors de l'envoi de la transaction. Vérifiez votre solde et les paramètres.");
    } finally {
      setLoading(false);  // Permet de déverrouiller le bouton après l'exécution
    }
  };

  
  
  // Mise à jour des informations du produit sélectionné
  const updateProductInfo = (selectedProductId) => {
    setProductId(selectedProductId);

    // Vérifie si le produit existe et s'il est valide
    if (productInfo && productInfo[selectedProductId]) {
        const productDetails = productInfo[selectedProductId];

        // Vérifie que le produit existe et a un prix valide
        if (productDetails.exists && productDetails.price > 0) {
            setProductPrice(productDetails.price);
            
            // Mise à jour du prix converti
            if (selectedCurrency === 'USD') {
                setConvertedPrice(productDetails.price.toString());
            } else if (selectedCurrency === 'BNB') {
                setConvertedPrice((productDetails.price / bnbToUsdRate).toString());
            }
        } else {
            alert("Produit invalide ou prix incorrect.");
            return;
        }
    } else {
        alert("Produit non trouvé !");
        return;
    }
};



  // Gestion du changement de devise (USD ou BNB)
  const handleCurrencyChange = (event) => {
    const newCurrency = event.target.value;
    setSelectedCurrency(newCurrency);

    if (newCurrency === 'USD') {
      setConvertedPrice(productPrice ? productPrice.toString() : null);
    } else if (newCurrency === 'BNB') {
      setConvertedPrice(productPrice ? (productPrice / bnbToUsdRate).toString() : null);
    }
  };

  return (
    <div className="App">
      {/* Afficher un message de chargement si `loading` est true */}
      {loading && <div>Chargement des produits...</div>}

      {/* Contenu principal */}
      <div className="parallax-container">
        <video id="video-background" autoPlay loop muted>
          {/* Remplace la source locale par l'URL IPFS */}
          <source 
            src="https://gateway.pinata.cloud/ipfs/QmPZ8v3KzeyH2Dqz29TZFWe4kswkUETJyesZFCFULtagwv" 
            type="video/mp4" 
          />
          Votre navigateur ne supporte pas les vidéos HTML5.
        </video>

        {/* Contenu défilant */}
        <div className="content">
          

          {/* Bouton de connexion du wallet en haut à droite */}
          <div className="wallet-connect-button">
            <button
      
              onClick={connectWallet}
              disabled={walletConnected} // Désactive le bouton une fois connecté
            >
              {walletConnected ? (
                <>
                  <span>Wallet connecté : {walletAddress}</span>
                  <span className="arrow-icon">→</span> {/* Icône flèche */}
                </>
              ) : (
                'Connecter le wallet'
              )}
            </button>
          </div>

          {/* Conteneur du formulaire de paiement */}
          <div className="payment-wrapper">
            <h1> Les Indicateurs à Levier </h1>

            {productId && productInfo && (
              <div>
                <p>Produit choisi : {productId}</p>
                <p>Prix du produit : {convertedPrice ? convertedPrice : 'Chargement...'} {selectedCurrency}</p>
                <p>Le produit est {productInfo.exists ? 'disponible' : 'indisponible'}</p>
              </div>
            )}

            <select onChange={(e) => updateProductInfo(e.target.value)} value={productId}>
              <option value="">Choisi Ton Indicateur</option>
              <option value="product1">Indicateur Daily</option>
              <option value="product2">Indicateur 4h/1h</option>
              <option value="product3">Indicateur 15mn</option>
            </select>

            <select onChange={handleCurrencyChange} value={selectedCurrency}>
              <option value="USDT">USD</option>
              <option value="BNB">BNB</option>
            </select>

            <button onClick={handlePayment}>Acheter</button>
          </div>
        </div>
      </div>
    </div>
  );

  
  
};


export default App;






