import React, { useEffect, useState, useCallback, useRef } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import WalletConnectProvider from "@walletconnect/web3-provider";
import './App.css'; // Importation du fichier CSS
import './index.css'; // Ajoute cette ligne dans ton fichier JavaScript
import QRCode from 'qrcode'; // Import du package QRCode
import Select from 'react-select';



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
  const [paymentAddress, setPaymentAddress] = useState('');
   // Utilisation de useRef pour référencer le canvas
  const qrCanvasRef = useRef(null);
  const [availableNetworks, setAvailableNetworks] = useState([]); // Réseaux disponibles pour la crypto choisi
  


  const [productInfo, setProductInfo] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null); // ou un ID de produit par défaut

  const [productId, setProductId] = useState('');
  const [productPrice, setProductPrice] = useState(null);
  const [bnbToUsdRate, setBnbToUsdRate] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [contractInstance, setContractInstance] = useState(null); // Déclarez `contractInstance` ici
  const products = {
    product1: { price: 0.001693709562684191, exists: true, title: "Indicateur Daily" },
    product2: { price: 0.5027, exists: true, title: "Indicateur 4h/1h" },
    product3: { price: 0.8430, exists: true, title: "Indicateur 15mn" }
  };

  const [paymentMethod, setPaymentMethod] = useState('crypto'); // "crypto" ou "manual"
  const [selectedCrypto, setSelectedCrypto] = useState('BTC'); // Bitcoin par défaut
  const [selectedNetwork, setSelectedNetwork] = useState('Bitcoin'); // Réseau Bitcoin par défaut

  const networkMapping = {
    Bitcoin: 'bitcoin',
    Ethereum: 'ethereum',
    'Binance Smart Chain': 'bsc', 
    Polygon: 'polygon',
    Solana: 'solana',
    USDT: 'usdt',  // juste pour la gestion de la crypto USDT
  };
  
  
  
  
  
  // Adresses de paiement des différentes cryptos
  
  const [addresses, setAddresses] = useState({
    BTC: {
      Bitcoin: '39QSDXywjem146UkfBzZq5zneEvTVv6M1J', // Adresse Bitcoin par défaut
    },
    ETH: {
      ethereum: '0x2bce5955aa7aabc49ff497a3229f2bd6b480d9e0', // Adresse Ethereum par défaut
      polygon: '0x2bce5955aa7aabc49ff497a3229f2bd6b480d9e0', // Adresse Ethereum sur Polygon
    },
    USDT: {
      bsc: '0xD62B5CFdDfd26F6219E4BF366d9DB6B1450D5905', // Adresse USDT par défaut (Ethereum)
      polygon: '0x2bce5955aa7aabc49ff497a3229f2bd6b480d9e0', // Adresse USDT sur BSC
      solana: 'EZC4wn5TtQp1SjYQe8sxP7SDkGgokKVPkktXWrc9X2H9', // Adresse USDT sur Solana
      tron: 'TWVsTq8WM6ggWP8R2n9kru8gXEgkzBL6hE', // Adresse USDT sur Tron
      ethereum: '0xD62B5CFdDfd26F6219E4BF366d9DB6B1450D5905'
    },
    BNB: {
      binance: '0xD62B5CFdDfd26F6219E4BF366d9DB6B1450D5905', // Adresse pour le réseau Binance
    },
    SOL: {
      solana: 'EZC4wn5TtQp1SjYQe8sxP7SDkGgokKVPkktXWrc9X2H9', // Adresse Solana
    },
    POLYGON: {
      polygon: '0x2bce5955aa7aabc49ff497a3229f2bd6b480d9e0', // Adresse Polygon
    },
  });
  



  const networksForCrypto = {
    BTC: ['Bitcoin'],
    ETH: ['Ethereum', 'Polygon'],
    USDT: ['Binance Smart Chain', 'Polygon', 'Solana', 'Tron', 'Ethereum'],  // Ajout d'Ethereum pour USDT
    BNB: ['Binance'],
    SOL: ['Solana'],
    POLYGON: ['Polygon'],
  };
  
  
  

  // Définir les options avec les logos
  const cryptoOptions = [
    {
      value: 'BTC',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="https://gateway.pinata.cloud/ipfs/bafkreicfpg4da6nrgmzdyftmjs3nphgjd5epb5oveswe3i4bgadmfxw7ry" 
            alt="Bitcoin" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          Bitcoin
        </div>
      ),
    },
    {
      value: 'ETH',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="https://gateway.pinata.cloud/ipfs/bafkreicfpg4da6nrgmzdyftmjs3nphgjd5epb5oveswe3i4bgadmfxw7ry" 
            alt="Ethereum" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          Ethereum
        </div>
      ),
    },
    {
      value: 'USDT',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="https://gateway.pinata.cloud/ipfs/bafkreickbvf6pst3g4pwagjsf4mamojbzqgryehrvvhrwk55rzzj4htaxq" 
            alt="Tether" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          Tether
        </div>
      ),
    },
    {
      value: 'BNB',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="https://gateway.pinata.cloud/ipfs/bafybeid3ddd2et2o3f6wsw7iy47rbwlywksld65v5xelbsrxslanxp5mze" 
            alt="BNB" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          BNB
        </div>
      ),
    },
    {
      value: 'SOL',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="https://gateway.pinata.cloud/ipfs/bafybeihsbexfrujpws74oqsu7ewltiy4xfq5ihafo3vfvighw5pnxqn74u" 
            alt="Solana" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          Solana
        </div>
      ),
    },
    {
      value: 'POLYGON',
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="https://gateway.pinata.cloud/ipfs/bafkreidyyru4d3ouw4wi7x2ng46ld5y7es6nlxmzndlq63pzdmfht22sq4" 
            alt="Polygon" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          Polygon
        </div>
      ),
    },
  ];
  
  



