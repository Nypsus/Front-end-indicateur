// src/App.js
import React, { useState } from 'react';
import { ethers } from 'ethers';

// Ton ABI et adresse de contrat ici
const contractAddress = '0xCd25eee89Bb01603f0E0cf8D8C243966a926761d'; // Remplace cette adresse par l'adresse de ton contrat
const contractABI = [
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
  }
  // Ajoute d'autres éléments de l'ABI si nécessaire
];

const App = () => {
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fonction pour connecter MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask est requis pour interagir avec ce contrat.');
      return;
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    setSuccessMessage('Wallet connecté avec succès!');
  };

  // Fonction pour mettre à jour un produit
  const updateProduct = async () => {
    if (!window.ethereum) {
      alert('MetaMask est requis pour interagir avec ce contrat.');
      return;
    }
    if (!productId || !price) {
      alert('Veuillez remplir l\'ID du produit et le prix.');
      return;
    }

    // Initialiser le provider et signer la transaction
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Convertir le prix en wei (ou utiliser parseUnits si en USDT)
      const priceInWei = ethers.utils.parseUnits(price, 18);  // Assurez-vous que '18' est correct pour l'unité (par exemple USDT)

      // Appel de la fonction pour mettre à jour le prix du produit
      const tx = await contract.setProductPrice(productId, priceInWei);
      await tx.wait(); // Attendre que la transaction soit confirmée

      setSuccessMessage('Le produit a été mis à jour avec succès !');
    } catch (error) {
      setErrorMessage('Erreur lors de la mise à jour du produit : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Mettre à jour un produit</h1>
      <button onClick={connectWallet}>Connecter le portefeuille MetaMask</button>

      <div>
        <input
          type="text"
          placeholder="ID du produit"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
      </div>

      <div>
        <input
          type="number"
          placeholder="Prix du produit (en USDT)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <button onClick={updateProduct} disabled={loading}>
        {loading ? 'Mise à jour...' : 'Mettre à jour le produit'}
      </button>

      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
      {successMessage && <div style={{ color: 'green' }}>{successMessage}</div>}
    </div>
  );
};

export default App;
