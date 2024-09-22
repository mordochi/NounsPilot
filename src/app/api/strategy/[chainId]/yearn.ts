import {
  AbiParameter,
  Address,
  createPublicClient,
  getAddress,
  http,
} from 'viem';
import { arbitrum, mainnet, polygon } from 'viem/chains';
import { DeFiProtocol, Strategy } from './types';
import { ScanAction, fetchAbi, floor, getChain, getExplorerUrl } from './utils';

/**
 * {
        "address": "0x310B7Ea7475A0B449Cfd73bE81522F1B88eFAFaa",
        "type": "Yearn Vault",
        "kind": "Multi Strategy",
        "symbol": "yvUSDT-1",
        "name": "USDT",
        "category": "Volatile",
        "version": "3.0.2",
        "description": "Multi strategy USDT vault. \u003cbr/\u003e\u003cbr/\u003eMulti strategy vaults are (wait for it) vaults that contain multiple strategies. Multi strategy vaults give the vault creator flexibility to balance risk and opportunity across multiple different strategies.",
        "decimals": 6,
        "chainID": 1,
        "token": {
            "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "name": "Tether USD",
            "symbol": "USDT",
            "description": "",
            "decimals": 6
        },
        "tvl": {
            "totalAssets": "6352857421898",
            "tvl": 6352857.421898,
            "price": 1
        },
        "apr": {
            "type": "v2:averaged",
            "netAPR": 0.04307669592628423,
            "fees": {
                "performance": 0.1,
                "management": 0
            },
            "points": {
                "weekAgo": 0.060646833052274654,
                "monthAgo": 0.04307669592628423,
                "inception": 0.003668000000000004
            },
            "extra": {
                "stakingRewardsAPR": null,
                "gammaRewardAPR": null
            },
            "forwardAPR": {
                "type": "v3:onchainOracle",
                "netAPR": 0.02328591149836491,
                "composite": {
                    "boost": null,
                    "poolAPY": null,
                    "boostedAPR": null,
                    "baseAPR": null,
                    "cvxAPR": null,
                    "rewardsAPR": null,
                    "v3OracleCurrentAPR": 0.0382361297589159,
                    "v3OracleStratRatioAPR": 0.02328591149836491
                }
            }
        },
        "strategies": [
            {
                "address": "0x95d69641ED7eCAa5e7d5539F56Dc6194b5Bcd7fA",
                "name": "Aave V3 USDT Lender",
                "details": {
                    "totalDebt": "4278000140734",
                    "totalLoss": "0",
                    "totalGain": "0",
                    "performanceFee": 5000,
                    "lastReport": 1726277603,
                    "debtRatio": 6734
                }
            },
            {
                "address": "0x206db0A0Af10Bec57784045e089A418771D20227",
                "name": "USDT CompoundV3 Lender",
                "details": {
                    "totalDebt": "1978914534645",
                    "totalLoss": "0",
                    "totalGain": "0",
                    "performanceFee": 1000,
                    "lastReport": 1725909383,
                    "debtRatio": 3115
                }
            },
            {
                "address": "0xED48069a2b9982B4eec646CBfA7b81d181f9400B",
                "name": "",
                "details": {
                    "totalDebt": "95940973562",
                    "totalLoss": "0",
                    "totalGain": "0",
                    "performanceFee": 500,
                    "lastReport": 1726336883,
                    "debtRatio": 151
                }
            }
        ],
        "staking": {
            "address": "",
            "available": false,
            "source": "",
            "rewards": null
        },
        "migration": {
            "available": false,
            "address": "0x310B7Ea7475A0B449Cfd73bE81522F1B88eFAFaa",
            "contract": "0x0000000000000000000000000000000000000000"
        },
        "featuringScore": 2.7366010742613808e+23,
        "pricePerShare": "1003666",
        "info": {
            "riskLevel": 1,
            "isRetired": false,
            "isBoosted": false,
            "isHighlighted": true,
            "riskScore": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ]
        }
    }
 */
type YearnVault = {
  address: Address;
  type: string;
  kind: string;
  symbol: string;
  name: string;
  category: string;
  version: string;
  description: string;
  decimals: number;
  chainID: number;
  token: {
    address: Address;
    name: string;
    symbol: string;
    description: string;
    decimals: number;
  };
  tvl: {
    totalAssets: string;
    tvl: number;
    price: number;
  };
  apr: {
    type: string;
    netAPR: number;
    fees: {
      performance: number;
      management: number;
    };
    points: {
      weekAgo: number;
      monthAgo: number;
      inception: number;
    };
    extra?: {
      stakingRewardAPR: number | null;
      gammaRewardAPR: number | null;
    };
    forwardAPR: {
      type: string;
      netAPR: number;
      composite: {
        boost: number | null;
        poolAPY: number | null;
        boostedAPR: number | null;
        baseAPR: number | null;
        cvxAPR: number | null;
        rewardsAPR: number | null;
        v3OracleCurrentAPR: number;
        v3OracleStratRatioAPR: number;
      };
    };
  };
  strategies: {
    address: string;
    name: string;
    details: {
      totalDebt: string;
      totalLoss: string;
      totalGain: string;
      performanceFee: number;
      lastReport: number;
      debtRatio: number;
    };
  };
  staking: {
    address: Address;
    available: boolean;
    source: string;
    rewards: number | null;
  };
  migration: {
    available: boolean;
    address: string;
    contract: string;
  };
  featuringScore: number;
  pricePerShare: string;
  info: {
    riskLevel: number;
    isRetired: boolean;
    isBoosted: boolean;
    isHighlighted: boolean;
    riskScore: number[];
  };
};

