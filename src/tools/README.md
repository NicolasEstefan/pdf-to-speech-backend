# PDF to Speech - Sample Generations Tool

This directory contains a CLI tool to easily start sample generations for testing purposes.

## Tool: start-sample-generations.ts

An interactive CLI tool that allows you to start multiple audio generations using the sample PDFs.

### Features

- 🌐 **Language Selection**: Choose between English or Spanish
- 🎙️ **Multiple Speakers**: Select one or more speakers for generation
- 🔐 **Authentication**: Uses access token with cookie-based authentication
- 📊 **Progress Tracking**: Shows real-time progress and summary of results
- ✨ **Interactive UI**: Uses inquirer for a user-friendly command-line interface

### Prerequisites

1. The server must be running on `localhost:3000`
2. You need a valid access token for authentication
3. Sample PDF files must be present in this directory:
   - `pdf-to-speech-sample-english.pdf`
   - `pdf-to-speech-sample-spanish.pdf`

### Getting an Access Token

To obtain an access token for authentication:

1. **Start the server**: Make sure the backend server is running
   ```bash
   npm run start:dev
   ```

2. **Authenticate**: Log in through the application's authentication flow (e.g., Google OAuth or other configured method)

3. **Extract the token**: 
   - Open your browser's developer tools (F12)
   - Go to the Application/Storage tab
   - Find the `access_token` cookie
   - Copy its value

Alternatively, if you have direct database access, you can generate a JWT token manually for testing purposes.

### Usage

Run the tool using npm:

```bash
npm run tool:sample-generations
```

Or directly with ts-node:

```bash
NODE_ENV=development ts-node -r tsconfig-paths/register src/tools/start-sample-generations.ts
```

### Interactive Steps

The tool will guide you through the following steps:

1. **Enter Access Token**: Provide your authentication token (input is hidden)
2. **Select Language**: Choose either English or Spanish
3. **Select Speakers**: Choose one or more speakers from the available list
4. **Confirm**: Review your selections and confirm to start generations
5. **View Progress**: Watch as generations are started for each selected speaker
6. **See Summary**: Review the final summary of successful and failed generations

### Example Session

```
🎙️  PDF to Speech - Sample Generations Tool

? Enter your access token: [hidden]
? Select the language: English
? Select speakers (use space to select, enter to confirm): 
  ◉ Achernar
  ◉ Algieba
  ◯ Alnilam
  ...
? Start 2 generation(s) in english? Yes

📄 Using PDF: pdf-to-speech-sample-english.pdf

🚀 Starting generation for speaker: Achernar...
✅ Successfully started generation for Achernar

🚀 Starting generation for speaker: Algieba...
✅ Successfully started generation for Algieba

📊 Summary:
   ✅ Successful: 2
   ❌ Failed: 0
   📝 Total: 2
```

### Error Handling

The tool provides detailed error messages if something goes wrong:

- Authentication errors (invalid or expired token)
- Network errors (server not running)
- Validation errors (invalid file format, etc.)

Each error includes:
- HTTP status code (if applicable)
- Error message from the server
- Clear indication of which generation failed

### Technical Details

- **API Endpoint**: `POST http://localhost:3000/generations`
- **Authentication**: Cookie-based using `access_token` cookie
- **Request Format**: `multipart/form-data` with:
  - `file`: PDF file buffer
  - `language`: Selected language (english/spanish)
  - `speaker`: Selected speaker name

### Available Speakers

The tool supports all speakers from the `Speaker` enum:
- Achernar, Achird, Algenib, Algieba, Alnilam, Aoede, Autonoe, Callirrhoe
- Charon, Despina, Enceladus, Erinome, Fenrir, Gacrux, Iapetus, Kore
- Laomedeia, Leda, Orus, Pulcherrima, Puck, Rasalgethi, Sadachbia
- Sadaltager, Schedar, Sulafat, Umbriel, Vindemiatrix, Zephyr, Zubenelgenubi

### Notes

- One generation request is made per selected speaker
- Generations are started sequentially (not in parallel)
- The tool will continue even if some generations fail
- A summary is shown at the end with success/failure counts
