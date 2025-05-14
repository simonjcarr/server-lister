/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts with Ant Design
  },
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'inherit',
            h1: {
              fontSize: '1.75rem',
              marginTop: '1rem',
              marginBottom: '0.5rem',
              fontWeight: '700',
            },
            h2: {
              fontSize: '1.5rem',
              marginTop: '0.75rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
            },
            h3: {
              fontSize: '1.25rem',
              marginTop: '0.75rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
            },
            h4: {
              fontSize: '1.125rem',
              fontWeight: '600',
            },
            p: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            ul: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            ol: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            code: {
              color: '#c62828',
              backgroundColor: '#f5f5f5',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#202020',
              padding: '1rem',
              borderRadius: '0.5rem',
              margin: '1rem 0',
              code: {
                color: '#f8f8f2',
                backgroundColor: 'transparent',
                padding: '0',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}