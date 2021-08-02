import React, { useContext, useState } from 'react'
import { Button } from 'components'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { WETH } from '@luckyfinance/sdk'
import { e10, ZERO } from 'goldvein/functions/math'
import { Direction, TransactionReview } from 'goldvein/entities/TransactionReview'
import TransactionReviewView from 'goldvein/components/TransactionReview'
import { GoldVeinCooker } from 'goldvein/entities/GoldVeinCooker'
import { Warnings } from 'goldvein/entities'
import { formattedNum } from 'utils'
import { GoldVeinContext } from 'goldvein/context'
import SmartNumberInput from 'goldvein/components/SmartNumberInput'
import WarningsView from 'goldvein/components/Warnings'
import { GoldVeinApproveButton, TokenApproveButton } from 'goldvein/components/Button'
import { useCurrency } from 'hooks/Tokens'

export default function LendDepositAction({ pair }: any): JSX.Element {
    const { chainId } = useActiveWeb3React()
    const assetToken = useCurrency(pair.asset.address) || undefined

    // State
    const [useAlp, setUseAlp] = useState<boolean>(pair.asset.alpBalance.gt(0))
    const [value, setValue] = useState('')

    const info = useContext(GoldVeinContext).state.info

    // Calculated
    const assetNative = WETH[chainId || 1].address == pair.asset.address
    const balance = useAlp ? pair.asset.alpBalance : assetNative ? info?.ethBalance : pair.asset.balance

    const max = useAlp ? pair.asset.alpBalance : assetNative ? info?.ethBalance : pair.asset.balance

    const warnings = new Warnings().add(
        balance?.lt(value.toBigNumber(pair.asset.decimals)),
        `Please make sure your ${
            useAlp ? 'Alpine' : 'wallet'
        } balance is sufficient to deposit and then try again.`,
        true
    )

    const transactionReview = new TransactionReview()

    if (value && !warnings.broken) {
        const amount = value.toBigNumber(pair.asset.decimals)
        const newUserAssetAmount = pair.currentUserAssetAmount.value.add(amount)
        transactionReview.addTokenAmount('Balance', pair.currentUserAssetAmount.value, newUserAssetAmount, pair.asset)
        transactionReview.addUSD('Balance USD', pair.currentUserAssetAmount.value, newUserAssetAmount, pair.asset)
        const newUtilization = e10(18).muldiv(pair.currentBorrowAmount.value, pair.currentAllAssets.value.add(amount))
        transactionReview.addPercentage('Borrowed', pair.utilization.value, newUtilization)
        if (pair.currentExchangeRate.isZero()) {
            transactionReview.add(
                'Exchange Rate',
                formattedNum(pair.currentExchangeRate.toFixed(18 + pair.collateral.decimals - pair.asset.decimals)),
                formattedNum(pair.oracleExchangeRate.toFixed(18 + pair.collateral.decimals - pair.asset.decimals)),
                Direction.UP
            )
        }
        transactionReview.addPercentage('Supply APR', pair.supplyAPR.value, pair.currentSupplyAPR.value)
    }

    // Handlers
    async function onExecute(cooker: GoldVeinCooker): Promise<string> {
        if (pair.currentExchangeRate.isZero()) {
            cooker.updateExchangeRate(false, ZERO, ZERO)
        }
        cooker.addAsset(value.toBigNumber(pair.asset.decimals), useAlp)
        return `Deposit ${pair.asset.symbol}`
    }

    return (
        <>
            <div className="text-3xl text-high-emphesis mt-6">Deposit {pair.asset.symbol}</div>

            <SmartNumberInput
                color="blue"
                token={pair.asset}
                value={value}
                setValue={setValue}
                useAlpTitleDirection="down"
                useAlpTitle="from"
                useAlp={useAlp}
                setUseAlp={setUseAlp}
                maxTitle="Balance"
                max={max}
                showMax={true}
            />

            <WarningsView warnings={warnings}></WarningsView>
            <TransactionReviewView transactionReview={transactionReview}></TransactionReviewView>

            <GoldVeinApproveButton
                color="blue"
                content={(onCook: any) => (
                    <TokenApproveButton value={value} token={assetToken} needed={!useAlp}>
                        <Button
                            onClick={() => onCook(pair, onExecute)}
                            disabled={value.toBigNumber(pair.asset.decimals).lte(0) || warnings.broken}
                        >
                            Deposit
                        </Button>
                    </TokenApproveButton>
                )}
            />
        </>
    )
}
