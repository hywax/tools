import type { Options as ExecaOptions, ResultPromise } from 'execa'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { release } from '@vitejs/release-scripts'
import { execa } from 'execa'

function run<EO extends ExecaOptions>(
  bin: string,
  args: string[],
  opts?: EO,
): ResultPromise<
  EO & (keyof EO extends 'stdio' ? object : { stdio: 'inherit' })
  > {
  return execa(bin, args, { stdio: 'inherit', ...opts }) as any
}

async function getLatestTag(pkgName: string): Promise<string> {
  const pkgJson = JSON.parse(
    await readFile(`packages/${pkgName}/package.json`, 'utf-8'),
  )
  const version = pkgJson.version
  return `${pkgName}@${version}`
}

async function logRecentCommits(pkgName: string): Promise<void> {
  const tag = await getLatestTag(pkgName)
  if (!tag) {
    return
  }
  const sha = await run('git', ['rev-list', '-n', '1', tag], {
    stdio: 'pipe',
  }).then((res) => res.stdout.trim())

  console.log(`\n Commits of ${pkgName} since ${tag} (${sha.slice(0, 5)})`)

  await run(
    'git',
    [
      '--no-pager',
      'log',
      `${sha}..HEAD`,
      '--oneline',
      '--',
      `packages/${pkgName}`,
    ],
    { stdio: 'inherit' },
  )
  console.log()
}

function extendCommitHash(path: string): void {
  let content = readFileSync(path, 'utf-8')
  const base = 'https://github.com/hywax/tools/commit/'
  const matchHashReg = new RegExp(`${base}(\\w{7})\\)`, 'g')
  console.log(`\nextending commit hash in ${path}...`)
  let match
  while ((match = matchHashReg.exec(content))) {
    const shortHash = match[1]
    try {
      const longHash = execSync(`git rev-parse ${shortHash}`).toString().trim()
      content = content.replace(`${base}${shortHash}`, `${base}${longHash}`)
    } catch {}
  }
  writeFileSync(path, content)
  console.log(`${path} update success!`)
}

release({
  repo: 'tools',
  packages: ['eslint', 'tsconfig'],
  toTag: (pkg, version) => `${pkg}@${version}`,
  logChangelog: (pkg) => logRecentCommits(pkg),
  generateChangelog: async (pkgName) => {
    console.log('Generating changelog...')
    const changelogArgs = [
      'conventional-changelog',
      '-p',
      'angular',
      '-i',
      'CHANGELOG.md',
      '-s',
      '--commit-path',
      '.',
    ]
    if (pkgName !== 'vite') {
      changelogArgs.push('--lerna-package', pkgName)
    }
    await run('npx', changelogArgs, { cwd: `packages/${pkgName}` })
    extendCommitHash(`packages/${pkgName}/CHANGELOG.md`)
  },
})
