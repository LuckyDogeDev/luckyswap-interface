import React, { useState } from 'react'
import { Button } from 'components'
import { Input as NumericalInput } from 'components/NumericalInput'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { e10, minimum } from 'goldvein/functions/math'
import { easyAmount } from 'goldvein/functions/goldvein'
import { TransactionReview, Warnings } from 'goldvein/entities'
import TransactionReviewView from 'goldvein/components/TransactionReview'
import { GOLDVEIN_ADDRESS } from '../../../constants'
import { GoldVeinCooker } from 'goldvein/entities/GoldVeinCooker'
import { useGoldVeinApprovalPending } from 'state/application/hooks'
import { useGoldVeinApproveCallback, AlpApprovalState } from 'goldvein/hooks'
import { formattedNum } from 'utils'
import SmartNumberInput from 'goldvein/components/SmartNumberInput'
import WarningsView from 'goldvein/components/Warnings'
import { GoldVeinApproveButton } from 'goldvein/components/Button'

export default function LendWithdrawAction({ pair }: any): JSX.Element {
    const { account } = useActiveWeb3React()
    const pendingApprovalMessage = useGoldVeinApprovalPending()

    // State
    const [useAlp, setUseAlp] = useState<boolean>(pair.asset.bentoBalance.gt(0))
    const [value, setValue] = useState('')
    const [pinMax, setPinMax] = useState(false)

    const [goldveinApprovalState, approveGoldVeinFallback, goldveinPermit, onApprove, onCook] = useGoldVeinApproveCallback()

    // Calculated
    const max = minimum(pair.maxAssetAvailable, pair.currentUserAssetAmount.value)
    const displayValue = pinMax ? max.toFixed(pair.asset.decimals) : value

    const fraction = pinMax
        ? minimum(pair.userAssetFraction, pair.maxAssetAvailableFraction)
        : value.toBigNumber(pair.asset.decimals).muldiv(pair.currentTotalAsset.base, pair.currentAllAssets.value)

    const warnings = new Warnings()
        .add(
            pair.currentUserAssetAmount.value.lt(value.toBigNumber(pair.asset.decimals)),
            `Please make sure your ${
                useAlp ? 'Alpine' : 'wallet'
            } balance is sufficient to withdraw and then try again.`,
            true
        )
        .add(
            pair.maxAssetAvailableFraction.lt(fraction),
            "The isn't enough liquidity available at the moment to withdraw this amount. Please try withdrawing less or later.",
            true
        )

    const transactionReview = new TransactionReview()
    if (displayValue && !warnings.broken) {
        const amount = displayValue.toBigNumber(pair.asset.decimals)
        const newUserAssetAmount = pair.currentUserAssetAmount.value.sub(amount)
        transactionReview.addTokenAmount('Balance', pair.currentUserAssetAmount.value, newUserAssetAmount, pair.asset)
        transactionReview.addUSD('Balance USD', pair.currentUserAssetAmount.value, newUserAssetAmount, pair.asset)

        const newUtilization = e10(18).muldiv(pair.currentBorrowAmount.value, pair.currentAllAssets.value.sub(amount))
        transactionReview.addPercentage('Borrowed', pair.utilization.value, newUtilization)
    }

    // Handlers
    async function onExecute(cooker: GoldVeinCooker) {
        const fraction = pinMax
            ? minimum(pair.userAssetFraction, pair.maxAssetAvailableFraction)
            : value.toBigNumber(pair.asset.decimals).muldiv(pair.currentTotalAsset.base, pair.currentAllAssets.value)

        cooker.removeAsset(fraction, useAlp)
        return `Withdraw ${pair.asset.symbol}`
    }

    return (
        <>
            <div className="text-3xl text-high-emphesis mt-6">Withdraw {pair.asset.symbol}</div>

            <SmartNumberInput
                color="blue"
                token={pair.asset}
                value={displayValue}
                setValue={setValue}
                useAlpTitleDirection="up"
                useAlpTitle="to"
                useAlp={useAlp}
                setUseAlp={setUseAlp}
                max={max}
                pinMax={pinMax}
                setPinMax={setPinMax}
                showMax={true}
            />

            <WarningsView warnings={warnings} />
            <TransactionReviewView transactionReview={transactionReview}></TransactionReviewView>

            <GoldVeinApproveButton
                color="blue"
                content={(onCook: any) => (
                    <Button
                        onClick={() => onCook(pair, onExecute)}
                        disabled={displayValue.toBigNumber(pair.asset.decimals).lte(0) || warnings.broken}
                    >
                        Withdraw
                    </Button>
                )}
            />
        </>
    )
}
