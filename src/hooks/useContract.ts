import {
    ARGENT_WALLET_DETECTOR_ABI,
    ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS
} from '../constants/abis/argent-wallet-detector'
import {
    ALCHEMYBENCH_ADDRESS,
    ChainId,
    FACTORY_ADDRESS,
    SMELTER_ADDRESS,
    GOLDMINER_ADDRESS,
    ROUTER_ADDRESS,
    GOLN_ADDRESS,
    TIMELOCK_ADDRESS,
    WETH
} from '@luckyfinance/sdk'
import {
    ALPINE_ADDRESS,
    BORING_HELPER_ADDRESS,
    CHAINLINK_ORACLE_ADDRESS,
    GOLDVEIN_ADDRESS,
    LUCKYSWAP_MULTISWAPPER_ADDRESS,
    LUCKYSWAP_SWAPPER_ADDRESS
} from 'goldvein'
import { FAUCET_ABI, FAUCET_ADDRESS } from '../constants/abis/faucet'
import { MERKLE_DISTRIBUTOR_ADDRESS, GOLN } from '../constants'
import { MIGRATOR_ABI, MIGRATOR_ADDRESS } from '../constants/abis/migrator'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from '../constants/multicall'
import { V1_EXCHANGE_ABI, V1_FACTORY_ABI, V1_FACTORY_ADDRESSES } from '../constants/v1'

import ALCHEMYBENCH_ABI from '../constants/abis/bar.json'
import BASE_SWAPPER_ABI from '../constants/abis/swapper.json'
import ALPINE_ABI from '../constants/abis/alpine.json'
import BORING_HELPER_ABI from '../constants/abis/boring-helper.json'
import CHAINLINK_ORACLE_ABI from '../constants/abis/chainlink-oracle.json'
import { Contract } from '@ethersproject/contracts'
import DASHBOARD2_ABI from '../constants/abis/dashboard2.json'
import DASHBOARD_ABI from '../constants/abis/dashboard.json'
import ENS_ABI from '../constants/abis/ens-registrar.json'
import ENS_PUBLIC_RESOLVER_ABI from '../constants/abis/ens-public-resolver.json'
import ERC20_ABI from '../constants/abis/erc20.json'
import { ERC20_BYTES32_ABI } from '../constants/abis/erc20'
import FACTORY_ABI from '../constants/abis/factory.json'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import GOLDVEINPAIR_ABI from '../constants/abis/goldveinpair.json'
import SMELTER_ABI from '../constants/abis/smelter.json'
import GOLDMINERV2_ABI from '../constants/abis/masterchefv2.json'
import GOLDMINER_ABI from '../constants/abis/masterchef.json'
import { abi as MERKLE_DISTRIBUTOR_ABI } from '@uniswap/merkle-distributor/build/MerkleDistributor.json'
import MINIMINERV2_ABI from '../constants/abis/miniChefV2.json'
import PENDING_ABI from '../constants/abis/pending.json'
import ROUTER_ABI from '../constants/abis/router.json'
import SAAVE_ABI from '../constants/abis/saave.json'
import { abi as STAKING_REWARDS_ABI } from '@uniswap/liquidity-staker/build/StakingRewards.json'
import GOLNROLL_ABI from '@luckyfinance/core/abi/Ingot.json'
import LUCKYSWAP_MULTISWAPPER_ABI from '../constants/abis/sushiswapmultiswapper.json'
import GOLN_ABI from '../constants/abis/sushi.json'
import TIMELOCK_ABI from '../constants/abis/timelock.json'
import { abi as UNI_ABI } from '@uniswap/governance/build/Uni.json'
import { abi as UNI_FACTORY_ABI } from '@uniswap/v2-core/build/UniswapV2Factory.json'
import { FACTORY_ADDRESS as UNI_FACTORY_ADDRESS } from '@uniswap/sdk'
import WETH_ABI from '../constants/abis/weth.json'
import { getContract } from '../utils'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useMemo } from 'react'

// returns null on errors
export function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
    const { library, account } = useActiveWeb3React()

    return useMemo(() => {
        if (!address || !ABI || !library) return null
        try {
            return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
        } catch (error) {
            console.error('Failed to get contract', error)
            return null
        }
    }, [address, ABI, library, withSignerIfPossible, account])
}

export function useV1FactoryContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && V1_FACTORY_ADDRESSES[chainId], V1_FACTORY_ABI, false)
}

