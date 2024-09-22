'use client';

import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    // Colors from Nouns palette: https://noundation.xyz/styles/colors
    primary: '#292F32',
    secondary: '#F5FCFF',
    brand: {
      lighter: '#E5E5DE',
      light: '#ADC8CC',
      regular: '#769CA9',
    },
  },
  styles: {
    global: {
      body: {
        color: 'primary',
      },
    },
  },
});

export default theme;
