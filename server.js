const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Resend email configuration
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Gold/brown color from template
const GOLD_COLOR = '#A27339';

// Generate T&M Report PDF matching the example exactly
async function generateTMReportPDF(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            size: 'LETTER',
            margins: { top: 60, bottom: 60, left: 60, right: 60 }
        });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const leftMargin = 60;
        const pageWidth = 612 - 120; // Letter width minus margins
        let y = 60;

        // Logo on the left
        try {
            const logoPath = path.join(__dirname, 'CBlogo_transparent_backgrd_1000x1000px.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, leftMargin, y, { width: 80 });
            }
        } catch (error) {
            console.log('Logo not found');
        }

        // Company info on the right side
        doc.fontSize(12).font('Helvetica-Bold')
           .fillColor(GOLD_COLOR)
           .text('A & J CALIFORNIA BUILDERS, INC.', leftMargin + 100, y);
        
        doc.fontSize(9).font('Helvetica').fillColor('#000000')
           .text('1261 Lincoln Avenue, Suite 106', leftMargin + 100, y + 15)
           .text('San José, CA 95125', leftMargin + 100, y + 28)
           .text('Office 408.988.8739', leftMargin + 100, y + 41, { oblique: true })
           .text("California State Contractor's License # 949668", leftMargin + 100, y + 54, { oblique: true });

        y += 95;

        // Horizontal line
        doc.moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
        y += 20;

        // Title
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
           .text('T I M E  &  M A T E R I A L  R E P O R T', leftMargin, y, { 
               width: pageWidth, 
               align: 'center' 
           });
        y += 30;

        // Horizontal line
        doc.moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
        y += 20;

        // Project Info Section - SIMPLIFIED (no crew/hours/foreman)
        const col1 = leftMargin;
        const col2 = leftMargin + 250;

        // PROJECT NAME and PROJECT #
        doc.fontSize(9).font('Helvetica-Bold').fillColor(GOLD_COLOR);
        doc.text('PROJECT NAME', col1, y);
        doc.fillColor('#000000').font('Helvetica');
        doc.text(data.jobNumber.split(' - ')[1] || '', col1 + 100, y);
        
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold');
        doc.text('PROJECT #', col2, y);
        doc.fillColor('#000000').font('Helvetica');
        doc.text(data.jobNumber.split(' - ')[0] || '', col2 + 70, y);
        y += 20;

        // DATE
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold');
        doc.text('DATE', col1, y);
        doc.fillColor('#000000').font('Helvetica');
        doc.text(data.date, col1 + 100, y);
        y += 20;

        // LOCATION
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold');
        doc.text('LOCATION', col1, y);
        doc.fillColor('#000000').font('Helvetica');
        doc.text(data.projectAddress, col1 + 100, y, { width: 380 });
        y += 25;

        // GEN. CONTRACTOR / OWNER
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold');
        doc.text('GEN. CONTRACTOR /', col1, y);
        doc.text('OWNER', col1, y + 10);
        doc.fillColor('#000000').font('Helvetica');
        doc.text(data.generalContractor, col1 + 100, y);
        y += 30;

        // ADDRESS
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold');
        doc.text('ADDRESS', col1, y);
        doc.fillColor('#000000').font('Helvetica');
        doc.text(data.gcAddress || '', col1 + 100, y, { width: 380 });
        y += 35;

        // Table - NEW LAYOUT with LABOR COST column
        const tableTop = y;
        const descWidth = 170;    // Description column
        const dateWidth = 55;     // Date column
        const hoursWidth = 45;    // Hours column
        const laborWidth = 70;    // Labor cost column (NEW!)
        const materialWidth = 70; // Material cost column  
        const totalWidth = 82;    // Total column

        const descX = leftMargin;
        const dateX = descX + descWidth;
        const hoursX = dateX + dateWidth;
        const laborX = hoursX + hoursWidth;
        const materialX = laborX + laborWidth;
        const totalX = materialX + materialWidth;

        // Table header
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold').fontSize(8);
        doc.text('DESCRIPTION', descX + 3, tableTop + 5);
        doc.text('DATE', dateX + 3, tableTop + 5);
        doc.text('HOURS', hoursX + 3, tableTop + 5);
        doc.text('LABOR', laborX + 3, tableTop + 5);
        doc.text('COST', laborX + 3, tableTop + 12);
        doc.text('MATERIAL', materialX + 3, tableTop + 5);
        doc.text('COST', materialX + 3, tableTop + 12);
        doc.text('TOTAL', totalX + 3, tableTop + 5);

        // Draw header border
        doc.rect(descX, tableTop, descWidth, 20).stroke();
        doc.rect(dateX, tableTop, dateWidth, 20).stroke();
        doc.rect(hoursX, tableTop, hoursWidth, 20).stroke();
        doc.rect(laborX, tableTop, laborWidth, 20).stroke();
        doc.rect(materialX, tableTop, materialWidth, 20).stroke();
        doc.rect(totalX, tableTop, totalWidth, 20).stroke();

        y = tableTop + 20;

        doc.fillColor('#000000').font('Helvetica').fontSize(8);

        // First row: Work description (with dynamic height)
        const descStartY = y;
        const descText = data.workDescription || '';
        const descHeight = Math.max(18, Math.ceil(doc.heightOfString(descText, { width: descWidth - 6 }) + 8));
        
        doc.rect(descX, y, descWidth, descHeight).stroke();
        doc.text(descText, descX + 3, y + 4, { width: descWidth - 6 });
        doc.rect(dateX, y, dateWidth, descHeight).stroke();
        doc.rect(hoursX, y, hoursWidth, descHeight).stroke();
        doc.rect(laborX, y, laborWidth, descHeight).stroke();
        doc.rect(materialX, y, materialWidth, descHeight).stroke();
        doc.rect(totalX, y, totalWidth, descHeight).stroke();
        y += descHeight;

        // Second row: Crew info (e.g., "2 men")
        doc.rect(descX, y, descWidth, 18).stroke();
        doc.text(`${data.numMen} men`, descX + 3, y + 4);
        doc.rect(dateX, y, dateWidth, 18).stroke();
        doc.rect(hoursX, y, hoursWidth, 18).stroke();
        doc.text(data.totalHours || '', hoursX + 3, y + 4);
        doc.rect(laborX, y, laborWidth, 18).stroke();
        doc.rect(materialX, y, materialWidth, 18).stroke();
        doc.rect(totalX, y, totalWidth, 18).stroke();
        y += 18;

        // Materials rows (with dynamic height)
        if (data.materials && data.materials.length > 0) {
            data.materials.forEach(material => {
                const matDesc = material.qty ? `${material.qty} ${material.desc}` : material.desc;
                const fullText = `${matDesc}${material.supplier ? ` (${material.supplier})` : ''}`;
                const matHeight = Math.max(18, Math.ceil(doc.heightOfString(fullText, { width: descWidth - 6 }) + 8));
                
                doc.rect(descX, y, descWidth, matHeight).stroke();
                doc.text(fullText, descX + 3, y + 4, { width: descWidth - 6 });
                doc.rect(dateX, y, dateWidth, matHeight).stroke();
                doc.rect(hoursX, y, hoursWidth, matHeight).stroke();
                doc.rect(laborX, y, laborWidth, matHeight).stroke();
                doc.rect(materialX, y, materialWidth, matHeight).stroke();
                doc.rect(totalX, y, totalWidth, matHeight).stroke();
                y += matHeight;
            });
        }

        // Empty rows (5 to fill page)
        for (let i = 0; i < 5; i++) {
            doc.rect(descX, y, descWidth, 18).stroke();
            doc.rect(dateX, y, dateWidth, 18).stroke();
            doc.rect(hoursX, y, hoursWidth, 18).stroke();
            doc.rect(laborX, y, laborWidth, 18).stroke();
            doc.rect(materialX, y, materialWidth, 18).stroke();
            doc.rect(totalX, y, totalWidth, 18).stroke();
            y += 18;
        }

        // Equipment row
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold');
        doc.rect(descX, y, descWidth, 18).stroke();
        doc.text('Equipment', descX + 3, y + 4);
        doc.rect(dateX, y, dateWidth, 18).stroke();
        doc.rect(hoursX, y, hoursWidth, 18).stroke();
        doc.rect(laborX, y, laborWidth, 18).stroke();
        doc.rect(materialX, y, materialWidth, 18).stroke();
        doc.rect(totalX, y, totalWidth, 18).stroke();
        y += 18;

        // Equipment items
        doc.fillColor('#000000').font('Helvetica');
        if (data.equipment && data.equipment.length > 0) {
            data.equipment.forEach(equip => {
                doc.rect(descX, y, descWidth, 18).stroke();
                doc.text(equip.type || '', descX + 3, y + 4);
                doc.rect(dateX, y, dateWidth, 18).stroke();
                doc.rect(hoursX, y, hoursWidth, 18).stroke();
                doc.text(`${equip.hours}`, hoursX + 3, y + 4);
                doc.rect(laborX, y, laborWidth, 18).stroke();
                doc.rect(materialX, y, materialWidth, 18).stroke();
                doc.rect(totalX, y, totalWidth, 18).stroke();
                y += 18;
            });
        }

        // Totals section
        doc.fillColor(GOLD_COLOR).font('Helvetica-Bold');
        
        // SUBTOTAL
        doc.rect(descX, y, descWidth, 18).stroke();
        doc.text('SUBTOTAL', descX + 3, y + 4);
        doc.rect(dateX, y, dateWidth, 18).stroke();
        doc.rect(hoursX, y, hoursWidth, 18).stroke();
        doc.rect(laborX, y, laborWidth, 18).stroke();
        doc.rect(materialX, y, materialWidth, 18).stroke();
        doc.rect(totalX, y, totalWidth, 18).stroke();
        y += 18;

        // Profit and Overhead 15%
        doc.rect(descX, y, descWidth, 18).stroke();
        doc.text('Profit and Overhead 15%', descX + 3, y + 4);
        doc.rect(dateX, y, dateWidth, 18).stroke();
        doc.rect(hoursX, y, hoursWidth, 18).stroke();
        doc.rect(laborX, y, laborWidth, 18).stroke();
        doc.rect(materialX, y, materialWidth, 18).stroke();
        doc.rect(totalX, y, totalWidth, 18).stroke();
        y += 18;

        // TOTAL
        doc.rect(descX, y, descWidth, 18).stroke();
        doc.text('TOTAL', descX + 3, y + 4);
        doc.rect(dateX, y, dateWidth, 18).stroke();
        doc.rect(hoursX, y, hoursWidth, 18).stroke();
        doc.rect(laborX, y, laborWidth, 18).stroke();
        doc.rect(materialX, y, materialWidth, 18).stroke();
        doc.rect(totalX, y, totalWidth, 18).stroke();

        doc.end();
    });
}

