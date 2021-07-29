const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

module.exports = {
    darkMode: false, // or 'media' or 'class'
    important: true,
    theme: {
        linearBorderGradients: {
            directions: {
                // defaults to these values
                t: 'to top',
                tr: 'to top right',
                r: 'to right',
                br: 'to bottom right',
                b: 'to bottom',
                bl: 'to bottom left',
                l: 'to left',
                tl: 'to top left'
            },
            colors: {
                'blue-pink': ['#88d7b0', '#1e9ab6'],
                'pink-red-light-brown': ['#88d7b0', '#1e9ab6', '#044d29'],
                'light-blue-dark': ['#044d29', '#1e9ab6', '#88d7b0']
            },
            background: {
                'dark-1000': '#044d29',
                'dark-900': '#c1ead6',
                'dark-800': '#c1ead6',
                'dark-pink-red': '#e7f7ef'
            },
            border: {
                // defaults to these values (optional)
                '1': '1px',
                '2': '2px',
                '4': '4px'
            }
        },
        colors: {
            ...defaultTheme.colors,
            red: '#FF3838',
            blue: '#1E9AB6',
            pink: '#223b55',
            purple: '#c1ead6',
            green: '#BEDECB',
            darkgreen: '#044d29',
            yellow: '#fbc309',

            'pink-red': '#FE5A75',
            'light-brown': '#FEC464',
            'light-yellow': '#FFD166',
            'cyan-blue': '#1e9ab6',
            'dark-blue': '#0f4d5b',
            'l-blue': '#a5d6e1',
            'dark-pink': '#FE5A75',
            'dark-1000': '#bedecb',
            'dark-900': '#f5fbf8',
            'dark-850': '#ecf8f2',
            'dark-800': '#e7f7ef',
            'dark-700': '#c1ead6',
            'dark-600': '#1C2D49',
            'dark-500': '#223D5E',
            'dark-400': '#88d7b0',
            'dark-300': '#044d29',
            // TODO: bad... these are causing issues with text colors
            // 'high-emphesis': '#044D29',
            primary: '#044D29',
            secondary: '#223B55',
            'low-emphesis': '#575757'
        },
        screens: {
            sm: '480px',
            md: '768px',
            lg: '976px',
            xl: '1440px'
        },
        fontSize: {
            ...defaultTheme.fontSize,
            hero: [
                '48px',
                {
                    letterSpacing: '-0.02em;',
                    lineHeight: '96px',
                    fontWeight: 700
                }
            ],
            h1: [
                '36px',
                {
                    letterSpacing: '-0.02em;',
                    lineHeight: '36px',
                    fontWeight: 700
                }
            ],
            h2: [
                '30px',
                {
                    letterSpacing: '-0.01em;',
                    lineHeight: '36px',
                    fontWeight: 700
                }
            ],
            h3: [
                '28px',
                {
                    letterSpacing: '-0.01em;',
                    lineHeight: '30px',
                    fontWeight: 700
                }
            ],
            h4: [
                '24px',
                {
                    letterSpacing: '-0.01em;',
                    lineHeight: '28px',
                    fontWeight: 700
                }
            ],
            h5: [
                '24px',
                {
                    letterSpacing: '-0.01em;',
                    lineHeight: '28px',
                    fontWeight: 500
                }
            ],
            body: [
                '18px',
                {
                    letterSpacing: '-0.01em;',
                    lineHeight: '26px'
                }
            ],
            caption: [
                '16px',
                {
                    lineHeight: '24px'
                }
            ],
            caption2: [
                '14px',
                {
                    lineHeight: '20px'
                }
            ]
        },
        extend: {
            lineHeight: {
                ...defaultTheme.lineHeight,
                '48px': '48px'
            },
            backgroundImage: theme => ({
                ...defaultTheme.backgroundImage,
                'alpine-hero': "url('/src/assets/goldvein/alpine-hero.jpg')",
                'alpine-logo': "url('/src/assets/goldvein/alpine-logo.png')"
            }),
            fontFamily: {
                sans: ['DM Sans', ...defaultTheme.fontFamily.sans]
            },
            borderRadius: {
                ...defaultTheme.borderRadius,
                none: '0',
                px: '1px',
                sm: '0.313rem',
                DEFAULT: '0.625rem'
            },
            textColor: {
                ...defaultTheme.textColor,
                'low-emphesis': '#575757',
                primary: '#044D29',
                secondary: '#223B55',
                'high-emphesis': '#044D29'
            },
            backgroundColor: {
                ...defaultTheme.backgroundColor,
                input: '#ecf8f2'
            },
            boxShadow: {
                ...defaultTheme.boxShadow,
                'pink-glow': '0px 57px 90px -47px rgba(250, 82, 160, 0.15)',
                'blue-glow': '0px 57px 90px -47px rgba(39, 176, 230, 0.17)',
                'pink-glow-hovered': '0px 57px 90px -47px rgba(250, 82, 160, 0.30)',
                'blue-glow-hovered': '0px 57px 90px -47px rgba(251, 195, 9, 0.34)',

                'swap-blue-glow': '0px 50px 250px -47px rgba(251, 195, 9, 0.38)',
                'liquidity-purple-glow': '0px 50px 250px -47px rgba(251, 195, 9, 0.29);'
            },
            ringWidth: {
                ...defaultTheme.ringWidth,
                DEFAULT: '1px'
            },
            padding: {
                ...defaultTheme.padding,
                px: '1px',
                '3px': '3px'
            },
            outline: {
                ...defaultTheme.outline,
                'low-emphesis': '#575757'
            },
            animation: {
                ellipsis: ' ellipsis 1.25s infinite'
            },
            keyframes: {
                ellipsis: {
                    '0%': { content: '"."' },
                    '33%': { content: '".."' },
                    '66%': { content: '"..."' }
                }
            },
            minHeight: {
                cardContent: '230px',
                fitContent: 'fit-content'
            }
        }
    },
    variants: {
        linearBorderGradients: ['responsive', 'hover', 'dark'], // defaults to ['responsive']
        extend: {
            backgroundColor: ['checked', 'disabled'],
            backgroundImage: ['hover', 'focus'],
            borderColor: ['checked', 'disabled'],
            cursor: ['disabled'],
            opacity: ['hover', 'disabled'],
            placeholderColor: ['hover', 'active'],
            ringWidth: ['disabled'],
            ringColor: ['disabled']
        }
    },
    plugins: [
        // require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/aspect-ratio'),
        require('tailwindcss-border-gradient-radius'),
        plugin(function({ addUtilities }) {
            addUtilities({
                '.gradient-border-bottom': {
                    background:
                        'linear-gradient(to right, rgba(136, 215, 176, 0.2) 0%, rgba(30, 154, 182, 0.2) 0%, rgba(4, 77, 41, 0.2) 100%) left bottom no-repeat',
                    backgroundSize: '100% 1px'
                }
            })
        }),
        plugin(function({ addUtilities }) {
            addUtilities(
                {
                    '.border-gradient': {
                        border: 'double 1px transparent',
                        borderRadius: '0.375rem',
                        backgroundImage:
                            'linear-gradient(#88d7b0, #1e9ab6), linear-gradient(to right, #88d7b0, #1e9ab6)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }
                },
                {
                    variants: ['responsive']
                }
            )
        })
    ],
    corePlugins: {
        fontFamily: true,
        preflight: true
    },
    purge: process.env.NODE_ENV !== 'development' ? ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'] : false
}
