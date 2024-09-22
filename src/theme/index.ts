'use client';

import { extendTheme } from '@chakra-ui/react';
import { Nunito, Press_Start_2P, Silkscreen } from 'next/font/google';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const silkscreen = Silkscreen({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const nunito = Nunito({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const theme = extendTheme({
  fonts: {
    heading: `${pressStart2P.style.fontFamily}, sans-serif`,
    body: `${nunito.style.fontFamily}, sans-serif`,
    silkscreen: `${silkscreen.style.fontFamily}, sans-serif`,
  },
  colors: {
    // Colors from Nouns palette: https://noundation.xyz/styles/colors
    primary: '#4C3C3B',
    secondary: '#F5FCFF',
    brand: {
      'lighter.800': 'rgba(253, 248, 255, 0.8)',
      lighter: '#FDF8FF',
      light: '#A3BAED',
      regular: '#648DF9',
      dark: '#395ED1',
    },
    risk: {
      '0': '#068940',
      '1': '#ABF131',
      '2': '#EED811',
      '3': '#F78A18',
      '4': '#D32A09',
    },
  },
  styles: {
    global: {
      body: {
        color: 'primary',
        bg: '#F9F4E6',
      },
      '*': {
        boxSizing: 'border-box',
        padding: '0',
        margin: '0',
      },
    },
  },
});

export default theme;
