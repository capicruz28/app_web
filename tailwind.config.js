const colors = {
  primary: '#792082',
  secondary: '#0055A3',
  accent: '#E50040',
  background: {
    light: '#f0f0f0',
    dark: '#1a1a1a'
  },
  text: {
    light: '#333333',
    dark: '#ffffff'
  }
};

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        background: colors.background.light,
        'background-dark': colors.background.dark,
        text: colors.text.light,
        'text-dark': colors.text.dark,
      },
      backgroundColor: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
      },
      textColor: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
      }
    }
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
         /* Estilos base para cards */
        '.card': {
          '@apply bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-all duration-200 border border-gray-200 dark:border-gray-700': {}
        },
        '.card-header': {
          '@apply p-4 border-b border-gray-200 dark:border-gray-700': {}
        },
        '.card-title': {
          '@apply text-lg font-semibold text-gray-900 dark:text-white': {}
        },
        '.card-content': {
          '@apply p-4': {}
        },
        
        /* Estilos para textos */
        '.text-primary': {
          '@apply text-gray-900 dark:text-white': {}
        },
        '.text-secondary': {
          '@apply text-gray-600 dark:text-gray-300': {}
        },    
        '.text-muted': {
          '@apply text-gray-500 dark:text-gray-400': {}
        },
      
        /* Estilos para bordes */
        '.border-subtle': {
          '@apply border-gray-200 dark:border-gray-700': {}
        },

        /* Estilos para fondos */
        '.bg-subtle': {
          '@apply bg-gray-50 dark:bg-gray-800': {}
        },
        '.bg-active': {
        '@apply bg-gray-100 dark:bg-gray-700': {}
        },

        /* Estilos para hover */
        '.hover-effect': {
          '@apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200': {}
        },

        /* Estilos para inputs y formularios */
        '.input': {
          '@apply bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent rounded-lg p-2': {}
        },

        /* Estilos para botones */
        '.btn': {
          '@apply px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2': {}
        },
        '.btn-primary': {
          '@apply bg-primary hover:bg-primary/90 text-white focus:ring-primary/50': {}
        },
        '.btn-secondary': {
          '@apply bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus:ring-gray-500': {}
        },

        /* Estilos para badges o etiquetas */
        '.badge': {
          '@apply px-2 py-1 text-xs rounded-full': {}
        },
        '.badge-primary': {
          '@apply bg-primary/10 text-primary': {}
        },
        '.badge-success': {
          '@apply bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': {}
        },
        '.badge-warning': {
          '@apply bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300': {}
        },
        '.badge-danger': {
          '@apply bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300': {}
        },
      })
    }
  ],
}