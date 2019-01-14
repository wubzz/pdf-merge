'use strict';

const fs        = require('fs');
const expect    = require('expect');
const Promise   = require('bluebird');
const PDFMerge  = require('../index');
const PDFParser = require("pdf2json");

try {
	require('rimraf').sync(`${__dirname}/files/out`)
} catch (error) {
}

fs.mkdirSync(`${__dirname}/files/out`);

const assertPageCount = (expected) => {
	return (buffer) => new Promise((resolve, reject) => {
		const pdfParser = new PDFParser();
		pdfParser.on("pdfParser_dataError", (error) => {
			reject(error);
		});

		pdfParser.on("pdfParser_dataReady", () => {
			try {
				expect(pdfParser.data.Pages.length).toEqual(expected);
				resolve();
			} catch (error) {
				reject(error);
			}
		});

		pdfParser.parseBuffer(buffer);
	});
};

const wildcard      = `${__dirname}/files/*.pdf`;
const pdf1          = `${__dirname}/files/1.pdf`;
const pdf2          = `${__dirname}/files/2.pdf`;
const pdfWithSpaces = `${__dirname}/files/with spaces.pdf`;
const pdfProtected  = {file: `${__dirname}/files/protected.pdf`, inputPw: '_SeCrEt_'};

describe('PDFMerge', () => {

	describe('Arguments', () => {
		it('Throws if files is not an array', () =>
			PDFMerge('Test', {})
				.then(() => {
					throw new Error('Should have thrown error')
				})
				.catch((error) => {
					expect(error instanceof TypeError).toEqual(true);
					expect(error.message).toEqual('Expected files to be an array of paths to PDF files.');

					return true;
				})
		);

		it('Throws if files is empty', () =>
			PDFMerge([], {})
				.then(() => {
					throw new Error('Should have thrown error')
				})
				.catch((error) => {
					expect(error instanceof Error).toEqual(true);
					expect(error.message).toEqual('No files were submitted for merging.');

					return true;
				})
		);

		it('Filters files array from values that are not strings or valid objects', () =>
			PDFMerge([Buffer.from([1]), null, undefined, [], {}, new Error()], {})
				.then(() => {
					throw new Error('Should have thrown error')
				})
				.catch((error) => {
					expect(error instanceof Error).toEqual(true);
					expect(error.message).toEqual('No files were submitted for merging.');

					return true;
				})
		);
	});

	describe('Buffer', () => {
    it('Can merge one document', () =>
      PDFMerge([pdf1], {})
        .then(assertPageCount(1))
    );

    it('Can merge using wildcard', () =>
      PDFMerge([wildcard], {})
        .then(assertPageCount(3))
    );

		it('Can merge two documents', () =>
			PDFMerge([pdf1, pdf2], {})
				.then(assertPageCount(2))
		);

		it('Can merge using same file multiple times', () =>
			PDFMerge([pdf1, pdf1, pdf1, pdf1, pdf2, pdf2], {})
				.then(assertPageCount(6))
		);

		it('Can merge files with filename containing spaces', () =>
			PDFMerge([pdf1, pdfWithSpaces], {})
				.then(assertPageCount(2))
		);

		it('Can merge document protected with password', () =>
			PDFMerge([pdf1, pdfProtected], {})
				.then(assertPageCount(2))
		);
	});

	describe('Stream', () => {
    it('Can merge one document', () =>
      PDFMerge([pdf1], {output: 'Stream'})
        .then((stream) =>
          assertPageCount(1)(stream.read())
        )
    );


    it('Can merge using wildcard document', () =>
      PDFMerge([wildcard], {output: 'Stream'})
        .then((stream) =>
          assertPageCount(3)(stream.read())
        )
    );

    it('Can merge two documents', () =>
			PDFMerge([pdf1, pdf2], {output: 'Stream'})
				.then((stream) =>
					assertPageCount(2)(stream.read())
				)
		);

		it('Can merge using same file multiple times', () =>
			PDFMerge([pdf1, pdf1, pdf1, pdf1, pdf2, pdf2], {output: 'Stream'})
				.then((stream) =>
					assertPageCount(6)(stream.read())
				)
		);

		it('Can merge files with filename containing spaces', () =>
			PDFMerge([pdf1, pdfWithSpaces], {output: 'Stream'})
				.then((stream) =>
					assertPageCount(2)(stream.read())
				)
		);

		it('Can merge document protected with password', () =>
			PDFMerge([pdf1, pdfProtected], { output: 'Stream' })
				.then((stream) =>
					assertPageCount(2)(stream.read())
				)
		);
	});

	describe('File', () => {
    it('Can merge one document', () =>
      PDFMerge([pdf1], {output: `${__dirname}/files/out/File1.pdf`})
        .then((buffer) => {
          expect(fs.existsSync(`${__dirname}/files/out/File1.pdf`)).toEqual(true);

          return assertPageCount(1)(buffer);
        })
    );

    it('Can merge using wildcard', () =>
      PDFMerge([wildcard], {output: `${__dirname}/files/out/wildcard.pdf`})
        .then((buffer) => {
          expect(fs.existsSync(`${__dirname}/files/out/wildcard.pdf`)).toEqual(true);

          return assertPageCount(3)(buffer);
        })
    );

		it('Can merge two documents', () =>
			PDFMerge([pdf1, pdf2], {output: `${__dirname}/files/out/File1.pdf`})
				.then((buffer) => {
					expect(fs.existsSync(`${__dirname}/files/out/File1.pdf`)).toEqual(true);

					return assertPageCount(2)(buffer);
				})
		);

		it('Can merge using same file multiple times', () =>
			PDFMerge([pdf1, pdf1, pdf1, pdf1, pdf2, pdf2], {output: `${__dirname}/files/out/File2.pdf`})
				.then((buffer) => {
					expect(fs.existsSync(`${__dirname}/files/out/File2.pdf`)).toEqual(true);

					return assertPageCount(6)(buffer);
				})
		);

		it('Can merge files with filename containing spaces', () =>
			PDFMerge([pdf1, pdfWithSpaces], {output: `${__dirname}/files/out/File3.pdf`})
				.then((buffer) => {
					expect(fs.existsSync(`${__dirname}/files/out/File3.pdf`)).toEqual(true);

					return assertPageCount(2)(buffer);
				})
		);

		it('Can merge document protected with password', () =>
			PDFMerge([pdf1, pdfProtected], {output: `${__dirname}/files/out/File3.pdf`})
			.then((buffer) => {
				expect(fs.existsSync(`${__dirname}/files/out/File3.pdf`)).toEqual(true);

				return assertPageCount(2)(buffer);
			})
		);
	});
});