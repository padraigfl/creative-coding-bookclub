import fs from 'fs'
import { execSync } from 'child_process'
import { validatePathsAreInScope, validateFilePath } from '../../src/utils/validation.js'
import { REPO_PATH } from '../../src/constants.js'

const GREETINGS = ['Hi', 'Hola', 'Ciao']

const GREETING_MSG = 'I am the Bookclub Bot 🤖📚'

function main() {
  const openPullRequests =
    // List Open Pull Requests
    execSync(
      `gh pr list --json number,headRefName,baseRefName,author --jq '.[] | select(.baseRefName == "main") | .number'`,
    )
      ?.toString()
      ?.split('\n')
      ?.filter(Boolean) ?? []
  console.log(`Batch reviewing ${openPullRequests.length} open Pull Requests`)

  // Read Creative Coding Bookclub Config
  const CCB_CONFIG_PATH = 'ccb.json'
  const ccbConfig = JSON.parse(fs.readFileSync(CCB_CONFIG_PATH, 'utf8'))

  if (openPullRequests.length === 0) {
    console.log('No Ps to review')
  }

  for (let i = 0; i < openPullRequests.length; i++) {
    const prNumber = openPullRequests[i]
    console.log(`Checking PR ${prNumber}...`)

    const prInfo = JSON.parse(execSync(`gh pr view ${prNumber} --json headRefOid`).toString())
    const prAuthor = execSync(`gh api "/repos/${REPO_PATH}/pulls/${prNumber}" --jq ".user.id"`)
      .toString()
      .trim()
    const prHeadSha = prInfo.headRefOid
    const prBaseSha = execSync(`git merge-base origin/main ${prHeadSha}`).toString().trim()

    const member = ccbConfig.members.find((member) => member.id === prAuthor)

    // Ensure Author of the PR is a bookclub member
    if (!member) {
      console.log(`Skipping PR ${prNumber} - Author '${prAuthor}' is not a trusted member`)
      continue
    }

    const randomGreeting = Math.floor(Math.random() * GREETINGS.length)
    try {
      reviewMemberPR(member, prHeadSha, prBaseSha)
      console.log(`PR ${prNumber} passed checks.`)
      const msg = [
        `${GREETINGS[randomGreeting]} @${prAuthor}! ${GREETING_MSG}`,
        'This PR was made by a trusted member and only modifies files under their scope.',
        'All modified files passed the automated test ✅',
        "Merging to 'main' branch ✨",
      ].join('\n')
      fs.writeFileSync('pr-comment.md', msg)
      execSync(`gh pr comment ${prNumber} --body-file pr-comment.md`)
      execSync(`gh pr merge ${prNumber} --merge --admin`)
    } catch (error) {
      console.log(`PR ${prNumber} failed checks`)
      const msg = [
        `${GREETINGS[randomGreeting]} @${prAuthor}! ${GREETING_MSG}`,
        'Sorry, but this PR has failed validation, and cannot be automatically merged',
        ' ',
        '```',
        error,
        '```',
        "I'll be back for another review in 12 hours!",
        'See ya!',
      ].join('\n')
      fs.writeFileSync('pr-comment.md', msg)
      execSync(`gh pr comment ${prNumber} --body-file pr-comment.md`)
    }
  }
}

function reviewMemberPR(member, prHeadSha, prBaseSha) {
  const scope = `src/members/${member.alias}`
  console.log(`PR Author '${member.id}' is a member with scope: '${scope}'`)

  const modifiedFiles = execSync(`git diff --name-only ${prBaseSha} ${prHeadSha}`)
    .toString()
    .split('\n')
    .filter(Boolean)

  validatePathsAreInScope(modifiedFiles, scope)
  console.log(`Running path checks for ${modifiedFiles.length} path/s`)
  for (let i = 0; i < modifiedFiles.length; i++) {
    validateFilePath(modifiedFiles[i])
  }
}

main()
