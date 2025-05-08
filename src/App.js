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
    Bitcoin: 'BTC',             // Bitcoin correspond à BTC
    Ethereum: 'ETH',            // Ethereum correspond à ETH
    'Binance Smart Chain': 'BNB', // Binance Smart Chain correspond à BNB
    Polygon: 'POLYGON',         // Polygon correspond à POLYGON
    Solana: 'SOL',              // Solana correspond à SOL
    USDT: 'USDT',               // USDT reste USDT
  };



  const cryptoMappingToAPI = {
    BTC: 'bitcoin',      // 'bitcoin' pour CoinGecko
    ETH: 'ethereum',     // 'ethereum' pour CoinGecko
    BNB: 'binancecoin',  // 'binancecoin' pour CoinGecko
    SOL: 'solana',       // 'solana' pour CoinGecko
    POLYGON: 'matic-network', // 'matic-network' pour CoinGecko
    USDT: 'tether',      // 'tether' pour CoinGecko
  };

  const addressNetworkKeyMapping = {
    Bitcoin: 'Bitcoin',
    Ethereum: 'ethereum',
    'binance smart chain': 'bsc',
    Polygon: 'polygon',
    Solana: 'solana',
    Tron: 'tron',
    Binance: 'binance',
  };

  
// Modifier ici pour ne pas transformer en minuscule
const selectedNetworkKey = selectedNetwork;  // On ne convertit plus en minuscule

// Accéder à l'adresse mappée
const addressKey = addressNetworkKeyMapping[selectedNetworkKey];  // Utilisation directe sans conversion


  
  
  
  
  
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
      bsc: '0xD62B5CFdDfd26F6219E4BF366d9DB6B1450D5905', // Adresse pour le réseau Binance
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
    BNB: ['Binance Smart Chain'],
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





// Récupération du prix du produit via le smart contract
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


//Les differents taux de conversions
const [conversionRate, setConversionRate] = useState(null);


