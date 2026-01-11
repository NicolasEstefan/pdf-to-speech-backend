# Notes

## Deleting audio fragmentes generated during tts

For deleting generated fragments, we can list files that start with a prefix, and iterate over the returned list, deleting each file.
The file deletion should not be resposibility of the download method of GcsService, instead it should be another method provided by GcsService, and the responsibility of deleting fragments should be on TtsService
