import { Currency, Token, WETH } from '@luckyfinance/sdk'
import { ZERO, e10, easyAmount, toAmount } from 'goldvein/functions'
import { useAlpineContract, useBoringHelperContract, useContract } from '../../hooks/useContract'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { BigNumber } from '@ethersproject/bignumber'
import ERC20_ABI from '../../constants/abis/erc20.json'
import { GoldVeinContext } from 'goldvein'
import { isAddress } from '../../utils'
import orderBy from 'lodash/orderBy'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useBlockNumber } from 'state/application/hooks'
import { useDefaultTokens } from 'hooks/Tokens'
import { useSingleCallResult } from 'state/multicall/hooks'
import useTransactionStatus from '../../hooks/useTransactionStatus'

export interface AlpBalance {
    address: string
    name: string
    symbol: string
    decimals: number | string
    balance: any
    alpBalance: any
    wallet: any
    alp: any
}

export function useAlpBalances(): AlpBalance[] {
    const { chainId, library, account } = useActiveWeb3React()
    const blockNumber = useBlockNumber()

    const boringHelperContract = useBoringHelperContract()
    const alPineContract = useAlpineContract()

    const [balances, setBalances] = useState<any>()
    const tokens = Object.values(useDefaultTokens()).filter((token: Token) => token.chainId === chainId)

    const weth = WETH[chainId || 1].address
    const info = useContext(GoldVeinContext).state.info

    const fetchAlpBalances = useCallback(async () => {
        const balanceData = await boringHelperContract?.getBalances(
            account,
            tokens.map((token: any) => token.address)
        )

        const balancesWithDetails = tokens
            .map((token, i) => {
                const fullToken = {
                    ...token,
                    ...balanceData[i],
                    usd: e10(token.decimals).muldiv(info?.ethRate || ZERO, balanceData[i].rate)
                }

                return {
                    address: token.address,
                    name: token.name,
                    symbol: token.address === weth ? Currency.getNativeCurrencySymbol(chainId) : token.symbol,
                    decimals: token.decimals,
                    balance: token.address === weth ? info?.ethBalance : balanceData[i].balance,
                    alpBalance: balanceData[i].alpBalance,
                    wallet: easyAmount(token.address === weth ? info?.ethBalance : balanceData[i].balance, fullToken),
                    alp: easyAmount(toAmount(fullToken, balanceData[i].alpBalance), fullToken)
                }
            })
            .filter(token => token.balance.gt('0') || token.alpBalance.gt('0'))
        setBalances(orderBy(balancesWithDetails, ['name'], ['asc']))
    }, [account, boringHelperContract, chainId, info, tokens, weth])

    useEffect(() => {
        if (account && alPineContract && library) {
            fetchAlpBalances()
        }
    }, [account, blockNumber, alPineContract, fetchAlpBalances, info, library])

    return balances
}

export function useAlpBalance(tokenAddress: string): { value: BigNumber; decimals: number } {
    const { account } = useActiveWeb3React()

    const boringHelperContract = useBoringHelperContract()
    const alPineContract = useAlpineContract()
    const tokenAddressChecksum = isAddress(tokenAddress)
    const tokenContract = useContract(tokenAddressChecksum ? tokenAddressChecksum : undefined, ERC20_ABI)

    const currentTransactionStatus = useTransactionStatus()

    const [balance, setBalance] = useState<any>()

    const fetchAlpBalance = useCallback(async () => {
        const balances = await boringHelperContract?.getBalances(account, [tokenAddressChecksum])
        const decimals = await tokenContract?.decimals()

        const amount = BigNumber.from(balances[0].alpShare).isZero()
            ? BigNumber.from(0)
            : BigNumber.from(balances[0].alpBalance)
                  .mul(BigNumber.from(balances[0].alpAmount))
                  .div(BigNumber.from(balances[0].alpShare))

        setBalance({
            value: amount,
            decimals: decimals
        })
    }, [account, tokenAddressChecksum, tokenContract, boringHelperContract])

    useEffect(() => {
        if (account && alPineContract && boringHelperContract && tokenContract) {
            fetchAlpBalance()
        }
    }, [account, alPineContract, currentTransactionStatus, fetchAlpBalance, tokenContract, boringHelperContract])

    return balance
}

export function useAlpMasterContractAllowed(masterContract?: string, user?: string): boolean | undefined {
    const contract = useAlpineContract()

    const inputs = useMemo(() => [masterContract, user], [masterContract, user])
    const allowed = useSingleCallResult(contract, 'masterContractApproved', inputs).result

    return useMemo(() => (allowed ? allowed[0] : undefined), [allowed])
}
