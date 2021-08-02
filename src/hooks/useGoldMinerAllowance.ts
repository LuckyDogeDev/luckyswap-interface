import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import ERC20_ABI from '../constants/abis/erc20.json'
import { useActiveWeb3React } from '../hooks/useActiveWeb3React'
import { useContract, useGoldMinerContract } from '../hooks/useContract'
import { isAddress } from '../utils'

const useAllowance = (lpAddress: string) => {
    const [allowance, setAllowance] = useState(BigNumber.from(0))
    const { account } = useActiveWeb3React()
    const masterMinerContract = useGoldMinerContract()
    const lpAddressChecksum = isAddress(lpAddress)
    const lpContract = useContract(lpAddressChecksum ? lpAddressChecksum : undefined, ERC20_ABI, false)

    const getAllowance = async (
        contract: Contract | null,
        owner: string | null | undefined,
        spender: string | undefined
    ): Promise<string> => {
        try {
            return await contract?.allowance(owner, spender)
        } catch (e) {
            return '0'
        }
    }

    const fetchAllowance = useCallback(async () => {
        const allowance = await getAllowance(lpContract, account, masterMinerContract?.address)
        setAllowance(BigNumber.from(allowance))
    }, [account, lpContract, masterMinerContract?.address])

    useEffect(() => {
        if (account && masterMinerContract && lpContract) {
            fetchAllowance()
        }
        const refreshInterval = setInterval(fetchAllowance, 10000)
        return () => clearInterval(refreshInterval)
    }, [account, masterMinerContract, lpContract, fetchAllowance])

    return allowance
}

export default useAllowance
