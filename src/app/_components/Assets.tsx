'use client'

import { Box, Flex, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Strategy } from '../api/strategy/[chainId]/types'

export default function Assets() {
  const [balances, setBalances] = useState<Record<string, string>>({})
  const { address } = useAccount()

  useEffect(() => {
    if (!address) return
    fetch(`/api/1inch/balance/${address}`)
      .then((res) => res.json())
      .then(setBalances)
  }, [address])

  useEffect(() => {
    if (!address) return
    if (Object.keys(balances).length === 0) return
    
    const balanceExists = Object.keys(balances).filter(
      (address) => balances[address] !== '0'
    )
    if (balanceExists.length === 0) return

    let query = new URLSearchParams(balanceExists.map((address) => ['tokenAddress',address]))
    query.append('chainId', '1')

    fetch(`/api/strategy/1?` + query)
      .then((res) => res.json())
      .then((res: Record<string, Strategy[]>) => {
        console.log(res)
      })
  }, [balances])

  return (
    <Box mt="24px">
      {Object.keys(balances)
        .filter((addressString) => balances[addressString] !== '0')
        .map((tokenAddress) => (
          <Flex
            key={tokenAddress}
            flex="1"
            justifyContent="space-between"
            padding="12px"
          >
            <Box>
              <Text>Token: </Text>
              <Text>{tokenAddress}</Text>
            </Box>
            <Box>
              <Text>Balance: </Text>
              <Text>{balances[tokenAddress]}</Text>
            </Box>
          </Flex>
        ))}
    </Box>
  )
}
