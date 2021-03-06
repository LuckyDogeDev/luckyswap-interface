import { parseUnits } from '@ethersproject/units'
import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useIsTransactionPending, useTransactionAdder } from '../state/transactions/hooks'
import useLPTokensState, { LPTokensState } from './useLPTokensState'
import useIngot from './useIngot'
import { ChainId } from '@luckyfinance/sdk'

export type MigrateMode = 'permit' | 'approve'

export interface MigrateState extends LPTokensState {
    amount: string
    setAmount: (amount: string) => void
    mode?: MigrateMode
    setMode: (_mode?: MigrateMode) => void
    onMigrate: () => Promise<void>
    pendingMigrationHash: string | null
    isMigrationPending: boolean
}

const useMigrateState: () => MigrateState = () => {
    const { library, account, chainId } = useActiveWeb3React()
    const state = useLPTokensState()
    const { migrate, migrateWithPermit } = useIngot(state?.selectedLPToken?.version)
    const [mode, setMode] = useState<MigrateMode>()
    const [amount, setAmount] = useState('')
    const addTransaction = useTransactionAdder()
    const [pendingMigrationHash, setPendingMigrationHash] = useState<string | null>(null)
    const isMigrationPending = useIsTransactionPending(pendingMigrationHash ?? undefined)

    useEffect(() => {
        state.setSelectedLPToken(undefined)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode])

    const onMigrate = useCallback(async () => {
        if (mode && state.selectedLPToken && account && library) {
            const units = parseUnits(amount || '0', state.selectedLPToken.decimals)
            const func = mode === 'approve' ? migrate : migrateWithPermit
            const tx = await func(state.selectedLPToken, units)

            let exchange

            if (chainId === ChainId.MAINNET) {
                exchange = 'Uniswap'
            } else if (chainId === ChainId.BSC) {
                exchange = 'PancakeSwap'
            } else if (chainId === ChainId.MATIC) {
                exchange = 'QuickSwap'
            }

            addTransaction(tx, {
                summary: `Migrate ${exchange} ${state.selectedLPToken.symbol} liquidity to LuckySwap`
            })
            setPendingMigrationHash(tx.hash)

            await tx.wait()
            state.setSelectedLPToken(undefined)
            await state.updateLPTokens()
        }
    }, [mode, state, account, library, amount, migrate, migrateWithPermit, chainId, addTransaction])

    return {
        ...state,
        amount,
        setAmount,
        mode,
        setMode,
        onMigrate,
        pendingMigrationHash,
        isMigrationPending
    }
}
export default useMigrateState
