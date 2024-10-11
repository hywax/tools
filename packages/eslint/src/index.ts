import type { Rules } from '@antfu/eslint-config'
import antfu from '@antfu/eslint-config'

export type EslintConfig = ReturnType<typeof antfu>
export type OptionsConfig = Parameters<typeof antfu>[0]
export type UserConfig = Parameters<typeof antfu>[1]

export function eslint(options: OptionsConfig = {}, ...configs: UserConfig[]): EslintConfig {
  const defaultRules: Rules = {
    'style/brace-style': ['error', '1tbs'],
    'style/arrow-parens': ['error', 'always'],
    'curly': ['error', 'all'],
    'antfu/consistent-list-newline': 'off',
  }

  if (typeof options.vue === 'boolean' && options.vue) {
    configs.unshift({
      rules: {
        'ts/consistent-type-definitions': 'off',
        'vue/block-order': ['error', {
          order: ['template', 'script', 'style'],
        }],
      },
    })
  }

  return antfu(
    { ...options, rules: { ...defaultRules } },
    ...configs,
  )
}
