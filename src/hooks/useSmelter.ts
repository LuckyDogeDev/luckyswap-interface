import { useSmelterContract } from './useContract'
import { useCallback } from 'react'
import { useTransactionAdder } from '../state/transactions/hooks'

const useSmelter = () => {
    const addTransaction = useTransactionAdder()
    const smelterContract = useSmelterContract()

    // Serve
    const serve = useCallback(
        async (token0: string, token1: string) => {
            try {
                const tx = await smelterContract?.methods.convert(token0, token1)
                return addTransaction(tx, { summary: 'Serve' })
            } catch (error) {
                return error
            }
        },
        [addTransaction, smelterContract]
    )

    // TODO: Serve all?

    return { serve }
}

export default useSmelter
