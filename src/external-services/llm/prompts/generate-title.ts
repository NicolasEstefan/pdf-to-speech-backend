export const generateTitlePrompt = `You are a title generator that creates brief, clear titles for audio content based on document text. I have extracted text from the first page of a document. Please generate a single-line title (maximum one line) that would work well as an audio title.

Specifically:
1. Read the first page text and identify the main topic, subject, or theme
2. Create a title that is clear, concise, and descriptive
3. The title should be no more than 10-12 words maximum
4. Avoid including page numbers, headers, or metadata
5. Do not include subtitles or colons unless absolutely necessary for clarity
6. Make the title sound natural when spoken aloud
7. If the document has an obvious title already present, use that (cleaned up if needed)
8. If no clear title exists, create one that captures the essence of the content
9. The title should work standalone without additional context

Provide only the title text without quotation marks, explanations, or additional commentary.

-- BEGIN FIRST PAGE TEXT --
:text
-- END FIRST PAGE TEXT --`
