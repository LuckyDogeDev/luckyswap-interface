import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../useActiveWeb3React'
import { useMiniMinerV2Contract } from '../useContract'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../../state/multicall/hooks'

export function useAllPendingGoldNugget(): number {
    const { account } = useActiveWeb3React()
    const miniMiner = useMiniMinerV2Contract()
    const numberOfPools = useSingleCallResult(miniMiner, 'poolLength', undefined, NEVER_RELOAD)

    const args = useMemo(
        () =>
            [...Array(!numberOfPools.loading ? numberOfPools?.result?.[0].toNumber() : 0).keys()].map(pid => [
                String(pid),
                String(account)
            ]),
        [numberOfPools, account]
    )

    const data = useSingleContractMultipleData(miniMiner, 'pendingGoldNugget', args)

    return useMemo(
        () =>
            data?.reduce<number>((memo, { result }) => {
                if (result?.[0] && result[0].gt(BigNumber.from(0))) {
                    memo += result[0].div(BigNumber.from(10).pow(18)).toNumber()
                }
                return memo
            }, 0) ?? 0,
        [data]
    )
}
