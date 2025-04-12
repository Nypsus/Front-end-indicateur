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
  const getBNBToUSDTRate = async () => {
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
  
  
  
 
  const [errorMessage, setErrorMessage] = useState('');
  
  
  


// Fonction pour effectuer le paiement
const handlePayment = async () => {
  if (!walletConnected) {
    alert("Veuillez connecter votre wallet avant de procéder.");
    return;
  }

  if (selectedProductId) {
    try {
      // Récupérer les informations du produit
      const product = products[selectedProductId];

      if (!product || !product.exists) {
        alert("Produit non disponible.");
        return;
      }

      const productPriceInUsdt = product.price;  // Prix en USDT du produit
      const productPriceInBnb = convertedPrice;  // Prix du produit en BNB (calculé précédemment)

      if (isNaN(productPriceInUsdt) || productPriceInUsdt <= 0) {
        alert("Prix du produit invalide.");
        return;
      }

      // Vérifie si le prix en BNB est correct
      if (isNaN(productPriceInBnb) || productPriceInBnb <= 0) {
        alert("Prix du produit en BNB invalide.");
        return;
      }

      console.log(`Prix du produit en USDT : ${productPriceInUsdt} USDT`);
      console.log(`Prix du produit en BNB : ${productPriceInBnb} BNB`);

      // Étape 1 : Convertir le prix en BNB en Wei (format attendu par Ethereum)
      const amountInWei = ethers.utils.parseUnits(productPriceInBnb.toString(), 18);

      // Étape 2 : Récupérer le provider et le signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Étape 3 : Créer la transaction en envoyant le prix en BNB comme paramètre de 'value'
      const tx = {
        to: contractAddress, // L'adresse du smart contract
        value: amountInWei, // Montant en BNB (MetaMask va gérer la conversion automatiquement)
        gasLimit: 21000,
        data: ethers.utils.defaultAbiCoder.encode(
          ["uint256", "string"], // Types attendus par le contrat
          [productPriceInUsdt, selectedProductId] // Prix du produit en USDT et l'ID du produit
        ),
      };

      // Étape 4 : Effectuer la transaction
      const txResponse = await signer.sendTransaction(tx);
      console.log("Transaction envoyée:", txResponse);

      alert("Paiement effectué avec succès!");
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      alert("Une erreur est survenue lors du paiement.");
    }
  } else {
    alert("Produit ou prix non valide.");
  }
};

  


  
  
  

  // Vérification de l'allowance
  const checkAllowance = async (amount) => {
    const tokenContract = new ethers.Contract(usdtAddress, usdtABI, provider.getSigner());
    const allowance = await tokenContract.allowance(walletAddress, contractInstance.address);
    
    if (allowance.lt(amount)) {
      console.log("Allowance insuffisante, demande d'approbation...");
      await approveUSDT(amount);  // Approuve le montant si l'allowance est insuffisante
    } else {
      console.log("Allowance suffisante");
      // Proceed with the payment if allowance is sufficient
    }
  };
  
  
  // Mise à jour des informations du produit

  const updateProductInfo = (selectedProductId) => {
    const productDetails = products[selectedProductId];  // Utilisation de l'objet local products
  
    if (productDetails) {
      const { price, exists } = productDetails;
      setProductPrice(price);  // Met à jour le prix
      setProductInfo({ price, exists });  // Met à jour les informations du produit
  
      // Si le taux de conversion est disponible, calculer le prix en BNB
      if (bnbToUsdRate) {
        const convertedPrice = price / bnbToUsdRate;
        setConvertedPrice(convertedPrice.toString());
      }
    } else {
      setProductInfo({ exists: false });  // Si le produit n'existe pas
      setProductPrice(null);
      setConvertedPrice(null);
    }
  };
  
  
  

  async function getProductPriceInBNB(productId) {
    // Récupérer le prix en USDT du smart contract
    const product = await contractInstance.products(productId);
    if (!product.exists) {
        alert("Produit inexistant");
        return;
    }

    const priceInUSDT = product.price;

    // Conversion du prix en USDT en BNB (à l'aide d'un oracle ou d'un service externe)
    const bnbToUSDTRate = await getBNBToUSDTRate(); // Récupérer le taux de conversion

    const priceInBNB = priceInUSDT / bnbToUSDTRate;

    console.log("Prix en USDT:", priceInUSDT);
    console.log("Prix en BNB:", priceInBNB);
    
    return { priceInUSDT, priceInBNB };
}


  



 // Fonction pour initier le paiement en BNB
 const payForProduct = async (amountIn, gasPrice, gasLimit) => {
  try {
    // Prendre l'instance du contrat avec le signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Lancer la transaction de paiement avec les paramètres de gaz
    const tx = await contract.buyProduct(
      selectedProductId,  // Identifiant du produit sélectionné
      {
        value: amountIn,
        gasPrice: gasPrice, // Spécifier le gasPrice
        gasLimit: gasLimit  // Spécifier le gasLimit
      }
    );

    // Attendre que la transaction soit confirmée
    console.log("Transaction envoyée, attente de confirmation...");
    await tx.wait();
    
    console.log("Paiement effectué avec succès!");
    alert("Paiement effectué avec succès!");
  } catch (error) {
    console.error("Erreur lors du paiement:", error);
    alert("Une erreur s'est produite lors du paiement.");
  }
};

  

// Charger les taux de conversion et les données au démarrage
useEffect(() => {
  getBNBToUSDTRate();
}, []);




const handleProductSelection = (event) => {
  const selectedId = event.target.value;
  setSelectedProductId(selectedId);  // Met à jour l'ID du produit sélectionné
  updateProductInfo(selectedId); // Met à jour les informations du produit en utilisant l'objet local
};

  
  
  
// Affichage de l'interface utilisateur
return (
  <div className="App">
    <div className="parallax-container">
      <video id="video-background" autoPlay loop muted>
        <source src="https://gateway.pinata.cloud/ipfs/QmPZ8v3KzeyH2Dqz29TZFWe4kswkUETJyesZFCFULtagwv" type="video/mp4" />
        Votre navigateur ne supporte pas les vidéos HTML5.
      </video>

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
              <p>Prix du produit en USDT : {productPrice} USDT</p>
              <p>Prix du produit en BNB : {convertedPrice ? convertedPrice : 'Chargement...'} BNB</p>
              <p>Le produit est {productInfo.exists ? 'disponible' : 'indisponible'}</p>
            </div>
          )}

          <select onChange={handleProductSelection} value={selectedProductId}>
            <option value="">Sélectionnez un produit</option>
            <option value="product1">Produit 1</option>
            <option value="product2">Produit 2</option>
            <option value="product3">Produit 3</option>
          </select>

          <button onClick={handlePayment}>Payer pour le produit en BNB</button>

          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
      </div>
    </div>
  </div>
);
};

export default App;