import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { ChainId, WETH } from '@luckyfinance/sdk'
import { Contract, ethers } from 'ethers'
import { ZERO, e10, maximum, minimum, toElastic } from 'goldvein/functions'
import { getProviderOrSigner, getSigner } from 'utils'

import GOLDVEINPAIR_ABI from '../../constants/abis/goldveinpair.json'
import { GoldVeinPermit } from 'goldvein/hooks/useGoldVeinApproveCallback'
import { defaultAbiCoder } from '@ethersproject/abi'
import { toShare } from 'goldvein/functions/alpine'

export async function signMasterContractApproval(
    alPineContract: ethers.Contract | null,
    masterContract: string | undefined,
    user: string,
    library: ethers.providers.Web3Provider,
    approved: boolean,
    chainId: ChainId | undefined
): Promise<string> {
    const warning = approved ? 'Give FULL access to funds in (and approved to) Alpine?' : 'Revoke access to Alpine?'
    const nonce = await alPineContract?.nonces(user)
    const message = {
        warning,
        user,
        masterContract,
        approved,
        nonce
    }

    const typedData = {
        types: {
            SetMasterContractApproval: [
                { name: 'warning', type: 'string' },
                { name: 'user', type: 'address' },
                { name: 'masterContract', type: 'address' },
                { name: 'approved', type: 'bool' },
                { name: 'nonce', type: 'uint256' }
            ]
        },
        primaryType: 'SetMasterContractApproval',
        domain: {
            name: 'Alpine V1',
            chainId: chainId,
            verifyingContract: alPineContract?.address
        },
        message: message
    }
    const signer = getSigner(library, user)
    return signer._signTypedData(typedData.domain, typedData.types, typedData.message)
}

enum Action {
    ADD_ASSET = 1,
    REPAY = 2,
    REMOVE_ASSET = 3,
    REMOVE_COLLATERAL = 4,
    BORROW = 5,
    GET_REPAY_SHARE = 6,
    GET_REPAY_PART = 7,
    ACCRUE = 8,

    // Functions that don't need accrue to be called
    ADD_COLLATERAL = 10,
    UPDATE_EXCHANGE_RATE = 11,

    // Function on Alpine
    ALP_DEPOSIT = 20,
    ALP_WITHDRAW = 21,
    ALP_TRANSFER = 22,
    ALP_TRANSFER_MULTIPLE = 23,
    ALP_SETAPPROVAL = 24,

    // Any external call (except to Alpine)
    CALL = 30
}

export class GoldVeinCooker {
    private pair: any
    private account: string
    private library: ethers.providers.Web3Provider | undefined
    private chainId: ChainId

    private actions: Action[]
    private values: BigNumber[]
    private datas: string[]

    constructor(
        pair: any,
        account: string | null | undefined,
        library: ethers.providers.Web3Provider | undefined,
        chainId: ChainId | undefined
    ) {
        this.pair = pair
        this.account = account || ethers.constants.AddressZero
        this.library = library
        this.chainId = chainId || 1

        this.actions = []
        this.values = []
        this.datas = []
    }

    add(action: Action, data: string, value: BigNumberish = 0): void {
        this.actions.push(action)
        this.datas.push(data)
        this.values.push(BigNumber.from(value))
    }

