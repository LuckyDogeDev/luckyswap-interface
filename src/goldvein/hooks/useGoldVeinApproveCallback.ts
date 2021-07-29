import { useCallback, useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useDispatch } from 'react-redux'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { useAlpineContract } from 'hooks/useContract'
import { KASHI_ADDRESS } from 'goldvein/constants'
import { GoldVeinCooker, signMasterContractApproval } from 'goldvein/entities'
import { setGoldVeinApprovalPending } from 'state/application/actions'
import { useGoldVeinApprovalPending } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useAlpMasterContractAllowed } from 'state/alpine/hooks'

export enum AlpApprovalState {
    UNKNOWN,
    NOT_APPROVED,
    PENDING,
    FAILED,
    APPROVED
}

export interface GoldVeinPermit {
    account: string
    masterContract: string
    v: number
    r: string
    s: string
}

export enum AlpApproveOutcome {
    SUCCESS,
    REJECTED,
    FAILED,
    NOT_READY
}

export type AlpApproveResult = {
    outcome: AlpApproveOutcome
    permit?: GoldVeinPermit
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
function useGoldVeinApproveCallback(): [
    AlpApprovalState,
    boolean,
    GoldVeinPermit | undefined,
    () => void,
    (pair: any, execute: (cooker: GoldVeinCooker) => Promise<string>) => void
] {
    const { account, library, chainId } = useActiveWeb3React()
    const dispatch = useDispatch()
    const [approveGoldVeinFallback, setApproveGoldVeinFallback] = useState<boolean>(false)
    const [goldveinPermit, setGoldVeinPermit] = useState<GoldVeinPermit | undefined>(undefined)

    useEffect(() => {
        setGoldVeinPermit(undefined)
    }, [account, chainId])

    const masterContract = chainId && KASHI_ADDRESS[chainId]

    const pendingApproval = useGoldVeinApprovalPending()
    const currentAllowed = useAlpMasterContractAllowed(masterContract, account || ethers.constants.AddressZero)
    const addTransaction = useTransactionAdder()

    // check the current approval status
    const approvalState: AlpApprovalState = useMemo(() => {
        if (!masterContract) return AlpApprovalState.UNKNOWN
        if (!currentAllowed && pendingApproval) return AlpApprovalState.PENDING

        return currentAllowed ? AlpApprovalState.APPROVED : AlpApprovalState.NOT_APPROVED
    }, [masterContract, currentAllowed, pendingApproval])

    const alPineContract = useAlpineContract()

    const approve = useCallback(async (): Promise<AlpApproveResult> => {
        if (approvalState !== AlpApprovalState.NOT_APPROVED) {
            console.error('approve was called unnecessarily')
            return { outcome: AlpApproveOutcome.NOT_READY }
        }
        if (!masterContract) {
            console.error('no token')
            return { outcome: AlpApproveOutcome.NOT_READY }
        }

        if (!alPineContract) {
            console.error('no alpine contract')
            return { outcome: AlpApproveOutcome.NOT_READY }
        }

        if (!account) {
            console.error('no account')
            return { outcome: AlpApproveOutcome.NOT_READY }
        }
        if (!library) {
            console.error('no library')
            return { outcome: AlpApproveOutcome.NOT_READY }
        }

        try {
            const signature = await signMasterContractApproval(
                alPineContract,
                masterContract,
                account,
                library,
                true,
                chainId
            )
            const { v, r, s } = ethers.utils.splitSignature(signature)
            return {
                outcome: AlpApproveOutcome.SUCCESS,
                permit: { account, masterContract, v, r, s }
            }
        } catch (e) {
            return {
                outcome: e.code === 4001 ? AlpApproveOutcome.REJECTED : AlpApproveOutcome.FAILED
            }
        }
    }, [approvalState, account, library, chainId, alPineContract, masterContract])

    const onApprove = async function() {
        if (!approveGoldVeinFallback) {
            const result = await approve()
            if (result.outcome === AlpApproveOutcome.SUCCESS) {
                setGoldVeinPermit(result.permit)
            } else if (result.outcome === AlpApproveOutcome.FAILED) {
                setApproveGoldVeinFallback(true)
            }
        } else {
            const tx = await alPineContract?.setMasterContractApproval(
                account,
                masterContract,
                true,
                0,
                ethers.constants.HashZero,
                ethers.constants.HashZero
            )
            dispatch(setGoldVeinApprovalPending('Approve GoldVein'))
            await tx.wait()
            dispatch(setGoldVeinApprovalPending(''))
        }
    }

    const onCook = async function(pair: any, execute: (cooker: GoldVeinCooker) => Promise<string>) {
        const cooker = new GoldVeinCooker(pair, account, library, chainId)
        let summary
        if (approvalState === AlpApprovalState.NOT_APPROVED && goldveinPermit) {
            cooker.approve(goldveinPermit)
            summary = 'Approve GoldVein and ' + (await execute(cooker))
        } else {
            summary = await execute(cooker)
        }
        const result = await cooker.cook()
        if (result.success) {
            addTransaction(result.tx, { summary })
            setGoldVeinPermit(undefined)
            await result.tx.wait()
        }
    }

    return [approvalState, approveGoldVeinFallback, goldveinPermit, onApprove, onCook]
}

export default useGoldVeinApproveCallback
