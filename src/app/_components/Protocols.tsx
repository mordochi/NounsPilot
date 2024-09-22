'use client';

import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  keyframes,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  Address,
  Hex,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseUnits,
} from 'viem';
import { arbitrum } from 'viem/chains';
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi';
import YearnV3Vault from '@/abi/YearnV3Vault.json';
import AlertTriangleSharp from '@/components/icons/AlertTriangleSharp';
import MiscTxtGMSharp from '@/components/icons/MiscTxtGMSharp';
import NounsCatSkullSharp from '@/components/icons/NounsCatSkullSharp';
import TrendingUpSharp from '@/components/icons/TrendingUpSharp';
import type { DefiToken } from '@/types';
import { approveAndSwapTx } from '@/utils/approveAndSwapTx';
import { calculateMiniReceiveAmount } from '@/utils/calculateMiniReceiveAmount';
import {
  getMinimumReceivedAmount,
  prepareTakeTaxiAndAMMSwap,
} from '@/utils/getMinimumReceivedAmount';
import { getOperationCalldata } from '@/utils/getOperationCalldata';
import { BridgeMode, bridgeTx, getStargatePoolToken } from '@/utils/stargate';
import { Strategy } from '../api/strategy/[chainId]/types';
import ProcessBar from './ProcessBar';
import ProtocolTags from './ProtocolTags';
import TokenIcon from './TokenIcon';
// import TransactionBlock from './TransactionBlock';

const POLYGON_STARGATE_POOL_USDT = '0xd47b03ee6d86Cf251ee7860FB2ACf9f91B9fD4d7';
const ARBITRUM_NONUS_BRIDGE_PILOT =
  '0x587e7D2575fFD7F6D5b534E4399aDD1086aEbcd1';
const DST_EID: bigint = 30110n;

const spin = keyframes`
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
`;

const grow = keyframes`
  0% { width: 20px; }
  50% { width: 40px; }
  100% { width: 60px; }
`;

