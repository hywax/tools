import { eslint } from '@hywax/tools-eslint'

export default eslint(
  {
    typescript: true,
  },
  {
    rules: {
      'no-cond-assign': 'off',
    },
  },
)
