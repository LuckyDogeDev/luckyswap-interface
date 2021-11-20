import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { useGoldMinerContract } from 'hooks/useContract'
import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'

export interface BalanceProps {
    value: BigNumber
    decimals: number
}

const useStakedBalance = (pid: number, decimals = 18) => {
    // LLP is usually 18, KMP is 6
    const [balance, setBalance] = useState<BalanceProps>({ value: BigNumber.from(0), decimals: 18 })

    const { account } = useActiveWeb3React()
    const currentBlockNumber = useBlockNumber()
    const masterMinerContract = useGoldMinerContract()

    const fetchBalance = useCallback(async () => {
        const getStaked = async (pid: number, owner: string | null | undefined): Promise<BalanceProps> => {
            try {
                const { amount } = await masterMinerContract?.userInfo(pid, owner)
                return { value: BigNumber.from(amount), decimals: decimals }
            } catch (e) {
                return { value: BigNumber.from(0), decimals: decimals }
            }
        }
        const balance = await getStaked(pid, account)
        setBalance(balance)
    }, [account, decimals, masterMinerContract, pid])

    useEffect(() => {
        if (account && masterMinerContract) {
            fetchBalance()
        }
    }, [account, setBalance, currentBlockNumber, fetchBalance, masterMinerContract])

    return balance
}

export default useStakedBalance
