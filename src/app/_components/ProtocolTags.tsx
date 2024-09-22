import { Flex, FlexProps, Tag } from '@chakra-ui/react';
import RefreshSharp from '@/components/icons/RefreshSharp';
import SendSharp from '@/components/icons/SendSharp';

export default function ProtocolTags({
  isBridgeNeeded,
  isSwapNeeded,
  ...rest
}: {
  isBridgeNeeded: boolean;
  isSwapNeeded: boolean;
} & FlexProps) {
  return (
    <Flex fontFamily="silkscreen" {...rest}>
      {isBridgeNeeded ? (
        <Tag
          bg="brand.lighter"
          color="brand.regular"
          borderRadius="24px"
          fontSize="12px"
          minHeight="16px"
        >
          <SendSharp boxSize="14px" fill="brand.regular" mr="4px" />
          Bridge Required
        </Tag>
      ) : null}
      {isSwapNeeded ? (
        <Tag
          bg="brand.lighter"
          color="brand.regular"
          borderRadius="24px"
          fontSize="12px"
          minHeight="16px"
          ml="4px"
        >
          <RefreshSharp boxSize="14px" fill="brand.regular" mr="4px" />
          Swap Required
        </Tag>
      ) : null}
    </Flex>
  );
}
