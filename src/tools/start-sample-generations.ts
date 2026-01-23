import inquirer from 'inquirer'
import axios from 'axios'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Language } from '../generations/types/language.enum'
import { Speaker } from '../external-services/tts/types/speaker.enum'
import FormData from 'form-data'
import chalk from 'chalk'

const API_URL = 'http://localhost:3000'

interface GenerationConfig {
  language: Language
  speakers: Speaker[]
  accessToken: string
}

async function main() {
  console.log(
    chalk.blue.bold('\n🎙️  PDF to Speech - Sample Generations Tool\n'),
  )

  // Step 1: Ask for access token
  const { accessToken } = await inquirer.prompt<{ accessToken: string }>([
    {
      type: 'password',
      name: 'accessToken',
      message: 'Enter your access token:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Access token is required'
        }
        return true
      },
    },
  ])

  // Step 2: Select language
  const { language } = await inquirer.prompt<{ language: Language }>([
    {
      type: 'select',
      name: 'language',
      message: 'Select the language:',
      choices: [
        { name: 'English', value: Language.ENGLISH },
        { name: 'Spanish', value: Language.SPANISH },
      ],
    },
  ])

  // Step 3: Select speakers
  const speakerChoices = Object.values(Speaker).map((speaker) => ({
    name: speaker,
    value: speaker,
  }))

  const { speakers } = await inquirer.prompt<{ speakers: Speaker[] }>([
    {
      type: 'checkbox',
      name: 'speakers',
      message: 'Select speakers (use space to select, enter to confirm):',
      choices: speakerChoices,
      validate: (input: Speaker[]) => {
        if (input.length === 0) {
          return 'You must select at least one speaker'
        }
        return true
      },
    },
  ])

  // Step 4: Confirm and start generations
  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Start ${speakers.length} generation(s) in ${language}?`,
      default: true,
    },
  ])

  if (!confirm) {
    console.log(chalk.yellow('\n❌ Generations cancelled\n'))
    return
  }

  const config: GenerationConfig = {
    language,
    speakers,
    accessToken,
  }

  await startGenerations(config)
}

async function startGenerations(config: GenerationConfig) {
  const { language, speakers, accessToken } = config

  // Determine which PDF file to use based on language
  const pdfFileName =
    language === Language.ENGLISH
      ? 'pdf-to-speech-sample-english.pdf'
      : 'pdf-to-speech-sample-spanish.pdf'

  const pdfFilePath = join(__dirname, pdfFileName)

  console.log(chalk.blue(`\n📄 Using PDF: ${pdfFileName}\n`))

  let successCount = 0
  let failureCount = 0

  // Start generations for each selected speaker
  for (const speaker of speakers) {
    try {
      console.log(
        chalk.cyan(`🚀 Starting generation for speaker: ${speaker}...`),
      )

      const pdfBuffer = await readFile(pdfFilePath)
      const formData = new FormData()

      formData.append('file', pdfBuffer, {
        filename: pdfFileName,
        contentType: 'application/pdf',
      })
      formData.append('language', language)
      formData.append('speaker', speaker)

      await axios.post(`${API_URL}/generations`, formData, {
        headers: {
          ...formData.getHeaders(),
          Cookie: `access_token=${accessToken}`,
        },
      })

      console.log(
        chalk.green(`✅ Successfully started generation for ${speaker}\n`),
      )
      successCount++
    } catch (error) {
      console.log(chalk.red(`❌ Failed to start generation for ${speaker}`))

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.log(chalk.red(`   Status: ${error.response.status}`))
          console.log(
            chalk.red(`   Error: ${JSON.stringify(error.response.data)}`),
          )
        } else if (error.request) {
          console.log(chalk.red(`   No response received from server`))
        } else {
          console.log(chalk.red(`   Error: ${error.message}`))
        }
      } else {
        console.log(chalk.red(`   Error: ${error}`))
      }

      console.log('')
      failureCount++
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 Summary:'))
  console.log(chalk.green(`   ✅ Successful: ${successCount}`))
  console.log(chalk.red(`   ❌ Failed: ${failureCount}`))
  console.log(chalk.blue(`   📝 Total: ${speakers.length}\n`))
}

main().catch((error) => {
  console.error(chalk.red('\n❌ An error occurred:'), error)
  process.exit(1)
})
