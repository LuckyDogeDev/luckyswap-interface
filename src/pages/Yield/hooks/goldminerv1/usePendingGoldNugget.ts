import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { useGoldMinerContract } from 'hooks/useContract'
import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import Fraction from '../../../../entities/Fraction'

const usePending = (pid: number) => {
    const [balance, setBalance] = useState<string>('0')
    const { account } = useActiveWeb3React()

    const masterMinerContract = useGoldMinerContract()
    const currentBlockNumber = useBlockNumber()

    const fetchPending = useCallback(async () => {
        const pending = await masterMinerContract?.pendingGoldNugget(pid, account)
        const formatted = Fraction.from(BigNumber.from(pending), BigNumber.from(10).pow(18)).toString()
        setBalance(formatted)
    }, [account, masterMinerContract, pid])

    useEffect(() => {
        if (account && masterMinerContract && String(pid)) {
            // pid = 0 is evaluated as false
            fetchPending()
        }
    }, [account, currentBlockNumber, fetchPending, masterMinerContract, pid])

    return balance
}

export default usePending
