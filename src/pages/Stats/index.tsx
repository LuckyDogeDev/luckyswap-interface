import React, { useEffect } from 'react'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { Helmet } from 'react-helmet'
import { sushi as sushiData } from '@lufycz/sushi-data'
import { formattedNum } from '../../utils'

import { ROUTER_ADDRESS } from '@sushiswap/sdk'

export default function Stats() {
    const { account, chainId } = useActiveWeb3React()

    useEffect(() => {
        const fetchData = async () => {
            const results = await Promise.all([
                sushiData.exchange.factory({ chainId: 137 }),
                sushiData.exchange.factory({ chainId: 1 })
            ])
            console.log(results)
            const combinedLiquidityUSD = results[0].liquidityUSD + results[1].liquidityUSD
            const combinedVolumeUSD = results[1].volumeUSD + results[1].volumeUSD
            console.log('combinedLiquidityUSD:', formattedNum(combinedLiquidityUSD, true))
            console.log('combinedVolumeUSD:', formattedNum(combinedVolumeUSD, true))

            if (chainId) {
                console.log('ROUTER_ADDRESS:', ROUTER_ADDRESS[chainId], chainId)
            }
        }
        fetchData()
    }, [])
    return (
        <>
            <Helmet>
                <title>xSUSHI | Sushi</title>
            </Helmet>
            <div className="flex flex-col w-full"></div>
        </>
    )
}
