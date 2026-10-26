/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// SVG Icons (assets/icons)
import IconArrivalSpotlight from '@/assets/icons/icon-arrival-spotlight.svg?component'
import IconDepartSpotlight from '@/assets/icons/icon-depart-spotlight.svg?component'
import IconLocationMark from '@/assets/icons/icon-location-mark.svg?component'
import IconLocationSpotlight from '@/assets/icons/icon-location-spotlight.svg?component'
import IconMeMark from '@/assets/icons/icon-me-mark.svg?component'
import IconParkingMark from '@/assets/icons/icon-parking-mark.svg?component'
import IconParkingSpotlight from '@/assets/icons/icon-parking-spotlight.svg?component'
import IconCreateSpotlight from '@/assets/icons/icon-create-spotlight.svg?component'
import IconCreateMark from '@/assets/icons/icon-create-mark.svg?component'

const customAliases = {
  ...aliases,
  'cus-arrival-spotlight': IconArrivalSpotlight,
  'cus-depart-spotlight': IconDepartSpotlight,
  'cus-location-mark': IconLocationMark,
  'cus-location-spotlight': IconLocationSpotlight,  
  'cus-me-mark': IconMeMark,
  'cus-parking-mark': IconParkingMark,
  'cus-parking-spotlight': IconParkingSpotlight,
  'cus-create-spotlight': IconCreateSpotlight,
  'cus-create-mark': IconCreateMark,
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          surface: '#F9FAFB', // 배경색을 설정
          background: '#F9FAFB', // 배경색을 설정
        },
        variables: {
          'body-font-family': '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
        },
      }
    }
  },
      
  icons: {
    defaultSet: 'mdi',
    aliases: customAliases,
    sets: {
      mdi,
    },
  }
})
