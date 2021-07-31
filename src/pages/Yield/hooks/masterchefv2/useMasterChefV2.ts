import { useMasterChefV2Contract, useGoldNuggetContract } from '../../../../hooks/useContract'

import { ethers } from 'ethers'
import { useActiveWeb3React } from '../../../../hooks/useActiveWeb3React'
import { useCallback } from 'react'
import { useTransactionAdder } from '../../../../state/transactions/hooks'

const useMasterChefV2 = () => {
    const addTransaction = useTransactionAdder()
    const golnTokenContract = useGoldNuggetContract()
    const masterChefV2Contract = useMasterChefV2Contract()

    const { account } = useActiveWeb3React()

    // Deposit
    const deposit = useCallback(
        async (pid: number, amount: string, name: string, decimals = 18) => {
            // KMP decimals depend on asset, LLP is always 18
            console.log(
                'depositing...',
                pid,
                amount,
                ethers.utils.parseUnits(amount, decimals),
                name,
                masterChefV2Contract?.address,
                masterChefV2Contract,
                account
            )
            try {
                const tx = await masterChefV2Contract?.deposit(pid, ethers.utils.parseUnits(amount, decimals), account)
                return addTransaction(tx, { summary: `Deposit ${name}` })
            } catch (e) {
                console.error(e)
                return e
            }
        },
        [account, addTransaction, masterChefV2Contract]
    )

    // Withdraw
    const withdraw = useCallback(
        async (pid: number, amount: string, name: string, decimals = 18) => {
            try {
                const tx = await masterChefV2Contract?.withdraw(pid, ethers.utils.parseUnits(amount, decimals), account)
                return addTransaction(tx, { summary: `Withdraw ${name}` })
            } catch (e) {
                console.error(e)
                return e
            }
        },
        [account, addTransaction, masterChefV2Contract]
    )

    const harvest = useCallback(
        async (pid: number, name: string) => {
            try {
                console.log('harvest:', pid, account)
                console.log({ masterChefV2Contract })

                const pendingGoldNugget = await masterChefV2Contract?.pendingGoldNugget(pid, account)
                const balanceOf = await golnTokenContract?.balanceOf(masterChefV2Contract?.address)

                const tx = pendingGoldNugget.gt(balanceOf)
                    ? await masterChefV2Contract?.batch(
                          [
                              masterChefV2Contract.interface.encodeFunctionData('harvestFromMasterChef'),
                              masterChefV2Contract.interface.encodeFunctionData('harvest', [pid, account])
                          ],
                          true
                      )
                    : await masterChefV2Contract?.harvest(pid, account)

                return addTransaction(tx, { summary: `Harvest ${name}` })
            } catch (e) {
                console.error(e)
                return e
            }
        },
        [account, addTransaction, masterChefV2Contract]
    )

    return { deposit, withdraw, harvest }
}

export default useMasterChefV2
