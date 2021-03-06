import { exchange, goldminer } from 'apollo/client'
import { liquidityPositionSubsetQuery, pairSubsetQuery, poolsQuery } from 'apollo/queries'
import { useCallback, useEffect, useState } from 'react'

import { POOL_DENY } from '../../../../constants'
import { getAverageBlockTime } from 'apollo/getAverageBlockTime'
import _ from 'lodash'
import orderBy from 'lodash/orderBy'
//import range from 'lodash/range'
import golnData from '@luckyfinance/lucky-data'

import { useActiveWeb3React } from '../../../../hooks/useActiveWeb3React'
import { ChainId } from '@luckyfinance/sdk'

// Todo: Rewrite in terms of web3 as opposed to subgraph
const useFarms = () => {
    const { account, chainId } = useActiveWeb3React()
    const [farms, setFarms] = useState<any | undefined>()

    const fetchLLPFarms = useCallback(async () => {
        const results = await Promise.all([
            goldminer.query({
                query: poolsQuery
            }),
            exchange.query({
                query: liquidityPositionSubsetQuery,
                variables: { user: '0xc2edad668740f1aa35e4d8f227fb8e17dca888cd' }
            }),
            getAverageBlockTime(),
            golnData.goln.priceUSD()
        ])
        const pools = results[0]?.data.pools
        const pairAddresses = pools
            .map((pool: any) => {
                return pool.pair
            })
            .sort()
        const pairsQuery = await exchange.query({
            query: pairSubsetQuery,
            variables: { pairAddresses }
        })

        const liquidityPositions = results[1]?.data.liquidityPositions
        const averageBlockTime = results[2]
        const golnPrice = results[3]

        const pairs = pairsQuery?.data.pairs

        const farms = pools
            .filter((pool: any) => {
                return !POOL_DENY.includes(pool?.id) && pairs.find((pair: any) => pair?.id === pool?.pair)
            })
            .map((pool: any) => {
                const pair = pairs.find((pair: any) => pair.id === pool.pair)
                const liquidityPosition = liquidityPositions.find(
                    (liquidityPosition: any) => liquidityPosition.pair.id === pair.id
                )
                const blocksPerHour = 3600 / Number(averageBlockTime)
                const balance = Number(pool.balance / 1e18)
                const totalSupply = pair.totalSupply > 0 ? pair.totalSupply : 0.1
                const reserveUSD = pair.reserveUSD > 0 ? pair.reserveUSD : 0.1
                const balanceUSD = (balance / Number(totalSupply)) * Number(reserveUSD)
                const rewardPerBlock =
                    ((pool.allocPoint / pool.owner.totalAllocPoint) * pool.owner.golnPerBlock) / 1e18

                const roiPerBlock = (rewardPerBlock * golnPrice) / balanceUSD
                const roiPerHour = roiPerBlock * blocksPerHour
                const roiPerDay = roiPerHour * 24
                const roiPerMonth = roiPerDay * 30
                const roiPerYear = roiPerMonth * 12

                const rewardPerDay = rewardPerBlock * blocksPerHour * 24

                return {
                    ...pool,
                    contract: 'goldminerv1',
                    type: 'LLP',
                    symbol: pair.token0.symbol + '-' + pair.token1.symbol,
                    name: pair.token0.name + ' ' + pair.token1.name,
                    pid: Number(pool.id),
                    pairAddress: pair.id,
                    llpBalance: pool.balance,
                    golnRewardPerDay: rewardPerDay,
                    liquidityPair: pair,
                    roiPerBlock,
                    roiPerHour,
                    roiPerDay,
                    roiPerMonth,
                    roiPerYear,
                    rewardPerThousand: 1 * roiPerDay * (1000 / golnPrice),
                    tvl: liquidityPosition?.liquidityTokenBalance
                        ? (pair.reserveUSD / pair.totalSupply) * liquidityPosition.liquidityTokenBalance
                        : 0.1
                }
            })

        const sorted = orderBy(farms, ['pid'], ['desc'])
        return sorted
    }, [])

    const fetchKMPFarms = useCallback(async () => {
        const results = await Promise.all([
            goldminer.query({
                query: poolsQuery
            }),
            golnData.alpine.goldveinStakedInfo(),
            getAverageBlockTime()
        ])
        const pools = results[0]?.data.pools
        const goldveinPairs = results[1].filter(result => result !== undefined) // filter out undefined (not in onsen) from all goldveinPairs
        const averageBlockTime = results[2]

        const GOLDVEIN_PAIRS = pools
            .filter((pool: any) => {
                const hasPair = goldveinPairs.find((goldveinPair: any) => goldveinPair?.id === pool?.pair)
                return hasPair
            })
            .map((pool: any) => {
                return Number(pool.id)
            })
        //const GOLDVEIN_PAIRS = concat(range(190, 230, 1), range(245, 250, 1), range(264, 268, 1)) // goldveinPair pids 190-229, 245-249
        const farms = pools
            .filter((pool: any) => {
                return !POOL_DENY.includes(pool?.id) && GOLDVEIN_PAIRS.includes(Number(pool?.id))
            })
            .map((pool: any) => {
                const pair = goldveinPairs.find((pair: any) => pair?.id === pool?.pair)
                console.log('pair:', pair)

                const blocksPerHour = 3600 / Number(averageBlockTime)
                const rewardPerBlock = pair?.rewardPerBlock

                const golnRewardPerDay = rewardPerBlock ? rewardPerBlock * blocksPerHour * 24 : 0

                return {
                    ...pool,
                    ...pair,
                    contract: 'goldminerv1',
                    type: 'KMP',
                    pid: Number(pool.id),
                    pairAddress: pair?.id,
                    pairSymbol: pair?.symbol,
                    liquidityPair: {
                        collateral: {
                            id: pair?.collateral,
                            symbol: pair?.collateralSymbol,
                            decimals: pair?.collateralDecimals
                        },
                        asset: { id: pair?.asset, symbol: pair?.assetSymbol, decimals: pair?.assetDecimals }
                    },
                    golnRewardPerDay: golnRewardPerDay,
                    roiPerYear: pair?.roiPerYear,
                    totalAssetStaked: pair?.totalAssetStaked
                        ? pair?.totalAssetStaked / Math.pow(10, pair?.assetDecimals)
                        : 0,
                    tvl: pair?.balanceUSD ? pair?.balanceUSD : 0
                }
            })

        const sorted = orderBy(farms, ['pid'], ['desc'])
        return sorted
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (chainId === ChainId.MAINNET || !account) {
                const results = await Promise.all([fetchLLPFarms(), fetchKMPFarms()])
                const combined = _.concat(results[0], results[1])
                const sorted = orderBy(combined, ['pid'], ['desc'])
                setFarms(sorted)
            } else {
                setFarms([])
            }
        }
        fetchData()
    }, [account, chainId, fetchKMPFarms, fetchLLPFarms])

    return farms
}

export default useFarms