export function useV2MigratorContract(): Contract | null {
    return useContract(MIGRATOR_ADDRESS, MIGRATOR_ABI, true)
}

export function useV1ExchangeContract(address?: string, withSignerIfPossible?: boolean): Contract | null {
    return useContract(address, V1_EXCHANGE_ABI, withSignerIfPossible)
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
    return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETHContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId ? WETH[chainId].address : undefined, WETH_ABI, withSignerIfPossible)
}

export function useArgentWalletDetectorContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(
        chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
        ARGENT_WALLET_DETECTOR_ABI,
        false
    )
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    let address: string | undefined
    if (chainId) {
        switch (chainId) {
            case ChainId.MAINNET:
            case ChainId.GÖRLI:
            case ChainId.ROPSTEN:
            case ChainId.RINKEBY:
                address = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
                break
        }
    }
    return useContract(address, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
    return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
    return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
    return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useMerkleDistributorContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId ? MERKLE_DISTRIBUTOR_ADDRESS[chainId] : undefined, MERKLE_DISTRIBUTOR_ABI, true)
}

export function useUniContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId ? GOLN[chainId]?.address : undefined, UNI_ABI, true)
}

export function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean): Contract | null {
    return useContract(stakingAddress, STAKING_REWARDS_ABI, withSignerIfPossible)
}

export function useBoringHelperContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && BORING_HELPER_ADDRESS[chainId], BORING_HELPER_ABI, false)
}

export function usePendingContract(): Contract | null {
    return useContract('0x9aeadfE6cd03A2b5730474bF6dd79802d5bCD029', PENDING_ABI, false)
}

export function useMulticallContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && MULTICALL_NETWORKS[chainId], MULTICALL_ABI, false)
}

export function useGoldNuggetContract(withSignerIfPossible = true): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && GOLN_ADDRESS[chainId], GOLN_ABI, withSignerIfPossible)
}

export function useMasterChefContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && GOLDMINER_ADDRESS[chainId], GOLDMINER_ABI, withSignerIfPossible)
}

export function useMasterChefV2Contract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    let address: string | undefined
    if (chainId) {
        switch (chainId) {
            case ChainId.MAINNET:
                address = '0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d'
                break
        }
    }
    return useContract(address, GOLDMINERV2_ABI, withSignerIfPossible)
}

export function useMiniChefV2Contract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    let address: string | undefined
    if (chainId) {
        switch (chainId) {
            case ChainId.MATIC:
                address = '0x0769fd68dFb93167989C6f7254cd0D766Fb2841F'
                break
        }
    }
    return useContract(address, MINIMINERV2_ABI, withSignerIfPossible)
}

export function useFactoryContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && FACTORY_ADDRESS[chainId], FACTORY_ABI, false)
}

export function useRouterContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && ROUTER_ADDRESS[chainId], ROUTER_ABI, false)
}

export function useAlchemyBenchContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && ALCHEMYBENCH_ADDRESS[chainId], ALCHEMYBENCH_ABI, withSignerIfPossible)
}

export function useMakerContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && SMELTER_ADDRESS[chainId], SMELTER_ABI, false)
}

export function useTimelockContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && TIMELOCK_ADDRESS[chainId], TIMELOCK_ABI, false)
}

export function useAlpineContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && ALPINE_ADDRESS[chainId], ALPINE_ABI, withSignerIfPossible)
}

export function useGoldVeinPairContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && GOLDVEIN_ADDRESS[chainId], GOLDVEINPAIR_ABI, withSignerIfPossible)
}

export function useLuckySwapSwapper(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && LUCKYSWAP_SWAPPER_ADDRESS[chainId], BASE_SWAPPER_ABI, false)
}

export function useChainlinkOracle(): Contract | null {
    return useContract(CHAINLINK_ORACLE_ADDRESS, CHAINLINK_ORACLE_ABI, false)
}

// experimental:
export function useSaaveContract(withSignerIfPossible?: boolean): Contract | null {
    return useContract('0x364762C00b32c4b448f39efaA9CeFC67a25603ff', SAAVE_ABI, withSignerIfPossible)
}
export function useSwaave(withSignerIfPossible?: boolean): Contract | null {
    return useContract('0xA70e346Ca3825b46EB4c8d0d94Ff204DB76BC289', SAAVE_ABI, withSignerIfPossible)
}

