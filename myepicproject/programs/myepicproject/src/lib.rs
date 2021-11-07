use anchor_lang::prelude::*;

declare_id!("7PRJHwrQBVyNwuK2bfAf7fponi73Q7bmGSGsjvU5twoJ");

#[program]
pub mod myepicproject {
    use super::*;
    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: *base_account.to_account_info().key,
            votes: 0,
        };

        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn vote_gif(ctx: Context<VoteGif>, gif_id: u32) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        let gif_id = gif_id as usize;

        base_account.gif_list[gif_id].votes += 1;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer=user, space=9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[derive(Accounts)]
pub struct VoteGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct ItemStruct  {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub votes: u32,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u32,
    pub gif_list: Vec<ItemStruct>,
}