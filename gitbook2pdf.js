const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertGitbookToPDF(baseUrl, outputDir = 'gitbook-pages') {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // make directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // 1. collect all links
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    const links = await page.evaluate((baseUrl) => {
        const cleanLinks = [];
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.href;
            if (href.startsWith(baseUrl) && 
                !href.includes('#') &&
                !href.endsWith('/edit') &&
                !cleanLinks.includes(href)) {
                cleanLinks.push(href);
            }
        });
        return cleanLinks;
    }, baseUrl);

    // 2. saving every page
    for (const [index, url] of links.entries()) {
        console.log(`Processing ${index + 1}/${links.length}: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // elements removal
            await page.evaluate(() => {
                const selectors = [
                    'nav', 
                    '.sidebar', 
                    '.footer', 
                    '[aria-label="Table of contents"]',
                    'iframe',
                    'button'
                ];
                selectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => el.remove());
                });
            });

            // generating filenames
            const fileName = url
                .replace(baseUrl, '')
                .replace(/\//g, '-')
                .replace(/^-+/, '') || 'index';
            
            await page.pdf({
                path: path.join(outputDir, `${fileName}.pdf`),
                format: 'A4',
                margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
                printBackground: true
            });
        } catch (error) {
            console.error(`Error processing ${url}:`, error.message);
        }
    }

    await browser.close();
    console.log(`All pages saved to: ${outputDir}`);
}

// startup
convertGitbookToPDF('https://test123.gitbook.io/docs', 'directory-name')
    .catch(console.error);
