import { ethers } from 'ethers'
import { useGoldMinerContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { useTransactionAdder } from '../state/transactions/hooks'

const useGoldMiner = () => {
    const addTransaction = useTransactionAdder()
    const masterMinerContract = useGoldMinerContract() // withSigner

    // Deposit
    const deposit = useCallback(
        async (pid: number, amount: string, name: string, decimals = 18) => {
            // KMP decimals depend on asset, LLP is always 18
            // console.log('depositing...', pid, amount)
            try {
                const tx = await masterMinerContract?.deposit(pid, ethers.utils.parseUnits(amount, decimals))
                return addTransaction(tx, { summary: `Deposit ${name}` })
            } catch (e) {
                console.error(e)
                return e
            }
        },
        [addTransaction, masterMinerContract]
    )

    // Withdraw
    const withdraw = useCallback(
        async (pid: number, amount: string, name: string, decimals = 18) => {
            try {
                const tx = await masterMinerContract?.withdraw(pid, ethers.utils.parseUnits(amount, decimals))
                return addTransaction(tx, { summary: `Withdraw ${name}` })
            } catch (e) {
                console.error(e)
                return e
            }
        },
        [addTransaction, masterMinerContract]
    )

    const harvest = useCallback(
        async (pid: number, name: string) => {
            try {
                const tx = await masterMinerContract?.deposit(pid, '0')
                return addTransaction(tx, { summary: `Harvest ${name}` })
            } catch (e) {
                console.error(e)
                return e
            }
        },
        [addTransaction, masterMinerContract]
    )

    return { deposit, withdraw, harvest }
}

export default useGoldMiner
