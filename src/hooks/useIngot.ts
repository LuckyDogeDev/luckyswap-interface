import { ChainId } from '@luckyfinance/sdk'
import { signERC2612Permit } from 'eth-permit'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import ReactGA from 'react-ga'
import { useActiveWeb3React } from '../hooks/useActiveWeb3React'
import { useIngotContract } from '../hooks/useContract'
import LPToken from '../types/LPToken'

const useIngot = (version: 'v1' | 'v2' = 'v2') => {
    const { chainId, library, account } = useActiveWeb3React()
    const inGot = useIngotContract(version)
    const ttl = 60 * 20

    let from = ''

    if (chainId === ChainId.MAINNET) {
        from = 'Uniswap'
    } else if (chainId === ChainId.BSC) {
        from = 'PancakeSwap'
    }

    const migrate = useCallback(
        async (lpToken: LPToken, amount: ethers.BigNumber) => {
            if (inGot) {
                const deadline = Math.floor(new Date().getTime() / 1000) + ttl
                const args = [
                    lpToken.tokenA.address,
                    lpToken.tokenB.address,
                    amount,
                    ethers.constants.Zero,
                    ethers.constants.Zero,
                    deadline
                ]

                const gasLimit = await inGot.estimateGas.migrate(...args)
                const tx = inGot.migrate(...args, {
                    gasLimit: gasLimit.mul(120).div(100)
                })

                ReactGA.event({
                    category: 'Migrate',
                    action: `${from}->Luckyswap`,
                    label: 'migrate'
                })

                return tx
            }
        },
        [inGot, ttl, from]
    )

    const migrateWithPermit = useCallback(
        async (lpToken: LPToken, amount: ethers.BigNumber) => {
            if (account && inGot) {
                const deadline = Math.floor(new Date().getTime() / 1000) + ttl
                const permit = await signERC2612Permit(
                    library,
                    lpToken.address,
                    account,
                    inGot.address,
                    amount.toString(),
                    deadline
                )
                const args = [
                    lpToken.tokenA.address,
                    lpToken.tokenB.address,
                    amount,
                    ethers.constants.Zero,
                    ethers.constants.Zero,
                    deadline,
                    permit.v,
                    permit.r,
                    permit.s
                ]

                console.log('migrate with permit', args)

                const gasLimit = await inGot.estimateGas.migrateWithPermit(...args)
                const tx = await inGot.migrateWithPermit(...args, {
                    gasLimit: gasLimit.mul(120).div(100)
                })

                ReactGA.event({
                    category: 'Migrate',
                    action: `${from}->Luckyswap`,
                    label: 'migrateWithPermit'
                })

                return tx
            }
        },
        [account, library, inGot, ttl, from]
    )

    return {
        migrate,
        migrateWithPermit
    }
}

export default useIngot
