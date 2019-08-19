'use strict';

const fs          = require('fs');
const os          = require('os');
const tmp         = require('tmp');
const child       = require('child_process');
const Promise     = require('bluebird');
const PassThrough = require('stream').PassThrough;
const shellescape = require('shell-escape');

const exec      = Promise.promisify(child.exec);
const readFile  = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

const isWindows = os.platform() === 'win32';

const genHandle = (num) => {
  let s = '', t;

  while (num > 0) {
    t = (num - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    num = (num - t) / 26 | 0;
  }
  return s;
}

module.exports = (files, options) => new Promise((resolve, reject) => {
  if (!Array.isArray(files)) {
    reject(new TypeError('Expected files to be an array of paths to PDF files.'));

    return;
  }

  files = files
    .map((file) => typeof file === 'string' ? ({ file }) : file)
    // Object.keys(file)[0] !== '0' -> Check if is not a Buffer object
    .filter((file) => (file !== null && typeof file === 'object' && Object.keys(file)[0] !== '0' && typeof file.file === 'string'));
  if (files.length === 0) {
    reject(new Error('No files were submitted for merging.'));

    return;
  }

  const isBufferOutput = () => {
    return options.output === Buffer || String(options.output).toUpperCase() === 'BUFFER';
  };

  const isStreamOutput = () => {
    return options.output === PassThrough || ['STREAM', 'READSTREAM'].indexOf(String(options.output).toUpperCase()) !== -1;
  };

  const output = (streamOrBuffer) => {
    if (isBufferOutput() || isStreamOutput()) {
      return streamOrBuffer;
    }

    return writeFile(options.output, streamOrBuffer)
      .then(() => streamOrBuffer);
  };

  options = Object.assign({
    libPath: 'pdftk',
    output: Buffer,
  }, options);

  if (files.length === 1) {
    const fileObjKeys = Object.keys(files[0])
    if (fileObjKeys.length === 1 && fileObjKeys[0] === 'file') {
      if (isStreamOutput()) {
        const stream = fs.createReadStream(files[0].file);
        resolve(output(stream));
        return;
      }

      readFile(files[0].file)
        .then((buffer) => {
          return output(buffer);
        })
        .then(resolve)
        .catch(reject);

      return;
    }
  }

  const tmpFilePath = isWindows
    ? tmp.tmpNameSync()
    : shellescape([tmp.tmpNameSync()]);

  const inputPws = []
  const args = files.map((value, idx) => {
    let file = value.file;

    let handle = null;
    // Check if we need use handles
    if (typeof value.inputPw === 'string' && value.inputPw.length > 0) {
      handle = genHandle(idx + 1);
      inputPws.push({ handle, inputPw: value.inputPw });
      file = `${handle}=${file}`;
    }

    return isWindows
      ? `"${file}"`
      : shellescape([file.replace(/\\/g, '/')]);
  })

  if (inputPws.length > 0) {
    args.push('input_pw');
    Array.prototype.push.apply(args, inputPws.map(item => `${item.handle}=${item.inputPw}`));
  }

  args.push('cat', 'output', tmpFilePath);

  if (options.execOptions) {
    args.push(options.execOptions);
  }

  const childPromise = (isWindows && options.libPath !== 'pdftk')
    ? exec(`"${options.libPath}" ${args.join(' ')}`)
    : exec(`${options.libPath} ${args.join(' ')}`);


  const unlinkTempFile = (buffer) => {
    return new Promise((resolve) => {
      fs.unlink(tmpFilePath, () => resolve(buffer));
    })
  };

  childPromise.then(() => {
    if (isStreamOutput()) {
      const stream = fs.createReadStream(tmpFilePath);
      stream.on('end', () => unlinkTempFile());
      return stream;
    }

    return readFile(tmpFilePath).then(unlinkTempFile)
  })
    .then((streamOrBuffer) => output(streamOrBuffer))
    .then(resolve)
    .catch(reject);

});
