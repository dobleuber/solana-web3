const anchor = require('@project-serum/anchor');

const {SystemProgram} = anchor.web3;

const main = async () => {
    console.log('Starting test...');

    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
  
    const program = anchor.workspace.Myepicproject;
	
	// Create an account keypair for our program to use.
    const baseAccount = anchor.web3.Keypair.generate();

    const tx  = await program.rpc.startStuffOff(
        {
            accounts: {
                baseAccount: baseAccount.publicKey,
                user: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [
                baseAccount
            ]
        }
    );

    console.log('Transaction Signature:', tx);

    program.addEventListener('GifAdded', (event) => {
        console.log('GifAdded event:', event.index, event.gifLink);
    })

    program.addEventListener('GifVoted', (event) => {
        console.log('GifVoted event:', event.index, event.votes);
    })

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);

    console.log('Kitty Gif Account', account.totalGifs.toString());

    await program.rpc.addGif('https://c.tenor.com/i39K1COMe3oAAAAM/kitten-falls-kitten-stumbling.gif', {
        accounts: {
            baseAccount: baseAccount.publicKey,
        }
    });

    await program.rpc.addGif('https://c.tenor.com/ZY20qdo9d5wAAAAM/kitten-cute.gif', {
        accounts: {
            baseAccount: baseAccount.publicKey,
        }
    });

    await program.rpc.voteGif(1, {
        accounts: {
            baseAccount: baseAccount.publicKey,
        }
    });

    await program.rpc.voteGif(1, {
        accounts: {
            baseAccount: baseAccount.publicKey,
        }
    });

    account = await program.account.baseAccount.fetch(baseAccount.publicKey);

    console.log('new Kitty Gif Account', account.totalGifs.toString());

    console.log('Gif list: ', account.gifList);
};

main().then(() => {
    console.log('Test complete');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});