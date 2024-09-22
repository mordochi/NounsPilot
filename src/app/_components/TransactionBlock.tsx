import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { Tx } from './Protocols';
import { Box, FlexProps, Text } from '@chakra-ui/react';

export default function TransactionBlock({
  order,
  tx,
  ...rest
}: { order: number; tx: Tx } & FlexProps) {
  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleTx = (tx: Tx) => async () => {
    sendTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
    });
    return;
  };

  return (
    <Box
      backgroundColor="none"
      height="100%"
      width="25%"
      padding="16px"
      mx="16px"
      flexDirection="column"
      {...rest}
    >
      <Box
        my="16px"
        height="100%"
        bg={`brand.${order % 3 === 2 ? 'light' : order % 3 === 0 ? 'dark' : 'regular'}`}
        borderRadius="10px"
        cursor="pointer"
        onClick={handleTx(tx)}
      >
        <Text align="center" fontWeight="bold" color="white">
          {tx.name}
        </Text>
      </Box>
      {hash && <Text fontWeight="bold">Transaction Hash: {hash}</Text>}
      {isConfirming && (
        <Text fontWeight="bold">Waiting for confirmation...</Text>
      )}
      {isConfirmed && <Text fontWeight="bold">✅ Transaction confirmed.</Text>}
    </Box>
  );
}
