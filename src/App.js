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
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)"
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
  const [selectedProductId, setSelectedProductId] = useState(null); // ou un ID de produit par défaut

  const [productId, setProductId] = useState('');
  const [productPrice, setProductPrice] = useState(null);
  const [bnbToUsdRate, setBnbToUsdRate] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [contractInstance, setContractInstance] = useState(null); // Déclarez `contractInstance` ici
  const products = {
    product1: { price: 5, exists: true, title: "Indicateur Daily" },
    product2: { price: 295, exists: true, title: "Indicateur 4h/1h" },
    product3: { price: 495, exists: true, title: "Indicateur 15mn" }
  };
  






  
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
      // Adresse du contrat et ABI
      const contractAddress = '0xCd25eee89Bb01603f0E0cf8D8C243966a926761d';
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




        // Crée une nouvelle instance du contrat avec le provider
      const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());

      // Appel direct à la méthode du contrat, sans attendre que contractInstance soit mis à jour
      try {
        const productDetails = await contract.products("product1");
        setProductInfo(productDetails);
        setProductPrice(productDetails.price);
      } catch (error) {
        console.error("Erreur lors de la récupération des informations du produit:", error);
      }
      
      // Stocke cette instance dans l'état
      setContractInstance(contract);
    }
  };

  loadBlockchainData();
  fetchBnbToUsdRate();
}, [provider]);  // Dépendance sur 'provider' uniquement, pas besoin de contractInstance ici



  
  
  
  
  




  const [loading, setLoading] = useState(false); // Ajout de l'état loading
  const [transactionInProgress, setTransactionInProgress] = useState(false);

  
  
  // Fonction pour approuver USDT
  const approveUSDT = async (amountToSend) => {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
  
    try {
      const allowance = await usdtContract.allowance(await signer.getAddress(), contractAddress);
      console.log("Allowance actuelle:", allowance.toString());
  
      if (allowance.lt(amountToSend)) {
        console.log("Allowance insuffisante, approbation en cours...");
        const tx = await usdtContract.approve(contractAddress, amountToSend);
        const receipt = await tx.wait();
  
        if (receipt.status === 1) {
          console.log("Allowance mise à jour !");
        } else {
          console.error("L'approbation de l'allowance a échoué.");
          throw new Error("Échec de l'approbation de l'allowance.");
        }
      } else {
        console.log("Allowance suffisante.");
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation de l'allowance USDT :", error);
    }
  };
  
  
  

  
  
  
  
  // Fonction pour le paiement
  const handlePayment = async () => {
    if (!walletConnected) {
      alert("Veuillez connecter votre wallet avant de procéder.");
      return;
    }
  
    if (productId && productPrice) {
      let amountIn = 0;
  
      try {
        // Calculer le montant à envoyer en fonction de la devise
        if (selectedCurrency === 'USD') {
          amountIn = productPrice;
        } else if (selectedCurrency === 'BNB') {
          if (!bnbToUsdRate) {
            alert("Le taux de conversion BNB vers USD est en cours de chargement.");
            return;
          }
          amountIn = productPrice / bnbToUsdRate;
        } else {
          alert("Devise non supportée pour ce paiement.");
          return;
        }
  
        // Convertir en format compatible Ethereum (wei)
        amountIn = ethers.utils.parseUnits(amountIn.toString(), selectedCurrency === 'USDT' ? 6 : 18);
        console.log('Montant pour la transaction:', amountIn);
  
        // Vérification de l'allowance et appel de approve si nécessaire
        await checkAllowance(amountIn);
  
        // Effectuer le paiement une fois l'allowance confirmée
        console.log("Paiement prêt à être effectué.");
        await payForProduct(amountIn);
  
        console.log("Transaction envoyée.");
      } catch (error) {
        console.error("Erreur lors du calcul du montant:", error.message);
        alert("Une erreur s'est produite. Veuillez vérifier vos paramètres.");
      }
    } else {
      alert("Veuillez sélectionner un produit valide.");
    }
  };
  
  

  // Vérification de l'allowance
  const checkAllowance = async (amount) => {
    try {
      // Assure-toi de récupérer l'instance du token, par exemple USDT
      const tokenContract = new ethers.Contract(usdtAddress, usdtABI, provider.getSigner());
      const allowance = await tokenContract.allowance(walletAddress, contractInstance.address);
  
      if (allowance.lt(amount)) {
        // Si l'allowance est insuffisante, demander une approbation
        console.log("Allowance insuffisante, demande d'approbation...");
        await approveToken(amount);
      } else {
        console.log("Allowance suffisante");
        // Proceed with the payment if allowance is sufficient
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'allowance", error);
    }
  };
  
  // Mise à jour des informations du produit
  const updateProductInfo = (selectedProductId) => {
    setProductId(selectedProductId);
    const productDetails = products[selectedProductId];

    if (productDetails) {
      const { price, exists } = productDetails;
      setProductPrice(price);
      setProductInfo({ price, exists });

      if (selectedCurrency === 'USD') {
        setConvertedPrice(price ? price.toString() : null);
      } else if (selectedCurrency === 'BNB') {
        setConvertedPrice(price ? (price / bnbToUsdRate).toString() : null);
      }
    } else {
      console.error("Produit non trouvé !");
    }
  };

  // Fonction pour approuver les tokens
  const approveToken = async (amount) => {
    try {
      const tokenContract = new ethers.Contract(usdtAddress, usdtABI, provider.getSigner());
      console.log("Demande d'approbation pour un montant de:", amount.toString());
  
      const tx = await tokenContract.approve(contractInstance.address, amount);
      console.log("Transaction d'approbation envoyée:", tx.hash);
  
      // Attendre que la transaction soit confirmée
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        console.log("Approvisionnement effectué avec succès !");
      } else {
        console.error("La transaction d'approbation a échoué.");
      }
  
      // Une fois l'approbation effectuée, appeler la fonction de paiement
      await payForProduct(amount);  // Effectue le paiement après approbation
    } catch (error) {
      console.error("Erreur lors de l'approbation du token", error);
      alert("Échec de l'approbation du token.");
    }
  };


  // Fonction pour effectuer le paiement
const payForProduct = async (amount) => {
    try {
      const tokenAddress = selectedCurrency === 'BNB' ? ethers.constants.AddressZero : usdtAddress;
      const productId = selectedProductId;
  
      // Effectuer le paiement
      const tx = await contractInstance.pay(tokenAddress, amount, productId, { value: selectedCurrency === 'BNB' ? amount : 0 });
      console.log("Paiement effectué avec succès. Tx hash:", tx.hash);
  
      // Attendre la confirmation de la transaction
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert("Achat réussi !");
      } else {
        alert("Échec de la transaction.");
      }
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      alert("Une erreur s'est produite lors du paiement.");
    }
  };
  
  // Gestion du changement de devise
  const handleCurrencyChange = (event) => {
    const newCurrency = event.target.value;
    setSelectedCurrency(newCurrency);
  
    if (newCurrency === 'USD') {
      setConvertedPrice(productPrice ? productPrice.toString() : null);
    } else if (newCurrency === 'BNB') {
      setConvertedPrice(productPrice ? (productPrice / bnbToUsdRate).toString() : null);
    }
  };


  const handleProductSelection = (event) => {
    const selectedId = event.target.value;
    setSelectedProductId(selectedId); // Mise à jour de l'ID du produit
    updateProductInfo(selectedId);    // Met à jour les infos du produit
  };
  
  
  return (
    <div className="App">
      <h1>Test de Paiement Multi-Produits avec Blockchain</h1>
      <button onClick={connectWallet}>
        {walletConnected ? `Wallet connecté : ${walletAddress}` : 'Connecter le wallet'}
      </button>
  
      {productId && productInfo && (
        <div>
          <p>Produit choisi : {productId}</p>
          <p>Prix du produit : {convertedPrice ? convertedPrice : 'Chargement...'} {selectedCurrency}</p>
          <p>Le produit est {productInfo.exists ? 'disponible' : 'indisponible'}</p>
        </div>
      )}
  
      <select onChange={handleProductSelection} value={selectedProductId}>
        <option value="">Sélectionnez un produit</option>
        <option value="product1">Produit 1</option>
        <option value="product2">Produit 2</option>
        <option value="product3">Produit 3</option>
      </select>
  
      <select onChange={handleCurrencyChange} value={selectedCurrency}>
        <option value="USD">USD</option>
        <option value="BNB">BNB</option>
      </select>
  
      <button onClick={handlePayment}>Payer pour le produit</button>
    </div>
  );
  };
  
  export default App;
  