// Exemple de réseaux avec logos
const networkOptions = [
  {
    value: 'Bitcoin',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="https://gateway.pinata.cloud/ipfs/bafkreigp3qorspavny4bjzjggztecqdtx3mnvpz4fl56ebr2a6mx5m6j3y" 
          alt="Bitcoin Network" 
          style={{ width: 20, height: 20, marginRight: 10 }} 
        />
        Bitcoin
      </div>
    ),
  },
  {
    value: 'Ethereum',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="https://gateway.pinata.cloud/ipfs/bafkreigp3qorspavny4bjzjggztecqdtx3mnvpz4fl56ebr2a6mx5m6j3y" 
          alt="Ethereum Network" 
          style={{ width: 20, height: 20, marginRight: 10 }} 
        />
        Ethereum
      </div>
    ),
  },
  {
    value: 'Polygon',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="https://gateway.pinata.cloud/ipfs/bafkreig7gjsiwnrxffuqpipnqcurbrdbzr42tl36ja6cabdsy3c26gxl3m" 
          alt="Polygon Network" 
          style={{ width: 20, height: 20, marginRight: 10 }} 
        />
        Polygon
      </div>
    ),
  },
  {
    value: 'Binance Smart Chain',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="https://gateway.pinata.cloud/ipfs/bafkreiamohhhifxucpapedzlgd37ee3wleu5yqabgqzwlefc54ml2zyway" 
          alt="Binance Network" 
          style={{ width: 20, height: 20, marginRight: 10 }} 
        />
        Binance Smart Chain
      </div>
    ),
  },
  {
    value: 'Solana',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="https://gateway.pinata.cloud/ipfs/bafkreihciopspxz7o5yibfaqwfo65g3v5yasautrtkbm2ywk2epvxfayjm" 
          alt="Solana Network" 
          style={{ width: 20, height: 20, marginRight: 10 }} 
        />
        Solana
      </div>
    ),
  },
  {
    value: 'Tron',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="https://gateway.pinata.cloud/ipfs/bafkreihciopspxz7o5yibfaqwfo65g3v5yasautrtkbm2ywk2epvxfayjm" 
          alt="Tron Network" 
          style={{ width: 20, height: 20, marginRight: 10 }} 
        />
        Tron (TRC20)
      </div>
    ),
  },
];


  
  

  






  
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
    const productDetails = products[selectedProductId];  // Utilisation de l'objet local products
    if (productDetails) {
      const { price, exists } = productDetails;
      setProductPrice(price);  // Met à jour le prix
      setProductInfo({ price, exists });  // Met à jour les informations du produit
  
      // Si le taux de conversion est disponible, calculer le prix en BNB
      if (bnbToUsdRate) {
        const convertedPrice = Math.ceil(price * bnbToUsdRate);

        setConvertedPrice(convertedPrice.toString());
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
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  try {
    setLoading(true);
    // Récupérer le produit depuis le smart contract
    const product = await contract.products(productId);

    if (product.exists) {
      let priceInWei = product.price.toString();  // Récupère la valeur brute du prix (en Wei)

      // Affiche la valeur brute du prix pour débogage
      console.log('Valeur brute récupérée du smart contract :', priceInWei);

      // Utiliser `ethers.utils.formatUnits()` pour convertir en BNB (18 décimales par défaut)
      let priceBNB = ethers.utils.formatUnits(priceInWei, 18);

      console.log('Prix du produit après conversion :', priceBNB, 'BNB');
      
      // Retourner le prix en BNB
      return { priceInBNB: parseFloat(priceBNB) }; // Assure-toi de retourner un nombre flottant
    } else {
      console.log('Produit non trouvé');
      return null;  // Retourner null si le produit n'existe pas
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du prix', error);
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
        window.location.href = "https://nypsus.github.io//pages/Delivrance_IndicateurD.html";

  
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


//Les differents taux de conversions
const [conversionRate, setConversionRate] = useState(null);


// Fonction pour récupérer le taux de conversion crypto -> USDT
const getConversionRate = async (crypto) => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usdt`);
    const rate = response.data[crypto]?.usdt;  // Récupère le taux de conversion de la crypto vers USDT
    setConversionRate(rate);
  } catch (error) {
    console.error('Erreur lors de la récupération du taux de conversion:', error);
  }
};

// Fonction pour récupérer le taux de BNB -> USDT
const getBNBToUSDTRate = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
    const rate = response.data.binancecoin.usd;  // Taux de conversion de BNB vers USD
    setBnbToUsdRate(rate);
  } catch (error) {
    console.error('Erreur lors de la récupération du taux BNB -> USDT', error);
  }
};

// useEffect pour récupérer les taux de conversion quand la crypto ou le produit change
useEffect(() => {
  if (selectedCrypto) {
    getConversionRate(selectedCrypto);  // Récupère le taux de la crypto vers USDT
  }
  if (selectedProductId) {
    getBNBToUSDTRate();  // Récupère le taux de BNB vers USDT
  }
}, [selectedCrypto, selectedProductId]);  // Déclenche quand selectedCrypto ou selectedProductId change




const getConvertedPrice = () => {
  if (!productInfo || !conversionRate || !bnbToUsdRate) {
    return null;  // Si les informations ne sont pas disponibles, retourne null
  }

  // Calcul du prix en USDT
  const priceInUsdt = productInfo.productPrice * bnbToUsdRate;  // Prix du produit en USDT

  // Calcul du prix en crypto sélectionnée
  const priceInCrypto = priceInUsdt / conversionRate;  // Conversion de l'USDT vers la crypto

  return priceInCrypto.toFixed(4);  // Retourne le prix arrondi à 4 décimales
};






  

// Charger les taux de conversion et les données au démarrage
useEffect(() => {
  getBNBToUSDTRate();
}, []);




const handleProductSelection = async (event) => {
  const selectedId = event.target.value;
  setSelectedProductId(selectedId);
  updateProductInfo(selectedId); // Met à jour les infos locales pour le produit
  await fetchProductPrice(selectedId); // Appelle la fonction pour récupérer le prix du produit
};


// Payment manuel QR CODE !!



// Récupérer les réseaux disponibles pour une crypto donnée
const getAvailableNetworks = (crypto) => {
  const networks = Object.keys(addresses[crypto] || {});
  return networks;
};

// Mémorisation de la fonction generateQRCode avec useCallback
const generateQRCode = useCallback(() => {
  // Remap du réseau sélectionné pour correspondre aux clés dans 'addresses'
  let selectedNetworkKey = networkMapping[selectedNetwork] || selectedNetwork.toLowerCase();

  // Si c'est Bitcoin, ne pas appliquer .toLowerCase()
  if (selectedCrypto === 'BTC' && selectedNetwork === 'Bitcoin') {
    selectedNetworkKey = 'Bitcoin'; // Laisser "Bitcoin" avec B majuscule
  } else {
    selectedNetworkKey = selectedNetwork.toLowerCase(); // Appliquer .toLowerCase() pour les autres réseaux
  }

  // Récupère l'adresse selon la crypto et le réseau
  const selectedAddress =
    addresses[selectedCrypto]?.[selectedNetworkKey] ||
    addresses[selectedCrypto]?.default;

  // Vérifier si la crypto choisie est BTC et si le réseau est valide
  if (selectedCrypto === 'BTC' && selectedNetwork !== 'Bitcoin') {
    setErrorMessage('Bitcoin ne supporte que le réseau Bitcoin');
    console.error('Bitcoin ne supporte que le réseau Bitcoin');
    return;
  }

  let qrData = '';
  if (selectedCrypto === 'BTC') {
    qrData = `bitcoin:${selectedAddress}`;
  } else if (selectedCrypto === 'ETH' || selectedCrypto === 'BNB' || selectedCrypto === 'SOL' || selectedCrypto === 'POLYGON') {
    // Gestion des adresses pour Ethereum, BNB, Solana et Polygon
    qrData = `${selectedCrypto.toLowerCase()}:${selectedAddress}`;
  } else if (selectedCrypto === 'USDT') {
    // Pour USDT, on génère l'adresse avec le réseau spécifique (par exemple, bsc, polygon, etc.)
  
    // Vérifier si le réseau sélectionné est Binance Smart Chain (BSC)
    if (selectedNetwork === 'Binance Smart Chain') {
      qrData = `bsc:${selectedAddress}`;  // Utilise l'adresse spécifique pour BSC
    } else {
      qrData = `${selectedNetwork.toLowerCase()}:${selectedAddress}`;  // Autres réseaux
    }
  } else {
    setErrorMessage('Crypto non supportée pour le QR Code');
    console.error('Crypto non supportée pour le QR Code');
    return;
  }


  // Vérification du QR Code
  console.log("QR Data généré:", qrData); // Ajouter cette ligne pour vérifier les données du QR Code
  
  // Génération du QR code
  if (qrCanvasRef.current) {
    QRCode.toCanvas(qrCanvasRef.current, qrData, (error) => {
      if (error) {
        console.error("Erreur lors de la génération du QR Code", error);
        setErrorMessage("Erreur lors de la génération du QR Code");
      } else {
        console.log('QR Code généré avec succès');
      }
    });
  } else {
    console.error('Canvas non trouvé dans le DOM');
    setErrorMessage("Canvas non trouvé dans le DOM");
  }

  setPaymentAddress(selectedAddress);
}, [selectedCrypto, selectedNetwork, addresses, networkMapping]);


useEffect(() => {
  if (!selectedCrypto) return; // Si aucune crypto n'est sélectionnée, ne rien faire
  const networks = getAvailableNetworks(selectedCrypto);
  setAvailableNetworks(networks); // Met à jour les réseaux disponibles pour la crypto
  setSelectedNetwork(networks.length > 0 ? networks[0] : ''); // Par défaut, sélectionne le premier réseau disponible
}, [selectedCrypto]);

// Générer le QR Code chaque fois que la crypto ou le réseau change
useEffect(() => {
  if (paymentMethod === 'manual' && selectedCrypto && selectedNetwork) {
    generateQRCode();
  }
}, [selectedCrypto, selectedNetwork, paymentMethod, generateQRCode]);

// Handlers pour la sélection de la crypto et du réseau
const handleCryptoChange = (event) => {
  setSelectedCrypto(event.target.value);
};

const handleNetworkChange = (event) => {
  setSelectedNetwork(event.target.value);
};

const handlePaymentMethodChange = (event) => {
  setPaymentMethod(event.target.value);
};

// Affichage de l'interface utilisateur
return (
  <div className="App">
    <div className="parallax-container">
      <video id="video-background" autoPlay loop muted>
        <source
          src="https://gateway.pinata.cloud/ipfs/QmPZ8v3KzeyH2Dqz29TZFWe4kswkUETJyesZFCFULtagwv"
          type="video/mp4"
        />
        Votre navigateur ne supporte pas les vidéos HTML5.
      </video>

      <div className="content">
        <div className="wallet-connect-button">
          <button onClick={() => setWalletConnected(true)} disabled={walletConnected}>
            {walletConnected ? (
              <>
                <span>Wallet connecté : {walletAddress}</span>
                <span className="arrow-icon">→</span>
              </>
            ) : (
              "Connecter le wallet"
            )}
          </button>
        </div>

        <div className="payment-wrapper">
          <h1>Les Indicateurs à Levier</h1>

          {/* Affichage des informations sur le produit */}
          {productInfo && (
            <div>
              <p>Produit choisi : {products[selectedProductId]?.title}</p>
              <p>Prix du produit en BNB : {productInfo.productPrice} BNB</p>
              <p>Prix du produit en USDT : {productInfo.convertedPrice || "Chargement..."} USDT</p>
              <p>Le produit est {productInfo.exists ? "disponible" : "indisponible"}</p>
            </div>
          )}

          <select onChange={handleProductSelection} value={selectedProductId}>
            <option value="">Sélectionnez un produit</option>
            <option value="product1">Produit 1</option>
            <option value="product2">Produit 2</option>
            <option value="product3">Produit 3</option>
          </select>

          <button onClick={handleBuyButtonClick}>
            Payer pour le produit en BNB
          </button>

          <div>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="crypto"
                checked={paymentMethod === 'crypto'}
                onChange={handlePaymentMethodChange}
              />
              Paiement avec Crypto
            </label>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="manual"
                checked={paymentMethod === 'manual'}
                onChange={handlePaymentMethodChange}
              />
              Paiement manuel
            </label>
          </div>

          {/* Formulaire de paiement manuel */}
          {paymentMethod === 'manual' && (
            <div className="manual-payment-form">
              <h3>Choisissez votre méthode de paiement</h3>

              <div>
                <label>
                  Crypto
                  <select onChange={handleCryptoChange} value={selectedCrypto}>
                    {cryptoOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img 
                            src={option.label.props.children[0].props.src} 
                            alt={option.label.props.children[0].props.alt} 
                            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
                          />
                          {option.value}
                        </div>
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Réseau
                  <select onChange={handleNetworkChange} value={selectedNetwork}>
                    {/* Filtrer les réseaux disponibles en fonction de la crypto sélectionnée */}
                    {networksForCrypto[selectedCrypto]?.map(network => (
                      <option key={network} value={network}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img 
                            src={networkOptions.find(n => n.value === network)?.label.props.children[0].props.src} 
                            alt={network} 
                            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
                          />
                          {network}
                        </div>
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <p>
                  Veuillez effectuer un transfert de {getConvertedPrice() || '...'} {selectedCrypto.toUpperCase()} à l'adresse suivante :
                </p>

                <p>Adresse : {paymentAddress}</p>
              </div>

              {/* Ajouter le canvas pour afficher le QR code */}
              <div>
                <canvas ref={qrCanvasRef} width="200" height="200"></canvas>
              </div>

              <div>
                <button>Confirmer le paiement</button>
              </div>
            </div>
          )}

          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
      </div>
    </div>
  </div>
);


};

export default App;