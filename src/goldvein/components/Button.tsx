import React from 'react'
import { BENTOBOX_ADDRESS, KASHI_ADDRESS } from 'goldvein/constants'
import { AlpApprovalState, useGoldVeinApproveCallback } from 'goldvein/hooks'
import { Alert, Button } from 'components'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { tryParseAmount } from 'state/swap/hooks'
import { WETH } from '@luckyfinance/sdk'
import Dots from './Dots'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export function GoldVeinApproveButton({ content, color }: any): any {
    const { i18n } = useLingui()
    const { chainId } = useActiveWeb3React()
    const [goldveinApprovalState, approveGoldVeinFallback, goldveinPermit, onApprove, onCook] = useGoldVeinApproveCallback()
    const showApprove =
        (goldveinApprovalState === AlpApprovalState.NOT_APPROVED || goldveinApprovalState === AlpApprovalState.PENDING) &&
        !goldveinPermit
    const showChildren = goldveinApprovalState === AlpApprovalState.APPROVED || goldveinPermit

    return (
        <>
            {approveGoldVeinFallback && (
                <Alert
                    message={i18n._(
                        t`Something went wrong during signing of the approval. This is expected for hardware wallets, such as Trezor and Ledger. Click again and the fallback method will be used`
                    )}
                    className="mb-4"
                />
            )}

            {showApprove && (
                <Button color={color} onClick={onApprove} className="mb-4">
                    {i18n._(t`Approve GoldVein`)}
                </Button>
            )}

            {showChildren && React.cloneElement(content(onCook), { color })}
        </>
    )
}

export function TokenApproveButton({ children, value, token, needed, color }: any): any {
    const { i18n } = useLingui()
    const { chainId } = useActiveWeb3React()
    const [approvalState, approve] = useApproveCallback(
        tryParseAmount(value, token),
        chainId && BENTOBOX_ADDRESS[chainId]
    )

    const showApprove =
        chainId &&
        token &&
        token.address !== WETH[chainId].address &&
        needed &&
        value &&
        (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING)

    return showApprove ? (
        <Button color={color} onClick={approve} className="mb-4">
            <Dots pending={approvalState === ApprovalState.PENDING} pendingTitle={`Approving ${token.symbol}`}>
                {i18n._(t`Approve`)} {token.symbol}
            </Dots>
        </Button>
    ) : (
        React.cloneElement(children, { color })
    )
}