// Fonction pour récupérer le taux de conversion crypto -> USDT
const getConversionRate = async (crypto) => {
  try {
    // Utiliser le mappage pour envoyer le bon nom à l'API CoinGecko
    const cryptoForAPI = cryptoMappingToAPI[crypto] || crypto.toLowerCase();  // Par défaut, on prend le nom en minuscule
    
    // Affichage du nom envoyé à l'API pour vérifier
    console.log(`Nom de la crypto envoyé à l'API : ${cryptoForAPI}`);

    // Appel API CoinGecko pour récupérer le taux de conversion
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoForAPI}&vs_currencies=usd`);

    
    // Vérifier la réponse et récupérer le taux
    const rate = response.data[cryptoForAPI]?.usd;

    if (rate) {
      setConversionRate(rate);  // Met à jour le taux de conversion
      console.log(`Taux de conversion pour ${crypto}: ${rate} USDT`);
    } else {
      console.error('Taux non trouvé pour cette crypto');
    }
  } catch (error) {
    console.error('Erreur de récupération du taux:', error);
  }
};









// Fonction pour récupérer le taux de BNB -> USDT
const getBNBToUSDTRate = async () => {
  try {
    const response = await axios.get('https://serveur-api-coingeko-production.up.railway.app/price'); // URL complète de ton serveur
    const rate = response.data.binancecoin.usd;

    console.log("Taux de conversion BNB -> USD : ", rate);
    setBnbToUsdRate(rate);
  } catch (error) {
    console.error('Erreur lors de la récupération du taux BNB -> USD', error);
  }
};


// useEffect pour récupérer les taux de conversion quand la crypto ou le produit change
useEffect(() => {
  if (selectedCrypto && selectedProductId) {
    getConversionRate(selectedCrypto);
    getBNBToUSDTRate();
  }
}, [selectedCrypto, selectedProductId]);




// Calculer le montant à envoyer en crypto, basé sur le taux de conversion
const getConvertedPrice = () => {
  if (!productInfo || !conversionRate || !bnbToUsdRate) {
    console.error("Données manquantes pour la conversion : ", { productInfo, conversionRate, bnbToUsdRate });
    return null;  // Si les données sont manquantes, retourne null
  }

  // Calcul du prix en USDT
  const priceInUsdt = productInfo.priceInBNB * bnbToUsdRate;

  // Calcul du prix en crypto sélectionnée
  const priceInCrypto = priceInUsdt / conversionRate;

  return priceInCrypto.toFixed(4);  // Retourne le prix arrondi à 4 décimales
};








  

// Charger les taux de conversion et les données au démarrage
useEffect(() => {
  getBNBToUSDTRate();
}, []);




const handleProductSelection = async (event) => {
  const selectedId = event.target.value;
  setSelectedProductId(selectedId);

  // Si l'utilisateur a sélectionné l'option vide
  if (selectedId === "") {
    setProductInfo(null);
    setProductPrice(null);
    setConvertedPrice(null);
    return;
  }

  updateProductInfo(selectedId);  // Met à jour les infos locales pour le produit
  const result = await fetchProductPrice(selectedId); // Appelle la fonction pour récupérer le prix du produit

  // Si le résultat est valide, on met à jour `productInfo` avec le prix récupéré
  if (result?.priceInBNB !== null) {
    setProductInfo((prevState) => ({
      ...prevState,
      priceInBNB: result.priceInBNB
    }));
  }
};



// Payment manuel QR CODE !!

const [attempts, setAttempts] = useState(0); // Compteur de tentatives
const [remainingTime, setRemainingTime] = useState(5 * 60);  // 5 minutes en secondes
const [pollingId, setPollingId] = useState(0);
const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
const previousOrderIdRef = useRef(null); // Pour garder l'ancien orderId
const transactionIdRef = useRef(null); // <- Pour suivre le dernier transactionId
const isGeneratingRef = useRef(false);


// Récupérer les réseaux disponibles pour une crypto donnée
const getAvailableNetworks = (crypto) => {
  const networks = Object.keys(addresses[crypto] || {});
  return networks;
};

// Mémorisation de la fonction generateQRCode avec useCallback
const generateQRCode = useCallback(() => {
  if (paymentMethod !== 'manual') {
    console.log("🚫 Le mode de paiement n'est pas manuel, QR Code non généré");
    return;
  }

  if (isGeneratingRef.current) return;
  isGeneratingRef.current = true;

  setTimeout(() => {
    isGeneratingRef.current = false;
  }, 500);

  if (isPollingActive && transactionIdRef.current) {
    console.log("⛔ Annulation de la transaction précédente", transactionIdRef.current);
    cancelPolling(transactionIdRef.current);
    transactionIdRef.current = null;
  }

  clearInterval(pollingIntervalRef.current);
  clearTimeout(pollingTimeoutRef.current);

  const orderId = generateOrderID();
  setOrderId(orderId);
  previousOrderIdRef.current = orderId;
  setTransactionStatus("pending");
  setAttempts(0);

  if (!selectedCrypto || !selectedNetwork) {
    console.error("❗ Erreur : crypto ou réseau non définis.");
    return;
  }

  // 🔠 Mise en forme correcte du réseau pour la clé
  let formattedNetwork = selectedNetwork
  .split(" ")
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");
  

  if (formattedNetwork === 'Bsc') {
    formattedNetwork = 'binance smart chain';
  }


  // Conversion en minuscule pour correspondre aux clés de l'API
  let selectedNetworkKey = selectedNetwork.toLowerCase();

  // 🧱 Gestion spéciale pour Bitcoin
  if (selectedCrypto === 'BTC' && selectedNetwork === 'Bitcoin') {
    selectedNetworkKey = 'Bitcoin'; // Garder le "Bitcoin" tel quel
  } else if (addressNetworkKeyMapping[selectedNetwork]) {
    selectedNetworkKey = selectedNetwork.toLowerCase();
  }

  const networkKey = addressNetworkKeyMapping[formattedNetwork];

  console.log("🔍 selectedCrypto:", selectedCrypto);
  console.log("🔍 selectedNetwork:", selectedNetwork);
  console.log("🔍 formattedNetwork:", formattedNetwork);
  console.log("🔍 selectedNetworkKey (après conversion en minuscule):", selectedNetworkKey);
  console.log("🔍 networkKey (après mapping):", networkKey);
  console.log("🔍 addresses[selectedCrypto]:", addresses[selectedCrypto]);

  if (!networkKey) {
    console.error(`❌ Le réseau "${formattedNetwork}" n'existe pas dans addressNetworkKeyMapping`);
    return;
  }

  // Cas spécial pour USDT et BNB
  let selectedAddress;
  if (selectedCrypto === 'USDT' && formattedNetwork === 'binance smart chain') {
    selectedAddress = addresses[selectedCrypto]?.bsc; // Adresse spécifique pour USDT sur BSC
  } else if (selectedCrypto === 'BNB' && formattedNetwork === 'binance smart chain') {
    selectedAddress = addresses[selectedCrypto]?.bsc; // Adresse spécifique pour BNB sur BSC
  } else {
    selectedAddress = addresses[selectedCrypto]?.[networkKey] || addresses[selectedCrypto]?.default;
  }

  if (!addresses[selectedCrypto]?.[networkKey]) {
    console.error(`🚫 Le réseau "${formattedNetwork}" n'est pas défini pour ${selectedCrypto}`);
    return;
  }

  
  console.log("🏷️ Adresse sélectionnée:", selectedAddress);
  console.log("🆔 ID généré pour le QR Code:", orderId);

  // 🧾 Construction des données QR
  let qrData = '';
  if (selectedCrypto === 'BTC') {
    qrData = `bitcoin:${selectedAddress}?orderId=${orderId}`;
  } else if (['ETH', 'BNB', 'SOL', 'POLYGON'].includes(selectedCrypto)) {
    qrData = `${selectedCrypto.toLowerCase()}:${selectedAddress}?orderId=${orderId}`;
  } else if (selectedCrypto === 'USDT') {
    if (formattedNetwork === 'Binance Smart Chain') {
      qrData = `bsc:${selectedAddress}?orderId=${orderId}`;
    } else {
      qrData = `${formattedNetwork.toLowerCase()}:${selectedAddress}?orderId=${orderId}`;
    }
  } else {
    setErrorMessage("🚫 Crypto non supportée pour le QR Code");
    return;
  }

  console.log("✅ QR Data généré:", qrData);

  // 🎯 Génération du QR Code sur le canvas
  if (qrCanvasRef.current) {
    QRCode.toCanvas(qrCanvasRef.current, qrData, (error) => {
      if (error) {
        console.error("❌ Erreur lors de la génération du QR Code", error);
        setErrorMessage("Erreur lors de la génération du QR Code");
      } else {
        console.log("✅ QR Code généré avec succès");
      }
    });
  } else {
    console.error("🚫 Canvas non trouvé dans le DOM");
    setErrorMessage("Canvas non trouvé dans le DOM");
  }

  setPaymentAddress(selectedAddress);

  console.log("🚀 Appel à startPaymentPolling avec orderId:", orderId);
  startPaymentPolling(orderId, selectedAddress);
}, [selectedCrypto, selectedNetwork, addresses, networkMapping, paymentMethod]);



