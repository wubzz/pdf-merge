# PDFMerge

Merge multiple PDF Files into a single PDF document supporting three output formats: Buffer, Stream, New file on disk.

### Requirements
PDFMerge uses [PDFtk](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/) to merge the documents and as such it is a requirement in order for PDFMerge to work. It will work on any platform supported by [PDFtk](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/).
Starting from v1.0.0 a requirement of Node >= 4.0.0 is required as well. If you are stuck in the dark ages then `npm i pdf-merge@0.1.1` should still work.

### Installing PDFtk
#### Windows
Download and run the [Installer](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/).

#### Debian, Ubuntu
```
apt-get install pdftk
```
#### RPM
https://www.pdflabs.com/docs/install-pdftk-on-redhat-or-centos/

### Syntax
**PDFMerge(`files`, `options`)**

`files` is expected to be an array of files (must be full path for each respective file) or objects.

The file object have the follow options:
* `file` Full path of PDF file
* `inputPw` Password to decrypt a PDF *Optional!*


`options`:
* `libPath` Should only be provided if pdftk is not in your `PATH` *Optional!*
* `output` Defaults to `Buffer`. Values `Buffer`, `Stream`, and path to a *new file* are accepted. *Optional!*
* `execOptions` This is an optional string where you can pass additional argument to **pdftk**, for
example **compress**. For the complete list see the docu of the **pdftk**

### Examples
```javascript
const PDFMerge = require('pdf-merge');

const files = [
	`${__dirname}/1.pdf`,
	`${__dirname}/2.pdf`,
	{file: `${__dirname}/protected.pdf`, inputPw: '_SeCrEt_'}
];

//Buffer (Default)
PDFMerge(files)
.then((buffer) => {...});

//Stream
PDFMerge(files, {output: 'Stream'})
.then((stream) => {...});

//Save as new file
PDFMerge(files, {output: `${__dirname}/3.pdf`})
.then((buffer) => {...});
```
