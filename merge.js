const pdfMerger = require('pdf-merger-js');
const fs = require('fs');
const path = require('path');

async function mergePDFs(inputDir, outputFile = 'merged.pdf') {
    try {
        const merger = new pdfMerger.default();

        if (!fs.existsSync(inputDir)) {
            throw new Error(`folder ${inputDir} is not found`);
        }

        const files = fs.readdirSync(inputDir)
            .filter(file => path.extname(file).toLowerCase() === '.pdf')
            .sort((a, b) => {
                // fixed:
                const numA = parseInt((a.match(/\d+/)?.[0] || 0), 10);
                const numB = parseInt((b.match(/\d+/)?.[0] || 0), 10);
                return numA - numB;
            });

        if (files.length === 0) {
            throw new Error('no pdf-files in folder');
        }

        console.log(`found ${files.length} for merging`);

        for (const file of files) {
            const filePath = path.join(inputDir, file);
            console.log(`adding: ${file}`);
            await merger.add(filePath);
        }

        await merger.save(outputFile);
        console.log(`\nfile is saved as: ${outputFile}`);

    } catch (error) {
        console.error('error:', error.message);
        process.exit(1);
    }
}

const [inputDir = 'test123', outputFile = 'full-book.pdf'] = process.argv.slice(2);
mergePDFs(inputDir, outputFile);