const pollingIntervalRef = useRef(null);

// Fonction pour démarrer le processus de paiement (envoi de la requête POST
const startPaymentPolling = async (orderId, paymentAddress) => {
  
  if (paymentMethod !== 'manual') {
    console.log('Le mode de paiement n\'est pas manuel, pas de démarrage du polling');
    return;
  }

  if (!orderId) {
    console.error("Aucun Order ID disponible pour démarrer le polling");
    return;
  }

  // Réinitialisation des timers
  clearInterval(pollingIntervalRef.current);
  clearTimeout(pollingTimeoutRef.current);

  console.log('Order ID envoyé au backend:', orderId);
  setRemainingTime(5 * 60); // Remet le timer à 5 min
  setIsPollingActive(true);
  setPollingId(prev => prev + 1); // Redémarre le timer

  try {
    console.log("🔁 Démarrage du polling avec : ", {
      orderId,
      paymentAddress,
      crypto: selectedCrypto, // si tu as ça en state
      network: selectedNetwork, // idem
    });

    const response = await fetch('https://myserver-production-2233.up.railway.app/start-payment-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        paymentAddress,
        network: selectedNetwork,  // Ajoute ici le "network"
        crypto: selectedCrypto     // Et "crypto" si nécessaire
      }),
    });
    

    if (!response.ok) {
      throw new Error(`Erreur serveur : ${response.statusText}`);
    }

    const data = await response.json();
    transactionIdRef.current = data.transactionId;
    console.log('Transaction monitoring started with ID:', data.transactionId);

    // 💾 Sauvegarde l'interval pour pouvoir l’annuler
    pollingIntervalRef.current = setInterval(() => {
      if (transactionStatus !== 'pending') {
        clearInterval(pollingIntervalRef.current);
        return;
      }
      checkPaymentStatus(data.transactionId);
    }, 10000); // toutes les 10s

    // ⏱️ Timeout après 5 minutes
    pollingTimeoutRef.current = setTimeout(() => {
      setIsPollingActive(false);
      setTimeoutReached(true);
      clearInterval(pollingIntervalRef.current);
      console.log('⏰ Délai de 5 minutes atteint, arrêt du polling.');
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error('Erreur lors du démarrage du polling:', error);
  }
};







// Fonction pour annuler le polling côté backend
const cancelPolling = async (transactionId) => {
  console.log('[FRONTEND] Annulation demandée pour:', transactionId);
  try {
    // Utilisation de l'URL relative pour l'appel fetch
    const response = await fetch('https://myserver-production-2233.up.railway.app/cancel-payment-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionId }),
    });

    if (response.ok) {
      console.log('Polling annulé avec succès sur le serveur');
    } else {
      console.error('Erreur lors de l\'annulation du polling');
    }
  } catch (error) {
    console.error('Erreur lors de la demande d\'annulation du polling', error);
  }
};





