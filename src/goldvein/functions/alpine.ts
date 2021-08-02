import { BigNumber } from '@ethersproject/bignumber'

export function toAmount(token: any, shares: BigNumber): BigNumber {
    return shares.muldiv(token.alpAmount, token.alpShare)
}

export function toShare(token: any, amount: BigNumber): BigNumber {
    return amount.muldiv(token.alpShare, token.alpAmount)
}
