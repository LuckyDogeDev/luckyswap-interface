import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { useMiniMinerV2Contract } from 'hooks/useContract'
import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import Fraction from '../../entities/Fraction'

const usePending = (pid: number) => {
    const [balance, setBalance] = useState<string>('0')
    const { account } = useActiveWeb3React()

    const miniMinerV2Contract = useMiniMinerV2Contract()
    const currentBlockNumber = useBlockNumber()

    const fetchPending = useCallback(async () => {
        const pending = await miniMinerV2Contract?.pendingGoldNugget(pid, account)
        const formatted = Fraction.from(BigNumber.from(pending), BigNumber.from(10).pow(18)).toString(18)
        setBalance(formatted)
    }, [account, miniMinerV2Contract, pid])

    useEffect(() => {
        if (account && miniMinerV2Contract && String(pid)) {
            // pid = 0 is evaluated as false
            fetchPending()
        }
    }, [account, currentBlockNumber, fetchPending, miniMinerV2Contract, pid])

    return balance
}

export default usePending
