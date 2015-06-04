var async = require('async');
var _ = require('underscore');
var tmp = require('tmp');
var os = require('os');
var child = require('child_process');
var fs = require('fs');
var Q = require('q');


/**
 * Return a new instance of PDFMerge
 * @param pdfFiles
 * @param pdftkPath
 * @returns {PDFMerge}
 * @constructor
 */
function PDFMerge(pdfFiles, pdftkPath) {
    if(!_(pdfFiles).isArray()) {
        throw new Error('pdfFiles must be an array of absolute file paths.');
    }

    //Windows: Demand path to lib
    if(isWindowsPlatform()) {
        this.exec = child.execFile;
        if(!pdftkPath || !fs.existsSync(pdftkPath)) {
            throw new Error('Path to PDFtk is incorrect.');
        }
        this.pdftkPath = pdftkPath;
        this.isWin = true;
    } else {
        this.exec = child.exec;
    }

    //Array of files
    this.pdfFiles = pdfFiles;

    //Get an available temporary filePath to be used in PDFtk
    this.tmpFilePath = tmp.tmpNameSync();

    //Setup Arguments to be used when calling PDFtk
    this.execArgs = assembleExecArgs.call(this);

    //Default Mode 'BUFFER';
    this.mode = 'BUFFER';

    //Default dont keep the temporary file
    this.keepFile = false;

    return this;
}

/**
 * Windows or not?
 * @returns {boolean}
 */
function isWindowsPlatform() {
    return os.platform().indexOf('win') !== -1;
}

/**
 * Arguments for running PDFtk
 * @returns {*}
 */
function assembleExecArgs() {
    var tmpFilePath = this.tmpFilePath;
    return _(this.pdfFiles).union([
        'cat',
        'output',
        tmpFilePath
    ]);
}

/**
 * Tells PDFMerge that we want a Buffer as our end result.
 * @returns {PDFMerge}
 */
PDFMerge.prototype.asBuffer = function() {
    this.mode = 'BUFFER';
    return this;
};

/**
 * Tells PDFMerge that we want a ReadStream as our end result.
 * @returns {PDFMerge}
 */
PDFMerge.prototype.asReadStream = function() {
    this.mode = 'READSTREAM';
    return this;
};

/**
 * Tells PDFMerge that we wish to store the merged PDF file as a new File, at given path.
 * @param path
 */
PDFMerge.prototype.asNewFile = function(path) {
    this.mode = 'NEWFILE';
    this.newFilePath = path;
    return this;
};


/**
 * Tells PDFMerge to keep the temporary PDF file created by 'merge'
 */
PDFMerge.prototype.keepFile = function() {
    this.keepFile = true;
    return true;
};

/**
 * Run PDFMerge as a promise.
 */
PDFMerge.prototype.promise = function() {
    var def = Q.defer();

    this.merge(function(error, result) {
        if(error) {
            return def.reject(error);
        }

        def.resolve(result);
    });

    return def.promise;
};

/**
 * Main function that runs the PDFtk merge command.
 * @param callback
 */
PDFMerge.prototype.merge = function(callback) {
    var mode = this.mode;
    var keepFile = this.keepFile; //Keep the Tmp File?
    var tmpFilePath = this.tmpFilePath; //Filepath for PDF file being created by PDFtk
    var newFilePath = this.newFilePath; //MODE === 'NEWFILE'

    //Windows or not, different syntax
    if(this.isWin) {
        this.exec(this.pdftkPath, this.execArgs, execCallbackHandler)
    } else {
        this.exec('pdftk ' + this.execArgs.join(' '), execCallbackHandler);
    }

    /**
     * ErrorHandler for when PDFtk has been executed.
     * @param error
     * @returns {*}
     */
    function execCallbackHandler(error) {
        if(error) {
            return callback(error);
        }

        /**
         * BUFFER/NEWFILE processed the same way.
         * For NEWFILE, it stores the buffer in a new file.
         */
        if(mode === 'BUFFER' || mode === 'NEWFILE') {
            fs.readFile(tmpFilePath, function(error, buffer) {
                if(error) {
                    return callback(error);
                }
                deleteFile();

                if(mode !== 'NEWFILE') {
                    return callback(null, buffer);
                }

                fs.writeFile(newFilePath, buffer, function(error) {
                    return callback(error, newFilePath);
                })
            });
        } else if(mode === 'READSTREAM') {
            var readStream = fs.createReadStream(tmpFilePath);
            callback(null, readStream);
            readStream.on('end', function() {
                deleteFile();
            });
        }
    }

    /**
     * Cleanup the temporary file created through PDFtk.
     * Don't cleanup if keepFile === true
     */
    function deleteFile() {
        if(!keepFile) {
            fs.unlink(tmpFilePath, function() {});
        }
    }
};

module.exports = PDFMerge;