    approve(permit: GoldVeinPermit): void {
        if (permit) {
            this.add(
                Action.ALP_SETAPPROVAL,
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'address', 'bool', 'uint8', 'bytes32', 'bytes32'],
                    [permit.account, permit.masterContract, true, permit.v, permit.r, permit.s]
                )
            )
        }
    }

    updateExchangeRate(mustUpdate = false, minRate = ZERO, maxRate = ZERO): GoldVeinCooker {
        this.add(
            Action.UPDATE_EXCHANGE_RATE,
            ethers.utils.defaultAbiCoder.encode(['bool', 'uint256', 'uint256'], [mustUpdate, minRate, maxRate])
        )
        return this
    }

    alpDepositCollateral(amount: BigNumber): GoldVeinCooker {
        const useNative = this.pair.collateral.address === WETH[this.chainId].address

        this.add(
            Action.ALP_DEPOSIT,
            defaultAbiCoder.encode(
                ['address', 'address', 'int256', 'int256'],
                [useNative ? ethers.constants.AddressZero : this.pair.collateral.address, this.account, amount, 0]
            ),
            useNative ? amount : ZERO
        )

        return this
    }

    alpWithdrawCollateral(amount: BigNumber, share: BigNumber): GoldVeinCooker {
        const useNative = this.pair.collateral.address === WETH[this.chainId].address

        this.add(
            Action.ALP_WITHDRAW,
            defaultAbiCoder.encode(
                ['address', 'address', 'int256', 'int256'],
                [useNative ? ethers.constants.AddressZero : this.pair.collateral.address, this.account, amount, share]
            ),
            useNative ? amount : ZERO
        )

        return this
    }

    alpTransferCollateral(share: BigNumber, toAddress: string): GoldVeinCooker {
        this.add(
            Action.ALP_TRANSFER,
            defaultAbiCoder.encode(['address', 'address', 'int256'], [this.pair.collateral.address, toAddress, share])
        )

        return this
    }

    repayShare(part: BigNumber): GoldVeinCooker {
        this.add(Action.GET_REPAY_SHARE, defaultAbiCoder.encode(['int256'], [part]))

        return this
    }

    addCollateral(amount: BigNumber, fromAlp: boolean): GoldVeinCooker {
        let share: BigNumber
        if (fromAlp) {
            share = amount.lt(0) ? amount : toShare(this.pair.collateral, amount)
        } else {
            const useNative = this.pair.collateral.address === WETH[this.chainId].address

            this.add(
                Action.ALP_DEPOSIT,
                defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [useNative ? ethers.constants.AddressZero : this.pair.collateral.address, this.account, amount, 0]
                ),
                useNative ? amount : ZERO
            )
            share = BigNumber.from(-2)
        }

        this.add(
            Action.ADD_COLLATERAL,
            defaultAbiCoder.encode(['int256', 'address', 'bool'], [share, this.account, false])
        )
        return this
    }

    addAsset(amount: BigNumber, fromAlp: boolean): GoldVeinCooker {
        let share: BigNumber
        if (fromAlp) {
            share = toShare(this.pair.asset, amount)
        } else {
            const useNative = this.pair.asset.address === WETH[this.chainId].address

            this.add(
                Action.ALP_DEPOSIT,
                defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [useNative ? ethers.constants.AddressZero : this.pair.asset.address, this.account, amount, 0]
                ),
                useNative ? amount : ZERO
            )
            share = BigNumber.from(-2)
        }

        this.add(Action.ADD_ASSET, defaultAbiCoder.encode(['int256', 'address', 'bool'], [share, this.account, false]))
        return this
    }

    removeAsset(fraction: BigNumber, toAlp: boolean): GoldVeinCooker {
        this.add(
            Action.REMOVE_ASSET,
            ethers.utils.defaultAbiCoder.encode(['int256', 'address'], [fraction, this.account])
        )
        if (!toAlp) {
            const useNative = this.pair.asset.address === WETH[this.chainId].address

            this.add(
                Action.ALP_WITHDRAW,
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [useNative ? ethers.constants.AddressZero : this.pair.asset.address, this.account, 0, -1]
                )
            )
        }
        return this
    }

    removeCollateral(share: BigNumber, toAlp: boolean): GoldVeinCooker {
        this.add(
            Action.REMOVE_COLLATERAL,
            ethers.utils.defaultAbiCoder.encode(['int256', 'address'], [share, this.account])
        )
        if (!toAlp) {
            const useNative = this.pair.collateral.address === WETH[this.chainId].address

            this.add(
                Action.ALP_WITHDRAW,
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [useNative ? ethers.constants.AddressZero : this.pair.collateral.address, this.account, 0, share]
                )
            )
        }
        return this
    }

    removeCollateralFraction(fraction: BigNumber, toAlp: boolean): GoldVeinCooker {
        this.add(
            Action.REMOVE_COLLATERAL,
            ethers.utils.defaultAbiCoder.encode(['int256', 'address'], [fraction, this.account])
        )
        if (!toAlp) {
            const useNative = this.pair.collateral.address === WETH[this.chainId].address

            this.add(
                Action.ALP_WITHDRAW,
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [useNative ? ethers.constants.AddressZero : this.pair.collateral.address, this.account, 0, -1]
                )
            )
        }
        return this
    }

    borrow(amount: BigNumber, toAlp: boolean, toAddress = ''): GoldVeinCooker {
        console.log('Borrow', { amount, toAlp, toAddress })
        this.add(
            Action.BORROW,
            defaultAbiCoder.encode(['int256', 'address'], [amount, toAddress && toAlp ? toAddress : this.account])
        )
        if (!toAlp) {
            const useNative = this.pair.asset.address === WETH[this.chainId].address

            this.add(
                Action.ALP_WITHDRAW,
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [
                        useNative ? ethers.constants.AddressZero : this.pair.asset.address,
                        toAddress || this.account,
                        amount,
                        0
                    ]
                )
            )
        }
        return this
    }

    repay(amount: BigNumber, fromAlp: boolean): GoldVeinCooker {
        if (!fromAlp) {
            const useNative = this.pair.asset.address === WETH[this.chainId].address

            this.add(
                Action.ALP_DEPOSIT,
                defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [useNative ? ethers.constants.AddressZero : this.pair.asset.address, this.account, amount, 0]
                ),
                useNative ? amount : ZERO
            )
        }
        this.add(Action.GET_REPAY_PART, defaultAbiCoder.encode(['int256'], [fromAlp ? amount : -1]))
        this.add(Action.REPAY, defaultAbiCoder.encode(['int256', 'address', 'bool'], [-1, this.account, false]))
        return this
    }

    repayPart(part: BigNumber, fromAlp: boolean): GoldVeinCooker {
        if (!fromAlp) {
            const useNative = this.pair.asset.address === WETH[this.chainId].address

            this.add(Action.GET_REPAY_SHARE, defaultAbiCoder.encode(['int256'], [part]))
            this.add(
                Action.ALP_DEPOSIT,
                defaultAbiCoder.encode(
                    ['address', 'address', 'int256', 'int256'],
                    [useNative ? ethers.constants.AddressZero : this.pair.asset.address, this.account, 0, -1]
                ),
                // TODO: Put some warning in the UI or not allow repaying ETH directly from wallet, because this can't be pre-calculated
                useNative
                    ? toShare(this.pair.asset, toElastic(this.pair.totalBorrow, part, true))
                          .mul(1001)
                          .div(1000)
                    : ZERO
            )
        }
        this.add(Action.REPAY, defaultAbiCoder.encode(['int256', 'address', 'bool'], [part, this.account, false]))
        return this
    }

    action(
        address: string,
        value: BigNumberish,
        data: string,
        useValue1: boolean,
        useValue2: boolean,
        returnValues: number
    ): void {
        this.add(
            Action.CALL,
            defaultAbiCoder.encode(
                ['address', 'bytes', 'bool', 'bool', 'uint8'],
                [address, data, useValue1, useValue2, returnValues]
            ),
            value
        )
    }

    async cook() {
        if (!this.library) {
            return {
                success: false
            }
        }

        console.log('pair address', this.pair.address)

        const goldveinPairCloneContract = new Contract(
            this.pair.address,
            GOLDVEINPAIR_ABI,
            getProviderOrSigner(this.library, this.account) as any
        )

        try {
            console.log(
                'cook data',
                { actions: this.actions, values: this.values, data: this.datas }
                // this.values.reduce((a, b) => a.add(b), ZERO)
            )

            return {
                success: true,
                tx: await goldveinPairCloneContract.cook(this.actions, this.values, this.datas, {
                    value: this.values.reduce((a, b) => a.add(b), ZERO)
                })
            }
        } catch (error) {
            console.error('GoldVeinCooker Error: ', error)
            return {
                success: false,
                error: error
            }
        }
    }
}