export function useUniV2FactoryContract(): Contract | null {
    return useContract(UNI_FACTORY_ADDRESS, UNI_FACTORY_ABI, false)
}

export function usePancakeV1FactoryContract(): Contract | null {
    return useContract(
        '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
        [
            {
                inputs: [{ internalType: 'address', name: '_feeToSetter', type: 'address' }],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor'
            },
            {
                anonymous: false,
                inputs: [
                    { indexed: true, internalType: 'address', name: 'token0', type: 'address' },
                    { indexed: true, internalType: 'address', name: 'token1', type: 'address' },
                    { indexed: false, internalType: 'address', name: 'pair', type: 'address' },
                    { indexed: false, internalType: 'uint256', name: '', type: 'uint256' }
                ],
                name: 'PairCreated',
                type: 'event'
            },
            {
                constant: true,
                inputs: [],
                name: 'INIT_CODE_PAIR_HASH',
                outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
                payable: false,
                stateMutability: 'view',
                type: 'function'
            },
            {
                constant: true,
                inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
                name: 'allPairs',
                outputs: [{ internalType: 'address', name: '', type: 'address' }],
                payable: false,
                stateMutability: 'view',
                type: 'function'
            },
            {
                constant: true,
                inputs: [],
                name: 'allPairsLength',
                outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
                payable: false,
                stateMutability: 'view',
                type: 'function'
            },
            {
                constant: false,
                inputs: [
                    { internalType: 'address', name: 'tokenA', type: 'address' },
                    { internalType: 'address', name: 'tokenB', type: 'address' }
                ],
                name: 'createPair',
                outputs: [{ internalType: 'address', name: 'pair', type: 'address' }],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function'
            },
            {
                constant: true,
                inputs: [],
                name: 'feeTo',
                outputs: [{ internalType: 'address', name: '', type: 'address' }],
                payable: false,
                stateMutability: 'view',
                type: 'function'
            },
            {
                constant: true,
                inputs: [],
                name: 'feeToSetter',
                outputs: [{ internalType: 'address', name: '', type: 'address' }],
                payable: false,
                stateMutability: 'view',
                type: 'function'
            },
            {
                constant: true,
                inputs: [
                    { internalType: 'address', name: '', type: 'address' },
                    { internalType: 'address', name: '', type: 'address' }
                ],
                name: 'getPair',
                outputs: [{ internalType: 'address', name: '', type: 'address' }],
                payable: false,
                stateMutability: 'view',
                type: 'function'
            },
            {
                constant: false,
                inputs: [{ internalType: 'address', name: '_feeTo', type: 'address' }],
                name: 'setFeeTo',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function'
            },
            {
                constant: false,
                inputs: [{ internalType: 'address', name: '_feeToSetter', type: 'address' }],
                name: 'setFeeToSetter',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function'
            }
        ],
        false
    )
}

export function useIngotContract(version: 'v1' | 'v2' = 'v2'): Contract | null {
    const { chainId } = useActiveWeb3React()
    let address: string | undefined
    if (chainId) {
        switch (chainId) {
            case ChainId.MAINNET:
                address = '0x16E58463eb9792Bc236d8860F5BC69A81E26E32B'
                break
            case ChainId.ROPSTEN:
                address = '0xCaAbdD9Cf4b61813D4a52f980d6BC1B713FE66F5'
                break
            case ChainId.BSC:
                if (version === 'v1') {
                    address = '0x677978dE066b3f5414eeA56644d9fCa3c75482a1'
                } else if (version === 'v2') {
                    address = '0x2DD1aB1956BeD7C2d938d0d7378C22Fd01135a5e'
                }
                break
            case ChainId.MATIC:
                address = '0x0053957E18A0994D3526Cf879A4cA7Be88e8936A'
                break
        }
    }
    return useContract(address, GOLNROLL_ABI, true)
}

// export function usePancakeRollV1Contract(): Contract | null {
//     return useContract('0x677978dE066b3f5414eeA56644d9fCa3c75482a1', GOLNROLL_ABI, true)
// }

// export function usePancakeRollV2Contract(): Contract | null {
//     return useContract('', GOLNROLL_ABI, true)
// }

