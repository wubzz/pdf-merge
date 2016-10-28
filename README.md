# PDFMerge

PDFMerge is a node module used to merge PDF Files into a single PDF Document. It comes in three forms:

  - Buffer
  - ReadStream
  - New file on disk

Traditional callback-style as well as promise is supported.

### Requirements
PDFMerge is built using [PDFtk](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/) and as such it is a requirement in order for PDFMerge to work. PDFMerge will work on any platform supported by [PDFtk](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/).

### Installing PDFtk
#### Windows
Download and run the [Installer](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/).

#### Debian, Ubuntu
```
apt-get install pdftk
```
#### RPM
https://www.pdflabs.com/docs/install-pdftk-on-redhat-or-centos/


### Example
```javascript
var PDFMerge = require('pdf-merge');
var pdftkPath = 'C:\\PDFtk\\bin\\pdftk.exe';
var pdfFiles = [__dirname + '/pdf1.pdf', __dirname + '/pdf2.pdf'];
var pdfMerge = new PDFMerge(pdfFiles, pdftkPath);

pdfMerge
.asBuffer()
.merge(function(error, buffer) {
  //fs.writeFileSync(__dirname + '/merged.pdf', buffer);
});

```


### Usage
By default, pdf-merge will always return a Buffer of the merged PDF document. It does however support ReadStreams and Save-to-File as well. Read the API below.

**NOTE:** If you are on a Windows platform, you can specify the absolute path to `pdftk.exe`, but it is not necessary if PDFtk was properly installed and its path was added to PATH environment variable.

```javascript
var PDFMerge = require('pdf-merge');
var pdfMerge = new PDFMerge([files], pdftkPath);

//Callback-style
pdfMerge.merge(function(error, result) {
//Handle your error / result here
});

//Promise-style
pdfMerge.promise().then(function(result) {
//Handle result
}).catch(function(error) {
//Handle error
});
```

### API - Main
**merge(`error`, `~result~`)** -- Callback style. Result is mixed, see the Chainable Options below. By default, a Buffer is always returned.
```
var pdfMerge = new PDFMerge([...]);
pdfMerge.merge(function(error, result) {});
```

**promise()** -- Promise style. Result is mixed, see the Chainable Options below. By default, a Buffer is always returned.
```
var pdfMerge = new PDFMerge([...]);
pdfMerge.asReadStream().promise()
.then(function(readStream) {...})
.catch(function(error) {...});
```

### API - Chainable Settings
**asBuffer()** -- Result will be a Buffer of the merged PDF document.
```
var pdfMerge = new PDFMerge([...]);
pdfMerge.asBuffer().merge(function(error, buffer){...});
```

**asReadStream()** -- Result will be a ReadStream of the merged PDF document.
```
var pdfMerge = new PDFMerge([...]);
pdfMerge.asReadStream().merge(function(error, readStream) {...});
```

**asNewFile(`filePath`)** -- Store the output in a new file at the given filePath.
```
var pdfMerge = new PDFMerge([...]);
pdfMerge.asNewFile('merged.pdf').merge(function(error, filePath) {...});
```

**keepTmpFile()** -- Keep the temporary file that is created when running PDFtk. For whatever reason..
```
var pdfMerge = new PDFMerge([...]);
pdfMerge.keepTmpFile().merge(function(error, buffer) {...});
```