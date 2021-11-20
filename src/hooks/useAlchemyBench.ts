import { ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import Fraction from '../entities/Fraction'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useAlchemyBenchContract, useGoldNuggetContract } from '../hooks/useContract'
import { useTransactionAdder } from '../state/transactions/hooks'
import { BalanceProps } from './useTokenBalance'

const { BigNumber } = ethers

const useAlchemyBench = () => {
    const { account } = useActiveWeb3React()
    const addTransaction = useTransactionAdder()
    const golnContract = useGoldNuggetContract(true) // withSigner
    const benchContract = useAlchemyBenchContract(true) // withSigner

    const [allowance, setAllowance] = useState('0')

    const fetchAllowance = useCallback(async () => {
        if (account) {
            try {
                const allowance = await golnContract?.allowance(account, benchContract?.address)
                const formatted = Fraction.from(BigNumber.from(allowance), BigNumber.from(10).pow(18)).toString()
                setAllowance(formatted)
            } catch (error) {
                setAllowance('0')
                throw error
            }
        }
    }, [account, benchContract, golnContract])

    useEffect(() => {
        if (account && benchContract && golnContract) {
            fetchAllowance()
        }
        const refreshInterval = setInterval(fetchAllowance, 10000)
        return () => clearInterval(refreshInterval)
    }, [account, benchContract, fetchAllowance, golnContract])

    const approve = useCallback(async () => {
        try {
            const tx = await golnContract?.approve(benchContract?.address, ethers.constants.MaxUint256.toString())
            return addTransaction(tx, { summary: 'Approve' })
        } catch (e) {
            return e
        }
    }, [addTransaction, benchContract, golnContract])

    const enter = useCallback(
        // todo: this should be updated with BigNumber as opposed to string
        async (amount: BalanceProps | undefined) => {
            if (amount?.value) {
                try {
                    const tx = await benchContract?.enter(amount?.value)
                    return addTransaction(tx, { summary: 'Enter AlchemyBench' })
                } catch (e) {
                    return e
                }
            }
        },
        [addTransaction, benchContract]
    )

    const leave = useCallback(
        // todo: this should be updated with BigNumber as opposed to string
        async (amount: BalanceProps | undefined) => {
            if (amount?.value) {
                try {
                    const tx = await benchContract?.leave(amount?.value)
                    //const tx = await benchContract?.leave(ethers.utils.parseUnits(amount)) // where amount is string
                    return addTransaction(tx, { summary: 'Leave AlchemyBench' })
                } catch (e) {
                    return e
                }
            }
        },
        [addTransaction, benchContract]
    )

    return { allowance, approve, enter, leave }
}

export default useAlchemyBench
