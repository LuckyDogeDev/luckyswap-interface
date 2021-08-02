import { BigNumber } from '@ethersproject/bignumber'
import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useGoldMinerContract, usePendingContract } from './useContract'
import { useBlockNumber } from '../state/application/hooks'

const useAllPending = () => {
    const [balance, setBalance] = useState<number | undefined>()
    const { account } = useActiveWeb3React()

    const masterMinerContract = useGoldMinerContract()
    const pendingContract = usePendingContract()
    const currentBlockNumber = useBlockNumber()

    const fetchAllPending = useCallback(async () => {
        const numberOfPools = await masterMinerContract?.poolLength()
        const pids = [...Array(parseInt(numberOfPools)).keys()]
        const results = await pendingContract?.functions.getPendingGoldNugget(account, pids)
        const allPending = results[1]
            .map((p: any) => p.pendingGoldNugget)
            .reduce((a: any, b: any) => BigNumber.from(a).add(BigNumber.from(b)), BigNumber.from(0))

        setBalance(
            BigNumber.from(allPending)
                .div(BigNumber.from(10).pow(18))
                .toNumber()
        )
    }, [account, masterMinerContract, pendingContract])

    useEffect(() => {
        if (account && masterMinerContract && pendingContract) {
            fetchAllPending()
        }
    }, [account, currentBlockNumber, fetchAllPending, masterMinerContract, pendingContract])

    return balance
}

export default useAllPending
