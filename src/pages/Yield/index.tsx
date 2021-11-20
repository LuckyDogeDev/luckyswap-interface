import { Card, CardHeader, Search } from './components'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Header, GoldVeinLending, LiquidityPosition } from './components/Farms'
import React, { useEffect, useState } from 'react'
import { formattedNum, formattedPercent } from '../../utils'
import { useFuse, useSortableData } from 'hooks'
import { useGoldMinerContract, useMiniMinerV2Contract } from '../../hooks/useContract'

import { ChainId } from '@luckyfinance/sdk'
import { SimpleDots as Dots } from 'goldvein/components'
import { Helmet } from 'react-helmet'
import Menu from './Menu'
import { RowBetween } from '../../components/Row'
import _ from 'lodash'
import styled from 'styled-components'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import useGoldMinerFarms from './hooks/goldminerv1/useFarms'
import useGoldMinerV2Farms from './hooks/goldminerv2/useFarms'
import useMiniMinerFarms from './hooks/miniminer/useFarms'
import useStakedPending from './hooks/portfolio/useStakedPending'

export const FixedHeightRow = styled(RowBetween)`
    height: 24px;
`

export default function Yield(): JSX.Element {
    const { i18n } = useLingui()
    const [section, setSection] = useState<'portfolio' | 'all' | 'kmp' | 'slp' | 'mcv2'>('all')
    const { account, chainId } = useActiveWeb3React()

    // Get Farms
    const goldminerv1 = useGoldMinerFarms()
    const goldminerv2 = useGoldMinerV2Farms()
    const miniminer = useMiniMinerFarms()
    const allFarms = _.concat(
        goldminerv2 ? goldminerv2 : [],
        miniminer ? miniminer : [],
        goldminerv1 ? goldminerv1 : []
    )

    console.log('goldminerv2:', goldminerv2)

    // Get Contracts
    const goldminerContract = useGoldMinerContract()
    const miniminerContract = useMiniMinerV2Contract()

    // Get Portfolios
    const [portfolio, setPortfolio] = useState<any[]>()
    const goldminerv1Positions = useStakedPending(goldminerContract)
    const miniminerPositions = useStakedPending(miniminerContract)
    useEffect(() => {
        // determine goldminerv1 positions
        let goldminerv1Portfolio
        if (goldminerv1) {
            const goldminerv1WithPids = goldminerv1Positions?.[0].map((position, index) => {
                return {
                    pid: index,
                    pending_bn: position?.result?.[0],
                    staked_bn: goldminerv1Positions?.[1][index].result?.amount
                }
            })
            const goldminerv1Filtered = goldminerv1WithPids.filter(position => {
                return position?.pending_bn?.gt(0) || position?.staked_bn?.gt(0)
            })
            // fetch any relevant details through pid
            const goldminerv1PositionsWithDetails = goldminerv1Filtered.map(position => {
                const pair = goldminerv1?.find((pair: any) => pair.pid === position.pid)
                return {
                    ...pair,
                    ...position
                }
            })
            goldminerv1Portfolio = goldminerv1PositionsWithDetails
        }

        let miniminerPortfolio
        if (miniminer) {
            // determine miniminer positions
            const miniminerWithPids = miniminerPositions?.[0].map((position, index) => {
                return {
                    pid: index,
                    pending: position?.result?.[0],
                    staked: miniminerPositions?.[1][index].result?.amount
                }
            })
            const miniminerFiltered = miniminerWithPids.filter((position: any) => {
                return position?.pending?.gt(0) || position?.staked?.gt(0)
            })
            // fetch any relevant details through pid
            const miniminerPositionsWithDetails = miniminerFiltered.map(position => {
                const pair = miniminer?.find((pair: any) => pair.pid === position.pid)
                return {
                    ...pair,
                    ...position
                }
            })
            miniminerPortfolio = miniminerPositionsWithDetails
        }

        setPortfolio(
            _.concat(miniminerPortfolio, goldminerv1Portfolio)[0]
                ? _.concat(miniminerPortfolio, goldminerv1Portfolio)
                : []
        )
    }, [goldminerv1, goldminerv1Positions, miniminer, miniminerPositions])

    // GoldMiner v2
    const farms = allFarms

    //Search Setup
    const options = { keys: ['symbol', 'name', 'pairAddress'], threshold: 0.4 }
    const { result, search, term } = useFuse({
        data: farms && farms.length > 0 ? farms : [],
        options
    })
    const flattenSearchResults = result.map((a: { item: any }) => (a.item ? a.item : a))

    // Sorting Setup
    const { items, requestSort, sortConfig } = useSortableData(flattenSearchResults)

    console.log('term:', term)

    return (
        <>
            <Helmet>
                <title>{i18n._(t`Yield`)} | LuckyFinance</title>
                <meta name="description" content="Farm GOLN by staking LP (Liquidity Provider) tokens" />
            </Helmet>
            <div className="container grid grid-cols-4 gap-4 mx-auto">
                <div className="sticky top-0 hidden lg:block md:col-span-1" style={{ maxHeight: '40rem' }}>
                    <Menu section={section} setSection={setSection} />
                </div>
                <div className="col-span-4 lg:col-span-3">
                    <Card
                        className="h-full bg-dark-900"
                        header={
                            <CardHeader className="flex flex-col items-center bg-dark-800">
                                <div className="flex justify-between w-full">
                                    <div className="items-center hidden md:flex">
                                        <div className="mr-2 text-lg whitespace-nowrap">{i18n._(t`Yield Farms`)}</div>
                                    </div>
                                    <Search search={search} term={term} />
                                </div>
                                <div className="container block pt-6 lg:hidden">
                                    <Menu section={section} setSection={setSection} />
                                </div>
                                {chainId === ChainId.MATIC && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-700">
                                                    Polygon subgraphs are currently experiencing high loads. The APY
                                                    displayed are based on lagging fees. Funds are safe, we are working
                                                    on resolving and providing accurate consolidated APY information.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardHeader>
                        }
                    >
                        {section && section === 'portfolio' && (
                            <>
                                {account ? (
                                    <>
                                        <Header sortConfig={sortConfig} requestSort={requestSort} />
                                        <div className="flex-col space-y-2">
                                            {portfolio && portfolio.length > 0 ? (
                                                portfolio.map((farm: any, i: number) => {
                                                    console.log('portfolio farm:', farm, portfolio)
                                                    if (farm.type === 'KMP') {
                                                        return <GoldVeinLending key={farm.address + '_' + i} farm={farm} />
                                                    } else if (farm.type === 'LLP') {
                                                        return (
                                                            <LiquidityPosition
                                                                key={farm.address + '_' + i}
                                                                farm={farm}
                                                            />
                                                        )
                                                    } else {
                                                        return null
                                                    }
                                                })
                                            ) : (
                                                <>
                                                    {term ? (
                                                        <div className="w-full py-6 text-center">No Results.</div>
                                                    ) : (
                                                        <div className="w-full py-6 text-center">
                                                            <Dots>Fetching Portfolio</Dots>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full py-6 text-center">Connect Wallet.</div>
                                )}
                            </>
                        )}
                        {section && section === 'all' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">
                                    {items && items.length > 0 ? (
                                        items.map((farm: any, i: number) => {
                                            if (farm.type === 'KMP') {
                                                return <GoldVeinLending key={farm.address + '_' + i} farm={farm} />
                                            } else if (farm.type === 'LLP') {
                                                return <LiquidityPosition key={farm.address + '_' + i} farm={farm} />
                                            } else {
                                                return null
                                            }
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {section && section === 'slp' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">
                                    {items && items.length > 0 ? (
                                        items.map((farm: any, i: number) => {
                                            if (farm.type === 'LLP') {
                                                return <LiquidityPosition key={farm.address + '_' + i} farm={farm} />
                                            } else {
                                                return null
                                            }
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {section && section === 'kmp' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">
                                    {items && items.length > 0 ? (
                                        items.map((farm: any, i: number) => {
                                            if (farm.type === 'KMP') {
                                                return <GoldVeinLending key={farm.address + '_' + i} farm={farm} />
                                            } else {
                                                return null
                                            }
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {section && section === 'mcv2' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">
                                    {items && items.length > 0 ? (
                                        items.map((farm: any, i: number) => {
                                            if (farm.type === 'LLP' && farm.contract === 'goldminerv2') {
                                                return <LiquidityPosition key={farm.address + '_' + i} farm={farm} />
                                            } else {
                                                return null
                                            }
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </>
    )
}
