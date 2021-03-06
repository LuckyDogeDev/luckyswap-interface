import React, { useContext, useState } from 'react'
import { TransactionReviewView, WarningsView } from 'goldvein/components'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { BigNumber } from '@ethersproject/bignumber'
import { minimum, e10, maximum, ZERO } from 'goldvein/functions/math'
import { WETH } from '@luckyfinance/sdk'
import { GoldVeinContext } from 'goldvein/context'
import { GoldVeinCooker, TransactionReview, Warning, Warnings } from 'goldvein/entities'
import { toAmount, toShare } from 'goldvein/functions/alpine'
import { useCurrency } from 'hooks/Tokens'
import { tryParseAmount } from 'state/swap/hooks'
import SmartNumberInput from 'goldvein/components/SmartNumberInput'
import { Button } from 'components'
import { ExchangeRateCheckBox, SwapCheckbox } from 'goldvein/components/Checkbox'
import TradeReview from 'goldvein/components/TradeReview'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { useTradeExactIn, useTradeExactOut } from 'hooks/Trades'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningSeverity } from 'utils/prices'
import { Field } from 'state/swap/actions'
import { GoldVeinApproveButton, TokenApproveButton } from 'goldvein/components/Button'
import { LUCKYSWAP_MULTISWAPPER_ADDRESS, LUCKYSWAP_MULTI_EXACT_SWAPPER_ADDRESS } from 'goldvein/constants'
import { ethers } from 'ethers'
import { defaultAbiCoder } from '@ethersproject/abi'

interface RepayProps {
    pair: any
}