const getAPR = (vault: YearnVault) => {
  let apr = floor(
    Object.values(vault.apr.extra ?? {}).reduce((acc, value) => {
      return (acc ?? 0) + (value ?? 0);
    }, vault.apr.forwardAPR.netAPR),
    2
  );
  if (apr === 0) {
    apr = vault.apr.netAPR;
  }
  return apr;
};

export const yearn = (): DeFiProtocol => {
  let cachedVaults: YearnVault[] = [];

  const getVaults = async (relatedTokens: Address[]) => {
    if (cachedVaults.length) return cachedVaults;
    const query = new URLSearchParams({
      hideAlways: 'true',
      orderBy: 'featuringScore',
      orderDirection: 'desc',
      strategiesDetails: 'withDetails',
      strategiesCondition: 'inQueue',
      chainIDs: [mainnet, arbitrum, polygon]
        .map((value) => value.id.toString())
        .join(','),
      limit: '500',
    });
    const url = `https://ydaemon.yearn.fi/vaults?` + query;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const vaults = (await response.json()) as YearnVault[];

    cachedVaults = vaults.filter((vault) => {
      const apr = getAPR(vault);
      return (
        vault.version.split('.')[0] === '3' &&
        apr > 0.05 &&
        relatedTokens
          .map((value) => value.toLowerCase())
          .includes(vault.token.address.toLowerCase())
      );
    });

    return cachedVaults;
  };

  const getStrategies = async (chainId: number, relatedTokens: Address[]) => {
    const vaults = await getVaults(relatedTokens);

    const strategies: Strategy[] = [];
    for (const vault of vaults) {
      await sleep(100);
      const requestURL = getExplorerUrl(
        chainId,
        vault.address,
        ScanAction.getSourcecode
      );
      const contractSourceRes = await fetch(requestURL);
      const contractSource = await contractSourceRes.json();

      if (contractSource.message !== 'OK') {
        console.log(`contractSource: `, contractSource);
        continue;
      }

      let name = vault.name;
      let symbol = vault.symbol;
      let decimals = vault.decimals;
      let vaultAbi: AbiParameter[] = [];

      if (
        contractSource.result[0].ABI !== 'Contract source code not verified' &&
        contractSource.result[0].SourceCode !== ''
      ) {
        let implementationAddress = vault.address;
        if (
          contractSource.result[0].Implementation &&
          contractSource.result[0].Implementation !== ''
        ) {
          implementationAddress = contractSource.result[0].Implementation;
        }

        const client = createPublicClient({
          chain: getChain(vault.chainID),
          transport: http(),
        });
        vaultAbi = await fetchAbi(
          vault.chainID,
          getAddress(implementationAddress)
        );
        const vaultContract = {
          address: getAddress(vault.address),
          abi: vaultAbi,
        } as const;

        const [nameResult, symbolResult, decimalsResult] =
          await client.multicall({
            contracts: [
              {
                ...vaultContract,
                functionName: 'name',
              },
              {
                ...vaultContract,
                functionName: 'symbol',
              },
              {
                ...vaultContract,
                functionName: 'decimals',
              },
            ],
          });
        if (nameResult.status === 'success') {
          name = nameResult.result as string;
        }
        if (symbolResult.status === 'success') {
          symbol = symbolResult.result as string;
        }
        if (decimalsResult.status === 'success') {
          decimals = decimalsResult.result as number;
        }
      }

      const riskLevel = vault.info.riskLevel;

      const apr = getAPR(vault);

      const strategy: Strategy = {
        name: vault.type + ' ' + vault.name,
        chainId: vault.chainID,
        platformIcon:
          'https://seeklogo.com/images/Y/yearn-finance-logo-A46504E937-seeklogo.com.png',
        input: {
          name: vault.token.name,
          symbol: vault.token.symbol,
          address: getAddress(vault.token.address),
          decimals: vault.token.decimals,
        },
        contract: {
          contractAddress: getAddress(vault.address),
          abi: vaultAbi,
        },
        output: {
          name,
          symbol,
          address: getAddress(vault.address),
          decimals,
        },
        riskLevel,
        tvl: vault.tvl.tvl,
        apr,
      };
      strategies.push(strategy);
    }

    return strategies;
  };

  return {
    name: 'yearn',
    getStrategies,
  };
};

const sleep = (arg0: number) => {
  // use setTimeout to sleep
  return new Promise((resolve) => {
    setTimeout(resolve, arg0);
  });
};