export function useDashboardContract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    let address: string | undefined
    if (chainId) {
        switch (chainId) {
            case ChainId.MAINNET:
                address = '0xD132Ce8eA8865348Ac25E416d95ab1Ba84D216AF'
                break
            case ChainId.ROPSTEN:
                address = '0xC95678C10CB8b3305b694FF4bfC14CDB8aD3AB35'
                break
            case ChainId.BSC:
                address = '0xCFbc963f223e39727e7d4075b759E97035457b48'
                break
        }
    }
    return useContract(address, DASHBOARD_ABI, false)
}

export function useDashboard2Contract(): Contract | null {
    const { chainId } = useActiveWeb3React()
    let address: string | undefined
    if (chainId) {
        switch (chainId) {
            case ChainId.MAINNET:
                address = '0x1B13fC91c6f976959E7c236Ac1CF17E052d113Fc'
                break
            case ChainId.ROPSTEN:
                address = '0xbB7091524A6a42228E396480C9C43f1C4f6c50e2'
                break
            case ChainId.BSC:
                address = '0x06d149A4a3f4Ac20e992F9321Af571b3B4Da64C4'
                break
        }
    }
    return useContract(address, DASHBOARD2_ABI, false)
}

export function useLuckySwapMultiSwapper(): Contract | null {
    const { chainId } = useActiveWeb3React()
    return useContract(chainId && LUCKYSWAP_MULTISWAPPER_ADDRESS[chainId], LUCKYSWAP_MULTISWAPPER_ABI)
}

export function useQuickSwapFactoryContract(): Contract | null {
    return useContract(
        '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
        [
            {
                type: 'constructor',
                stateMutability: 'nonpayable',
                payable: false,
                inputs: [{ type: 'address', name: '_feeToSetter', internalType: 'address' }]
            },
            {
                type: 'event',
                name: 'PairCreated',
                inputs: [
                    { type: 'address', name: 'token0', internalType: 'address', indexed: true },
                    { type: 'address', name: 'token1', internalType: 'address', indexed: true },
                    { type: 'address', name: 'pair', internalType: 'address', indexed: false },
                    { type: 'uint256', name: '', internalType: 'uint256', indexed: false }
                ],
                anonymous: false
            },
            {
                type: 'function',
                stateMutability: 'view',
                payable: false,
                outputs: [{ type: 'address', name: '', internalType: 'address' }],
                name: 'allPairs',
                inputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
                constant: true
            },
            {
                type: 'function',
                stateMutability: 'view',
                payable: false,
                outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
                name: 'allPairsLength',
                inputs: [],
                constant: true
            },
            {
                type: 'function',
                stateMutability: 'nonpayable',
                payable: false,
                outputs: [{ type: 'address', name: 'pair', internalType: 'address' }],
                name: 'createPair',
                inputs: [
                    { type: 'address', name: 'tokenA', internalType: 'address' },
                    { type: 'address', name: 'tokenB', internalType: 'address' }
                ],
                constant: false
            },
            {
                type: 'function',
                stateMutability: 'view',
                payable: false,
                outputs: [{ type: 'address', name: '', internalType: 'address' }],
                name: 'feeTo',
                inputs: [],
                constant: true
            },
            {
                type: 'function',
                stateMutability: 'view',
                payable: false,
                outputs: [{ type: 'address', name: '', internalType: 'address' }],
                name: 'feeToSetter',
                inputs: [],
                constant: true
            },
            {
                type: 'function',
                stateMutability: 'view',
                payable: false,
                outputs: [{ type: 'address', name: '', internalType: 'address' }],
                name: 'getPair',
                inputs: [
                    { type: 'address', name: '', internalType: 'address' },
                    { type: 'address', name: '', internalType: 'address' }
                ],
                constant: true
            },
            {
                type: 'function',
                stateMutability: 'nonpayable',
                payable: false,
                outputs: [],
                name: 'setFeeTo',
                inputs: [{ type: 'address', name: '_feeTo', internalType: 'address' }],
                constant: false
            },
            {
                type: 'function',
                stateMutability: 'nonpayable',
                payable: false,
                outputs: [],
                name: 'setFeeToSetter',
                inputs: [{ type: 'address', name: '_feeToSetter', internalType: 'address' }],
                constant: false
            }
        ],
        false
    )
}

export function useFaucetContract(withSignerIfPossible?: boolean): Contract | null {
    return useContract(FAUCET_ADDRESS, FAUCET_ABI, withSignerIfPossible)
}
