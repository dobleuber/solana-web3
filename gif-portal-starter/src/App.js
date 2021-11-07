import { useEffect, useState, useCallback } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

import idl from './idl.json';

import kp from './keypair.json';

const {SystemProgram, Keypair} = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address);

const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: 'processed'
};

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [gifList, setGifList] = useState([]);

  // Actions
  const getGifList = useCallback(async () => {
    try {
      const {program} = getProvider();
      const account = await program.account.baseAccount
        .fetch(baseAccount.publicKey);
      console.log('Got the account', account);
      setGifList(account.gifList);
    } catch (error) {
      console.error("Error in getGifs: ", error)
      setGifList(null);
    }
  }, [setGifList])

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const sendGif = useCallback(async (event) => {
    event.preventDefault();
    const linkValue = event.target["giflink"].value;
    console.log('form data', linkValue);
    try {
      const {program} = getProvider();

      await program.rpc.addGif(linkValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        }
      });

      event.target.reset();

    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  }, []);

  const onVoteClickHandler = useCallback(async (idx) => {
    try {
      const {program} = getProvider();

      await program.rpc.voteGif(idx, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        }
      })
    } catch (error) {
      console.log("Error voting GIF:", error)
    }
  }, [])

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment
    )

    const program = new Program(idl, programID, provider);

    return {provider, program};
  }

  const createGifAccount = useCallback(async () => {
    try {
      const {provider, program} = getProvider();
      console.log('ping');

      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
    } catch(err) {
      console.error(err);
    }
  }, [])

  const renderConnectedContainer = useCallback(() => {
    if (gifList) {
      return (
        <div className="connected-container">
          <form onSubmit={sendGif}>
            <input type="text" name="giflink" placeholder="Enter a new kitty gif link!" required />
            <button className="cta-button submit-gif-button" type="submit" >Submit</button>
          </form>
          <div className="gif-grid">
            {
              gifList.map((gif, idx) => (
                <div className="gif-item" key={gif.gifLink}>
                  <button onClick={() => onVoteClickHandler(idx)}>
                   ❤️ {gif.votes} Likes </button>
                  <img src={gif.gifLink} alt={gif.gifLink} />
                  <div className="tools">
                    <span>{gif.userAddress.toString()}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )
    }

    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    );
  }, [gifList, createGifAccount, onVoteClickHandler, sendGif]);

  const fetchGifList = useCallback(async () => {
    if (walletAddress) {
      await getGifList();
    }
  }, [walletAddress, getGifList])

  // UseEffects
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, [checkIfWalletIsConnected]);

  useEffect(() => {
    if (walletAddress) {
      fetchGifList();
    }

  }, [walletAddress, fetchGifList])

  // Events
  useEffect(() => {
    const {program} = getProvider();
    const listener = program.addEventListener('GifAdded', ({index, gifLink, userAddress}) => {
      console.log('new gift', index, gifLink, userAddress.toString());
      setGifList(list => (
        [
          ...list,
          {
            gifLink,
            userAddress,
            votes: 0
          }
        ]
      ))

    })

    return () => {
      program.removeEventListener(listener);
    }
  }, [setGifList]);

  useEffect(() => {
    const {program} = getProvider();
    const listener = program.addEventListener('GifVoted', ({index, votes}) => {
      console.log('gift voted', index, votes);
      setGifList(list => (
        list.map((g, idx) => {
          if (index === idx) {
            return {
              ...g,
              votes
            };
          }

          return g;
        })
      ))

    })

    return () => {
      program.removeEventListener(listener);
    }
  }, [setGifList]);

  return (
    <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🐱 Kitty GIF Portal 🐱</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}

          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;