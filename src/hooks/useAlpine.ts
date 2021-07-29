import { BigNumber } from '@ethersproject/bignumber'
import { WETH } from '@luckyfinance/sdk'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useAlpineContract } from './useContract'
import { useTransactionAdder } from '../state/transactions/hooks'
import { isAddress } from '../utils'

function useAlpine() {
    const { account, chainId } = useActiveWeb3React()

    const addTransaction = useTransactionAdder()
    const alPineContract = useAlpineContract()

    const deposit = useCallback(
        async (tokenAddress: string, value: BigNumber) => {
            const tokenAddressChecksum = isAddress(tokenAddress)
            if (value && chainId) {
                try {
                    if (tokenAddressChecksum === WETH[chainId].address) {
                        const tx = await alPineContract?.deposit(
                            ethers.constants.AddressZero,
                            account,
                            account,
                            value,
                            0,
                            { value }
                        )
                        return addTransaction(tx, { summary: 'Deposit to Alpine' })
                    } else {
                        const tx = await alPineContract?.deposit(tokenAddressChecksum, account, account, value, 0)
                        return addTransaction(tx, { summary: 'Deposit to Alpine' })
                    }
                } catch (e) {
                    console.log('alpine deposit error:', e)
                    return e
                }
            }
        },
        [account, addTransaction, alPineContract, chainId]
    )

    const withdraw = useCallback(
        // todo: this should be updated with BigNumber as opposed to string
        async (tokenAddress: string, value: BigNumber) => {
            let tokenAddressChecksum = isAddress(tokenAddress)
            if (value && chainId) {
                try {
                    tokenAddressChecksum =
                        tokenAddressChecksum === WETH[chainId].address
                            ? '0x0000000000000000000000000000000000000000'
                            : tokenAddressChecksum
                    const tx = await alPineContract?.withdraw(tokenAddressChecksum, account, account, value, 0)
                    return addTransaction(tx, { summary: 'Withdraw from Alpine' })
                } catch (e) {
                    console.log('alpine withdraw error:', e)
                    return e
                }
            }
        },
        [account, addTransaction, alPineContract, chainId]
    )

    return { deposit, withdraw }
}

export default useAlpine