export type Tx = {
  name: string;
  to: Address;
  value: bigint;
  data: Hex;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TEMP: Record<Address, Strategy[]> = {
  '0x6b175474e89094c44da98b954eedeac495271d0f': [
    {
      id: '100000',
      apr: 0.07,
      chainId: 1,
      contract: {
        contractAddress: '0x028eC7330ff87667b6dfb0D94b954c820195336c',
        abi: [],
      },
      input: {
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
      },
      name: 'Yearn Vault DAI',
      output: {
        name: 'DAI-1 yVault',
        symbol: 'yvDAI-1',
        address: '0x028eC7330ff87667b6dfb0D94b954c820195336c',
        decimals: 18,
      },
      platformIcon:
        'https://seeklogo.com/images/Y/yearn-finance-logo-A46504E937-seeklogo.com.png',
      riskLevel: 1,
      tvl: 4731769.167609766,
    },
    {
      id: '100001',
      apr: 0.061689450401205576,
      chainId: 42161,
      contract: {
        contractAddress: '0x9FA306b1F4a6a83FEC98d8eBbaBEDfF78C407f6B',
        abi: [],
      },
      input: {
        name: 'USD Coin (Arb1)',
        symbol: 'USDC',
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        decimals: 6,
      },
      name: 'Yearn Vault USDC.e-2',
      output: {
        name: 'USDC.e-2',
        symbol: 'yvUSDC-2',
        address: '0x9FA306b1F4a6a83FEC98d8eBbaBEDfF78C407f6B',
        decimals: 6,
      },
      platformIcon:
        'https://seeklogo.com/images/Y/yearn-finance-logo-A46504E937-seeklogo.com.png',
      riskLevel: 2,
      tvl: 699766.223093,
    },
  ],
};

export default function Protocols() {
  const [ownedTokenInfos, setOwnedTokenInfos] = useState<
    Record<Address, DefiToken>
  >({});
  const [strategies, setStrategies] = useState<Record<Address, Strategy[]>>({});
  const [strategiesLoadingMap, setStrategiesLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [strategiesTxs, setStrategiesTxs] = useState<Record<string, Tx[]>>({});
  const [isFetching, setIsFetching] = useState(true);
  const [hasNoPosition, setHasNoPosition] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [hasDone, setHasDone] = useState(false);
  const { address, chain } = useAccount();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (isConfirmed) {
      if (currentStep < strategiesTxs[currentStrategy].length - 1) {
        setCurrentStep((step) => step + 1);
      } else {
        setHasDone(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  useEffect(() => {
    if (!address || !chain?.id) return;
    fetch(`/api/1inch/${chain.id}/balance/${address}`)
      .then((res) => res.json())
      .then((addressTokenInfos) => {
        const result = Object.fromEntries(
          Object.entries<DefiToken>(addressTokenInfos).filter(
            ([_, tokenInfo]) => tokenInfo.balance !== '0'
          )
        );
        setOwnedTokenInfos(result);

        if (!Object.keys(result).length) {
          setHasNoPosition(true);
          return setIsFetching(false);
        }

        const query = new URLSearchParams(
          Object.keys(result).map((address) => ['tokenAddress', address])
        );

        fetch(`/api/strategy/${chain.id.toString()}?` + query)
          .then((res) => res.json())
          .then((res: Record<string, Strategy[]>) => {
            Object.keys(res).forEach((tokenAddress) =>
              res[tokenAddress].sort((a, b) => b.apr - a.apr)
            );
            setStrategies(res);
            setIsFetching(false);
          });
      });
  }, [address, chain?.id]);

  const handleClick =
    (tokenAddress: Address, strategy: Strategy) => async () => {
      try {
        if (!address || !chain) return;
        setStrategiesLoadingMap({
          ...strategiesLoadingMap,
          [strategy.id]: true,
        });

        const txs: Tx[] = [];

        const currentToken =
          ownedTokenInfos[tokenAddress.toLowerCase() as Address] || {};

        const dstTokenAddress = await getStargatePoolToken(
          POLYGON_STARGATE_POOL_USDT
        );

        const { txs: swapTxs, dstAmount: _dstAmount } = await approveAndSwapTx({
          chain,
          address,
          value: '0.1',
          selectedToken: {
            address: currentToken.address,
            symbol: currentToken.symbol,
            decimals: currentToken.decimals,
          },
          dstTokenAddress,
        });
        txs.push(...swapTxs);

        const inputAmount = calculateMiniReceiveAmount(_dstAmount, '0.5');
        const destinationTokenDecimals = strategy.input.decimals;

        const minimumReceivedAmount = await getMinimumReceivedAmount(
          POLYGON_STARGATE_POOL_USDT,
          DST_EID,
          inputAmount,
          ARBITRUM_NONUS_BRIDGE_PILOT
        );

        const nextInput = formatUnits(
          minimumReceivedAmount,
          destinationTokenDecimals
        );

        const arbitrumVaultTxs = (input: string) => {
          const amountBN = parseUnits(input, destinationTokenDecimals);

          const txs: Tx[] = [];
          // approve tx
          txs.push({
            name: `approve to spend ${strategy.input.symbol}`,
            to: strategy.input.address,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [strategy.contract.contractAddress, amountBN],
            }),
          });

          // deposit tx
          txs.push({
            name: `deposit ${strategy.input.symbol}`,
            to: strategy.contract.contractAddress,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: YearnV3Vault,
              functionName: 'deposit',
              args: [amountBN, address],
            }),
          });

          return txs;
        };

        const calldata = await getOperationCalldata(
          ARBITRUM_NONUS_BRIDGE_PILOT,
          arbitrumVaultTxs(nextInput).map((tx) => ({
            name: tx.name,
            to: tx.to,
            value: tx.value,
            data: tx.data || '0x',
          }))
        );

        const query = new URLSearchParams({
          srcEid: '30110',
          chainId: arbitrum.id.toString(),
          composerMessage: calldata,
          composerAddress: ARBITRUM_NONUS_BRIDGE_PILOT,
          tokenAddress: strategy.input.address,
          userAddress: address,
          minimumReceiveAmount: minimumReceivedAmount.toString(),
        });
        const estimateGasLimitRes = await fetch(`/api/estimate?` + query).then(
          (res) => res.json()
        );
        const estimateGasLimit = estimateGasLimitRes.gasLimit;

        const sendParam = await prepareTakeTaxiAndAMMSwap(
          POLYGON_STARGATE_POOL_USDT,
          DST_EID,
          inputAmount,
          ARBITRUM_NONUS_BRIDGE_PILOT,
          estimateGasLimit,
          calldata
        );

        const bridgeTxs = (await bridgeTx({
          fromChain: chain,
          toChain: arbitrum,
          tokenSymbol: strategy.input.symbol,
          tokenDecimals: strategy.input.decimals,
          poolAddr: POLYGON_STARGATE_POOL_USDT,
          userAddr: address,
          toAddr: ARBITRUM_NONUS_BRIDGE_PILOT,
          amount: inputAmount,
          dstEid: DST_EID,
          mode: BridgeMode.taxi, // only taxi supports compose tx.
          composeInfo: {
            composeMsg: sendParam.composeMsg,
            executorLzComposeGasLimit: estimateGasLimit,
            rerenderFunc: async (nextInput: string) =>
              arbitrumVaultTxs(nextInput),
          },
        })) as Tx[];

        txs.push(...bridgeTxs);

        setStrategiesLoadingMap({
          ...strategiesLoadingMap,
          [strategy.id]: false,
        });
        setStrategiesTxs({
          ...strategiesTxs,
          [strategy.id]: txs,
        });
        setCurrentStrategy(strategy.id);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Something went wrongwrong :('
        );
      }
    };

  const handleSendCurrentTx = () => {
    const tx = strategiesTxs?.[currentStrategy]?.[currentStep];
    sendTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
    });
  };

  let order = -1;

  const aprAnimation = prefersReducedMotion
    ? undefined
    : `${spin} infinite 1.5s linear`;

  const loadingAnimation = prefersReducedMotion
    ? undefined
    : `${grow} infinite 1.5s linear`;

  if (!address) return null;

  if (isFetching)
    return (
      <Flex alignItems="flex-end" mt="32px" position="relative">
        <MiscTxtGMSharp fill="primary" />
        <Text
          fontSize="40px"
          lineHeight="65px"
          width="20px"
          height="65px"
          overflow="hidden"
          animation={loadingAnimation}
          position="absolute"
          left="100%"
        >
          ▪︎▪︎▪︎
        </Text>
      </Flex>
    );

  if (hasNoPosition || !Object.keys(strategies).length)
    return (
      <Text fontSize="30px" fontFamily="silkscreen" mt="32px">
        Please give me money
        <NounsCatSkullSharp boxSize="48px" fill="primary" ml="4px" />
      </Text>
    );

  return (
    <Box width="100%" mt="32px">
      {(Object.keys(strategies) as Address[]).map((tokenAddress) => {
        const tokenStrategies = strategies[tokenAddress];
        const currentToken =
          ownedTokenInfos[tokenAddress.toLowerCase() as Address] || {};
        const balanceString = formatUnits(
          BigInt(currentToken.balance || 0),
          currentToken.decimals
        );
        return tokenStrategies.map((strategy) => {
          order++;
          return (
            <Box
              key={`${tokenAddress}-${strategy.contract.contractAddress}`}
              width="100%"
              padding="16px"
              pb="calc(16px + 22px)"
              my="16px"
              bg={`brand.${order % 3 === 1 ? 'light' : order % 3 === 2 ? 'dark' : 'regular'}`}
              borderRadius="10px"
              cursor="pointer"
              pointerEvents={
                strategy.contract.contractAddress ===
                '0x5108DB0852C0CAA2Df797DcF31f8A73bFb335452'
                  ? 'auto'
                  : 'none'
              }
              onClick={
                Object.keys(strategiesTxs).length
                  ? () => {}
                  : handleClick(tokenAddress, strategy)
              }
            >
              <Flex justifyContent="space-between" fontFamily="silkscreen">
                <Text
                  fontWeight="bold"
                  color={`risk.${strategy.riskLevel + 1}`}
                >
                  <AlertTriangleSharp
                    boxSize="20px"
                    mr="4px"
                    fill={`risk.${strategy.riskLevel + 1}`}
                  />
                  Risk Level: {strategy.riskLevel}
                </Text>

                <Text fontSize="14px" color="secondary">
                  {strategy.apr > 0.2 ? (
                    <TrendingUpSharp
                      boxSize="26px"
                      fill="secondary"
                      mr="4px"
                      animation={aprAnimation}
                    />
                  ) : null}

                  <Text as="span" fontWeight="bold">
                    APR:{' '}
                    {new Intl.NumberFormat('en', {
                      style: 'percent',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(strategy.apr)}
                  </Text>
                  <Text as="span" fontWeight="bold" ml="8px">
                    TVL: {strategy.tvl}
                  </Text>
                </Text>
              </Flex>

              <ProtocolTags
                isBridgeNeeded={!!chain?.id && chain.id !== strategy.chainId}
                isSwapNeeded={currentToken.symbol !== strategy.input.symbol}
                mt={
                  (chain?.id && chain.id !== strategy.chainId) ||
                  tokenAddress !== strategy.input.address.toLowerCase()
                    ? '4px'
                    : '0'
                }
                mb={
                  (chain?.id && chain.id !== strategy.chainId) ||
                  tokenAddress !== strategy.input.address.toLowerCase()
                    ? '32px'
                    : '0'
                }
              />

              <Flex
                justifyContent="space-between"
                alignItems="center"
                mt="32px"
              >
                <Flex alignItems="center" width="20%">
                  <TokenIcon
                    name={currentToken.name}
                    symbol={currentToken.symbol || 'j'}
                    url={currentToken.logoURI}
                  />
                  <Box ml="8px">
                    {currentToken.balance ? (
                      <Text>
                        {balanceString.split('.')[0] +
                          (balanceString.split('.')[1]
                            ? '.' + balanceString.split('.')[1].slice(0, 6)
                            : '')}{' '}
                        {currentToken.symbol} (Max)
                      </Text>
                    ) : null}
                  </Box>
                </Flex>

                <ProcessBar
                  strategyChainId={strategy.chainId}
                  strategyName={strategy.name}
                  isSwapNeeded={currentToken.symbol !== strategy.input.symbol}
                />

                <Flex justifyContent="flex-end" alignItems="center" width="20%">
                  <Box mr="8px">
                    <Text>
                      Receive{' '}
                      <Text as="span" fontWeight="bold">
                        {strategy.output.symbol}
                      </Text>
                    </Text>
                  </Box>
                  <TokenIcon
                    name={strategy.output.name}
                    symbol={strategy.output.symbol}
                  />
                </Flex>
              </Flex>

              {/* {strategiesLoadingMap[strategy.id] === true && (
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  mt="32px"
                >
                  <Spinner />
                </Flex>
              )} */}
              {/* {strategiesTxs[strategy.id] && (
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  mt="32px"
                >
                  {strategiesTxs[strategy.id].map((tx, index) => (
                    <TransactionBlock
                      key={`${tx.name}-${tx.to}-${index}`}
                      order={order}
                      tx={tx}
                    />
                  ))}
                </Flex>
              )} */}
            </Box>
          );
        });
      })}
      <Modal
        isOpen={
          !!currentStrategy ||
          !!error ||
          Object.values(strategiesLoadingMap).some((loading) => loading)
        }
        onClose={() => {
          setError('');
          setStrategiesLoadingMap((map) => {
            const key = Object.keys(map).find((key) => map[key]);
            return {
              ...map,
              ...(key ? { [key]: false } : {}),
            };
          });
          setCurrentStrategy('');
        }}
        isCentered
      >
        <ModalOverlay />
        {currentStrategy || error ? (
          <ModalContent bg="background" textAlign="center">
            <ModalHeader fontFamily="silkscreen" pt="32px">
              {error
                ? 'Something went wrong :('
                : hasDone
                  ? 'Congrats!'
                  : 'Approve Your Txs'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py="0" whiteSpace="pre-wrap">
              {error
                ? error +
                  "\n\nPlease be patient with us, and we'll soon make it available ⌐♥-♥"
                : hasDone
                  ? `You've arrived safely where you wanted to go 🛬\ntxHash: ${hash}`
                  : 'Please confirm the following transactions in your wallet ⌐🅃-🅇'}
            </ModalBody>

            <ModalFooter>
              <Button
                width="100%"
                bg="brand.dark"
                color="secondary"
                isLoading={isConfirming}
                isDisabled={isConfirming}
                _hover={{
                  _disabled: { bg: 'brand.dark' },
                }}
                onClick={
                  error || hasDone
                    ? () => {
                        setError('');
                        setStrategiesLoadingMap((map) => {
                          const key = Object.keys(map).find((key) => map[key]);
                          return {
                            ...map,
                            ...(key ? { [key]: false } : {}),
                          };
                        });
                        setCurrentStrategy('');
                      }
                    : handleSendCurrentTx
                }
              >
                {error || hasDone
                  ? 'Close'
                  : strategiesTxs?.[currentStrategy]?.[currentStep]?.name}
              </Button>
            </ModalFooter>
          </ModalContent>
        ) : null}
      </Modal>
    </Box>
  );
}