// Ajoute un useEffect pour gérer le nettoyage lorsque le composant est démonté
useEffect(() => {
  return () => {
    if (transactionIdRef.current) {
      cancelPolling(transactionIdRef.current); // ✅ Corrigé
    }
    clearInterval(pollingIntervalRef.current);
    clearTimeout(pollingTimeoutRef.current);
  };
}, []);



// 1️⃣ Met à jour les réseaux disponibles dès qu'une crypto est sélectionnée
useEffect(() => {
  if (!selectedCrypto) return; // Si aucune crypto n'est sélectionnée, ne rien faire
  const networks = getAvailableNetworks(selectedCrypto);
  setAvailableNetworks(networks); // Met à jour les réseaux disponibles pour la crypto
  setSelectedNetwork(networks.length > 0 ? networks[0] : ''); // Par défaut, sélectionne le premier réseau disponible
}, [selectedCrypto]);


// 2️⃣ Fonction pour récupérer l'adresse de paiement
useEffect(() => {
  if (selectedCrypto && selectedNetwork) {
    console.log("Selected Crypto: ", selectedCrypto);
    console.log("Selected Network: ", selectedNetwork);

    // Récupère l'adresse de paiement
    const formattedNetwork = selectedNetwork
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    console.log("Formatted Network: ", formattedNetwork); // Vérifiez le format du réseau

    const addressKey = addressNetworkKeyMapping[formattedNetwork];
    console.log("Address Key: ", addressKey);  // Vérifiez si la clé correspond à ce que vous attendez

    const selectedAddress = addresses[selectedCrypto]?.[addressKey];

    console.log("Selected Address: ", selectedAddress);  // Ajout d'un log pour vérifier l'adresse obtenue

    
    setPaymentAddress(selectedAddress);  // Enregistre l'adresse dans le state pour suivre les paiements
    
  }
}, [selectedCrypto, selectedNetwork, addressNetworkKeyMapping, addresses]);


// 3️⃣ Génére le QR code si paiement manuel actif
useEffect(() => {
  if (paymentMethod === 'manual' && selectedCrypto && selectedNetwork) {
    generateQRCode();
  }
}, [selectedNetwork]);

// Générer le QR Code chaque fois que la crypto ou le réseau change
 
 const [hasManualPaymentBeenSelected, setHasManualPaymentBeenSelected] = useState(false);

// 4️⃣ Ce useEffect se déclenche uniquement lorsque le mode de paiement change
useEffect(() => {
  if (paymentMethod === 'manual') {
    if (!hasManualPaymentBeenSelected) {
      generateQRCode();  // Génère le QR code une seule fois lors de la sélection du mode manuel
      setHasManualPaymentBeenSelected(true);  // Marque que le QR code a été généré
    }
  } else {
    // Si le mode de paiement est passé à "auto", on réinitialise l'état
    setHasManualPaymentBeenSelected(false);
  }
}, [paymentMethod]);  // Ne dépend plus de `hasManualPaymentBeenSelected` ici

// 5️⃣ Handlers pour la sélection de la crypto et du réseau
const handleCryptoChange = (event) => {
  const selected = event.target.value;
  setSelectedCrypto(selected);
};

const handleNetworkChange = (event) => {
  const selectedNetworkValue = event.target.value;
  setUserChangedNetwork(true); // l'utilisateur fait un choix manuel
  setSelectedNetwork(selectedNetworkValue);
};

//Cela permet de changer la méthode de paiement choisie (par exemple, manual ou automatic
const handlePaymentMethodChange = (event) => {
  setPaymentMethod(event.target.value);
};



useEffect(() => {
  console.log("Payment Address has been updated:", paymentAddress);  // Affiche le changement de l'adresse
}, [paymentAddress]);





const [userChangedNetwork, setUserChangedNetwork] = useState(false);
















const walletAddress2 = addresses[selectedCrypto]?.[addressKey] || 'Chargement...';
  




//Vérification paiement qr code effectué 
//Génération identifiant pour le Qr code généré
const generateOrderID = () => {
  return Math.random().toString(36).slice(2, 11);  // Génère un ID unique
};





//Vérification si paiement recu