// API endpoint to submit T&M report
app.post('/api/submit-tm-report', async (req, res) => {
    try {
        const formData = req.body;
        
        console.log('Received T&M report submission');
        
        // Generate PDF document
        const pdfBuffer = await generateTMReportPDF(formData);
        
        // Prepare email
        const jobNumber = formData.jobNumber.split(' - ')[0];
        const projectName = formData.jobNumber.split(' - ')[1] || 'Project';
        const fileName = `TM_Report_${jobNumber}_${formData.date}.pdf`;
        
        const mailOptions = {
            to: [process.env.EMAIL_TO_KATHIE, process.env.EMAIL_TO_JORDAN],
            subject: `T&M Report - Job ${jobNumber} - ${projectName} - ${formData.date}`,
            html: `
                <h2>New T&M Report Submitted</h2>
                <p><strong>Date:</strong> ${formData.date}</p>
                <p><strong>Job Number:</strong> ${formData.jobNumber}</p>
                <p><strong>General Contractor:</strong> ${formData.generalContractor}</p>
                <p><strong>Project Address:</strong> ${formData.projectAddress}</p>
                <p><strong>Crew:</strong> ${formData.numMen} men x ${formData.totalHours} hours</p>
                <p><strong>Foreman:</strong> ${formData.foremanName}</p>
                <p><strong>Work Description:</strong></p>
                <p>${formData.workDescription}</p>
                <hr>
                <p><em>Please see attached PDF for complete T&M report. Add dollar amounts and finalize for submission to GC.</em></p>
            `,
            attachments: [
                {
                    filename: fileName,
                    content: pdfBuffer
                }
            ]
        };
        
        // Add photos if any
        if (formData.photos && formData.photos.length > 0) {
            formData.photos.forEach((photo, index) => {
                const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
                const photoBuffer = Buffer.from(base64Data, 'base64');
                mailOptions.attachments.push({
                    filename: `photo_${index + 1}.jpg`,
                    content: photoBuffer
                });
            });
        }
        
        // Send email via Resend
        await resend.emails.send({
            from: 'T&M Reports <onboarding@resend.dev>',
            to: [process.env.EMAIL_TO_KATHIE, process.env.EMAIL_TO_JORDAN],
            subject: mailOptions.subject,
            html: mailOptions.html,
            attachments: mailOptions.attachments
        });
        
        console.log('T&M report emailed successfully');
        res.json({ success: true, message: 'T&M report submitted successfully' });
        
    } catch (error) {
        console.error('Error processing T&M report:', error);
        res.status(500).json({ success: false, message: 'Error submitting report', error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'T&M Report Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`T&M Report Server running on port ${PORT}`);
});