export default function Repay({ pair }: RepayProps) {
    const { account, chainId } = useActiveWeb3React()
    const info = useContext(GoldVeinContext).state.info

    // State
    const [useAlpRepay, setUseAlpRepay] = useState<boolean>(pair.asset.alpBalance.gt(0))
    const [useAlpRemove, setUseAlpRemoveCollateral] = useState<boolean>(true)

    const [repayValue, setRepayAssetValue] = useState('')
    const [removeValue, setRemoveCollateralValue] = useState('')
    const [pinRemoveMax, setPinRemoveMax] = useState(false)
    const [pinRepayMax, setPinRepayMax] = useState(false)
    const [updateOracle, setUpdateOracle] = useState(false)
    const [swap, setSwap] = useState(false)

    const assetToken = useCurrency(pair.asset.address) || undefined
    const collateralToken = useCurrency(pair.collateral.address) || undefined

    // Calculated
    const assetNative = WETH[chainId || 1].address === pair.asset.address

    const balance = useAlpRepay
        ? toAmount(pair.asset, pair.asset.alpBalance)
        : assetNative
        ? info?.ethBalance
        : pair.asset.balance

    const displayUpdateOracle = pair.currentExchangeRate.gt(0) ? updateOracle : true

    const displayRepayValue = pinRepayMax
        ? minimum(pair.currentUserBorrowAmount.value, balance).toFixed(pair.asset.decimals)
        : repayValue

    const nextUserBorrowAmount = pair.currentUserBorrowAmount.value.sub(
        displayRepayValue.toBigNumber(pair.asset.decimals)
    )

    const nextMinCollateralOracle = nextUserBorrowAmount.muldiv(pair.oracleExchangeRate, e10(16).mul('75'))
    const nextMinCollateralSpot = nextUserBorrowAmount.muldiv(pair.spotExchangeRate, e10(16).mul('75'))
    const nextMinCollateralStored = nextUserBorrowAmount.muldiv(
        displayUpdateOracle ? pair.oracleExchangeRate : pair.currentExchangeRate,
        e10(16).mul('75')
    )
    const nextMinCollateralMinimum = maximum(nextMinCollateralOracle, nextMinCollateralSpot, nextMinCollateralStored)
    const nextMaxRemoveCollateral = maximum(
        pair.userCollateralAmount.value.sub(nextMinCollateralMinimum.mul(100).div(95)),
        ZERO
    )
    const maxRemoveCollateral = nextMaxRemoveCollateral.toFixed(pair.collateral.decimals)

    const displayRemoveValue = pinRemoveMax ? maxRemoveCollateral : removeValue

    // Swap
    const [allowedSlippage] = useUserSlippageTolerance() // 10 = 0.1%
    const parsedAmount = tryParseAmount(pair.currentUserBorrowAmount.string, assetToken)
    const foundTrade = useTradeExactOut(collateralToken, parsedAmount) || undefined

    const maxAmountIn = swap
        ? computeSlippageAdjustedAmounts(foundTrade, allowedSlippage)
              [Field.INPUT]?.toFixed(pair.collateral.decimals)
              .toBigNumber(pair.collateral.decimals) || ZERO
        : ZERO

    //const nextUserCollateralValue = pair.userCollateralAmount.value.add(collateralValue.toBigNumber(pair.collateral.decimals)).add(extraCollateral)

    const nextUserCollateralAmount = pair.userCollateralAmount.value.sub(
        displayRemoveValue.toBigNumber(pair.collateral.decimals)
    )

    const nextMaxBorrowableOracle = nextUserCollateralAmount.muldiv(e10(16).mul('75'), pair.oracleExchangeRate)
    const nextMaxBorrowableSpot = nextUserCollateralAmount.muldiv(e10(16).mul('75'), pair.spotExchangeRate)
    const nextMaxBorrowableStored = nextUserCollateralAmount.muldiv(
        e10(16).mul('75'),
        displayUpdateOracle ? pair.oracleExchangeRate : pair.currentExchangeRate
    )
    const nextMaxBorrowMinimum = minimum(nextMaxBorrowableOracle, nextMaxBorrowableSpot, nextMaxBorrowableStored)
    const nextMaxBorrowSafe = nextMaxBorrowMinimum.muldiv('95', '100').sub(pair.currentUserBorrowAmount.value)
    const nextMaxBorrowPossible = maximum(minimum(nextMaxBorrowSafe, pair.maxAssetAvailable), ZERO)

    const nextHealth = pair.currentUserBorrowAmount.value
        .sub(displayRepayValue.toBigNumber(pair.asset.decimals))
        .muldiv(BigNumber.from('1000000000000000000'), nextMaxBorrowMinimum)

    const transactionReview = new TransactionReview()

    if (displayRepayValue || displayRemoveValue) {
        transactionReview.addTokenAmount(
            'Borrow Limit',
            pair.maxBorrowable.safe.value,
            nextMaxBorrowSafe.add(displayRepayValue.toBigNumber(pair.asset.decimals)),
            pair.asset
        )
        transactionReview.addPercentage('Health', pair.health.value, nextHealth)
    }

    const warnings = new Warnings()
        .addError(
            assetNative && !useAlpRepay && pinRepayMax,
            `You cannot MAX repay ${pair.asset.symbol} directly from your wallet. Please deposit your ${pair.asset.symbol} into the Alpine first, then repay. Because your debt is slowly accrueing interest we can't predict how much it will be once your transaction gets mined.`
        )
        .addError(
            displayRemoveValue.toBigNumber(pair.collateral.decimals).gt(pair.userCollateralAmount.value),
            'You have insufficient collateral. Please enter a smaller amount or repay more.'
        )
        .addError(
            displayRepayValue.toBigNumber(pair.asset.decimals).gt(pair.currentUserBorrowAmount.value),
            "You can't repay more than you owe. To fully repay, please click the 'max' button.",
            new Warning(
                balance?.lt(displayRepayValue.toBigNumber(pair.asset.decimals)),
                `Please make sure your ${
                    useAlpRepay ? 'Alpine' : 'wallet'
                } balance is sufficient to repay and then try again.`,
                true
            )
        )
        .addError(
            displayRemoveValue
                .toBigNumber(pair.collateral.decimals)
                .gt(maximum(pair.userCollateralAmount.value.sub(nextMinCollateralMinimum), ZERO)),
            'Removing this much collateral would put you into insolvency.',
            new Warning(
                displayRemoveValue.toBigNumber(pair.collateral.decimals).gt(nextMaxRemoveCollateral),
                'Removing this much collateral would put you very close to insolvency.'
            )
        )

    const removeValueSet =
        !displayRemoveValue.toBigNumber(pair.collateral.decimals).isZero() ||
        (pinRemoveMax && pair.userCollateralShare.gt(ZERO))

    const repayValueSet = !displayRepayValue.toBigNumber(pair.asset.decimals).isZero()

    const trade = swap ? foundTrade : undefined
    // const trade = swap && removeValueSet ? foundTrade : undefined

    const [isExpertMode] = useExpertModeManager()

    const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade)

    const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

    let actionName = 'Nothing to do'

    if (removeValueSet) {
        if (repayValueSet) {
            actionName = 'Repay and remove collateral'
        } else {
            actionName = 'Remove collateral'
        }
    } else if (repayValueSet) {
        actionName = 'Repay'
    } else if (swap) {
        actionName = 'Automatic repay'
    }

    // const actionDisabled = false

    const actionDisabled =
        (!swap &&
            !trade &&
            displayRepayValue.toBigNumber(pair.asset.decimals).lte(0) &&
            displayRemoveValue.toBigNumber(pair.collateral.decimals).lte(0) &&
            (!pinRemoveMax || pair.userCollateralShare.isZero())) ||
        warnings.some(warning => warning.breaking)

    function resetRepayState() {
        setPinRepayMax(false)
        setPinRemoveMax(false)
        setRemoveCollateralValue('')
        setRepayAssetValue('')
    }

    console.log('useAlpRemove', useAlpRemove)

    // Handlers
    async function onExecute(cooker: GoldVeinCooker) {
        let summary = ''

        if (swap && trade) {
            const share = toShare(pair.collateral, pair.userCollateralAmount.value)

            console.log({ share, userCollateralShare: pair.userCollateralShare })

            cooker.removeCollateral(pair.userCollateralShare, true)
            cooker.alpTransferCollateral(
                pair.userCollateralShare,
                LUCKYSWAP_MULTI_EXACT_SWAPPER_ADDRESS[chainId || 1]
            )
            cooker.repayShare(pair.userBorrowPart)

            const path = trade.route.path.map(token => token.address) || []

            console.log('debug', [
                pair.collateral.address,
                pair.asset.address,
                maxAmountIn,
                path.length > 2 ? path[1] : ethers.constants.AddressZero,
                path.length > 3 ? path[2] : ethers.constants.AddressZero,
                account,
                pair.userCollateralShare
            ])

            const data = defaultAbiCoder.encode(
                ['address', 'address', 'uint256', 'address', 'address', 'address', 'uint256'],
                [
                    pair.collateral.address,
                    pair.asset.address,
                    maxAmountIn,
                    path.length > 2 ? path[1] : ethers.constants.AddressZero,
                    path.length > 3 ? path[2] : ethers.constants.AddressZero,
                    account,
                    pair.userCollateralShare
                ]
            )

            console.log('encoded', data)

            cooker.action(
                LUCKYSWAP_MULTI_EXACT_SWAPPER_ADDRESS[chainId || 1],
                ZERO,
                ethers.utils.hexConcat([ethers.utils.hexlify('0x3087d742'), data]),
                true,
                false,
                1
            )

            cooker.repayPart(pair.userBorrowPart, true)

            if (!useAlpRemove) {
                cooker.alpWithdrawCollateral(ZERO, BigNumber.from(-1))
            }

            summary = 'Repay All'
        } else {
            if (pinRepayMax && pair.userBorrowPart.gt(0) && balance.gte(pair.currentUserBorrowAmount.value)) {
                cooker.repayPart(pair.userBorrowPart, useAlpRepay)
                summary = 'Repay Max'
            } else if (displayRepayValue.toBigNumber(pair.asset.decimals).gt(0)) {
                cooker.repay(displayRepayValue.toBigNumber(pair.asset.decimals), useAlpRepay)
                summary = 'Repay'
            }
            if (
                displayRemoveValue.toBigNumber(pair.collateral.decimals).gt(0) ||
                (pinRemoveMax && pair.userCollateralShare.gt(0))
            ) {
                const share =
                    pinRemoveMax &&
                    (nextUserBorrowAmount.isZero() ||
                        (pinRepayMax && pair.userBorrowPart.gt(0) && balance.gte(pair.currentUserBorrowAmount.value)))
                        ? pair.userCollateralShare
                        : toShare(pair.collateral, displayRemoveValue.toBigNumber(pair.collateral.decimals))

                cooker.removeCollateral(share, useAlpRemove)
                summary += (summary ? ' and ' : '') + 'Remove Collateral'
            }
        }

        resetRepayState()

        return summary
    }

    return (
        <>
            <div className="text-3xl text-high-emphesis mt-6 mb-4">Repay {pair.asset.symbol}</div>

            <SmartNumberInput
                color="pink"
                token={pair.asset}
                value={displayRepayValue}
                setValue={setRepayAssetValue}
                useAlpTitleDirection="down"
                useAlpTitle={`Repay ${pair.asset.symbol} from`}
                useAlp={useAlpRepay}
                setUseAlp={setUseAlpRepay}
                maxTitle="Balance"
                max={balance}
                pinMax={pinRepayMax}
                setPinMax={setPinRepayMax}
                showMax={!swap && !pair.currentUserBorrowAmount.value.isZero()}
                disabled={swap || pair.currentUserBorrowAmount.value.isZero()}
                switchDisabled={swap || pair.currentUserBorrowAmount.value.isZero()}
            />

            <SmartNumberInput
                color="pink"
                token={pair.collateral}
                value={displayRemoveValue}
                setValue={setRemoveCollateralValue}
                useAlpTitleDirection="up"
                useAlpTitle={`Remove ${pair.collateral.symbol} to`}
                useAlp={useAlpRemove}
                setUseAlp={setUseAlpRemoveCollateral}
                max={nextMaxRemoveCollateral}
                pinMax={pinRemoveMax}
                setPinMax={setPinRemoveMax}
                showMax={
                    pair.currentUserBorrowAmount.value.eq(displayRepayValue.toBigNumber(pair.asset.decimals)) ||
                    pair.currentUserBorrowAmount.value.isZero()
                }
                disabled={swap || pair.userCollateralAmount.value.isZero()}
                switchDisabled={pair.userCollateralAmount.value.isZero()}
            />

            {!pair.currentUserBorrowAmount.value.isZero() && (
                <SwapCheckbox
                    color="pink"
                    swap={swap}
                    setSwap={(value: boolean) => {
                        resetRepayState()
                        setSwap(value)
                    }}
                    title={`Swap ${pair.collateral.symbol} collateral for ${pair.asset.symbol} and repay`}
                    help="Swapping your removed collateral tokens and repay allows for reducing your borrow by using your collateral and/or to unwind leveraged positions."
                />
            )}

            {removeValueSet && (
                <ExchangeRateCheckBox
                    color="pink"
                    pair={pair}
                    updateOracle={updateOracle}
                    setUpdateOracle={setUpdateOracle}
                    desiredDirection="up"
                />
            )}

            <WarningsView warnings={warnings} />

            {swap && trade && <TradeReview trade={trade} allowedSlippage={allowedSlippage} />}

            {swap && (priceImpactSeverity < 3 || isExpertMode) && (
                <TransactionReviewView transactionReview={transactionReview} />
            )}

            <GoldVeinApproveButton
                color="pink"
                content={(onCook: any) => (
                    <TokenApproveButton value={displayRepayValue} token={assetToken} needed={!useAlpRepay}>
                        <Button onClick={() => onCook(pair, onExecute)} disabled={actionDisabled}>
                            {actionName}
                        </Button>
                    </TokenApproveButton>
                )}
            />
        </>
    )
}