const [transactionStatus, setTransactionStatus] = useState('pending');
const [orderId, setOrderId] = useState(generateOrderID());  // ID unique pour chaque commande





 // ID unique pour chaque commande
 const [isPollingActive, setIsPollingActive] = useState(false); // Contrôle l'activation du polling
 const [timeoutReached, setTimeoutReached] = useState(false); // Marque si le délai de 5 minutes est dépassé
 const pollingTimeoutRef = useRef(null); // Pour contrôler et nettoyer le timeout de 5 minutes










// Fonction pour vérifier le statut du paiement
const checkPaymentStatus = async (transactionId) => {
  if (paymentMethod !== 'manual') {
    // Si le mode de paiement n'est pas manuel, on ne génère pas de QR code
    console.log('Le mode de paiement n\'est pas manuel, QR Code non généré');
    return;
  }
  console.log('Transaction ID envoyé pour vérifier le statut:', transactionId);
  try {   

    const response = await fetch(`https://myserver-production-2233.up.railway.app/check-payment-status?transactionId=${transactionId}`);

    const result = await response.json();

    if (result.status === 'confirmed') {
      setTransactionStatus('confirmed'); // Met à jour l'état si la transaction est confirmée
      console.log('Paiement confirmé!');
      window.location.href = '/Delivrance_IndicateurD.html';

    } else {
      console.log('Paiement en attente...');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut du paiement', error);
  }
};



//affichage du timer 



useEffect(() => {
  console.log("[TIMER EFFECT] isPollingActive:", isPollingActive); // Debug ici

  if (isPollingActive) {
    console.log("[TIMER START] ⏱️ Démarrage du timer"); // 🔍 Important

    setRemainingTime(5 * 60);

    const timerInterval = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      console.log("[TIMER CLEANUP] 🧹");
      clearInterval(timerInterval);
    };
  }
}, [isPollingActive]);





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

        <div className="payment-container"> {/* Nouveau conteneur parent */}
          <div className="payment-wrapper">
            <h1>Les Indicateurs à Levier</h1>

            {/* Affichage des informations sur le produit */}
            {productInfo && (
              <div>
                <p>Produit choisi : {products[selectedProductId]?.title}</p>
                <p>Prix du produit en BNB : {productInfo.priceInBNB ? productInfo.priceInBNB + " BNB" : "Chargement..."}</p>
                <p>Prix du produit en USDT : {convertedPrice || "Chargement..."} USDT</p>
                <p>Le produit est {productInfo.exists ? "disponible" : "indisponible"}</p>
              </div>
            )}

            <select onChange={handleProductSelection} value={selectedProductId}>
              <option value="">Sélectionnez un produit</option>
              <option value="product1">Indicateur Daily</option>
              <option value="product2">Indicateur 4h/1h</option>
              <option value="product3">Indicateur 15mn</option>
            </select>

            <button onClick={handleBuyButtonClick}>
              Payer pour le produit en BNB
            </button>

            {/* Options de paiement alignées sur une ligne */}
            <div className="payment-methods">
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="crypto"
                  checked={paymentMethod === 'crypto'}
                  onChange={handlePaymentMethodChange}
                />
                Paiement Rapide
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

            {/* Formulaire de paiement manuel centré */}
            {paymentMethod === 'manual' && (
              <div className="payment-section manual-payment-form">
                <h3>Choisissez votre méthode de paiement</h3>

                <div className="select-wrapper">
                  <label>
                    
                    <select onChange={handleCryptoChange} value={selectedCrypto}>
                      {cryptoOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="select-wrapper">
                  <label>
                    
                    <select onChange={handleNetworkChange} value={selectedNetwork}>
                      {networksForCrypto[selectedCrypto]?.map(network => (
                        <option key={network} value={network}>
                          {network}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  {!selectedProductId || !productInfo?.priceInBNB ? (
                    <p style={{ fontStyle: 'italic', color: '#FF0000' }}>
                      Veuillez choisir un produit
                    </p>
                  ) : (
                    <>
                      <p>
                        Veuillez effectuer un transfert de{" "}
                        {conversionRate && productInfo && bnbToUsdRate
                          ? `${getConvertedPrice()} ${selectedCrypto.toUpperCase()}`
                          : "Chargement..."}{" "}
                        à l'adresse suivante :
                      </p>
                      

                    </>
                  )}
                </div>

                <div>
                  <canvas ref={qrCanvasRef} width="200" height="200"></canvas>
                </div>
                {/* Affichage du timer */}
                {isPollingActive && (
                  <div className="timer">
                    <p>Temps restant : {Math.floor(remainingTime / 60)}:{remainingTime % 60 < 10 ? `0${remainingTime % 60}` : remainingTime % 60} minutes</p>
                  </div>
                )}
              </div>
            )}
              

            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  </div>
);






};

export default App;