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

// Generate T&M Report PDF Document
async function generateTMReportPDF(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            size: 'LETTER',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Logo
        try {
            const logoPath = path.join(__dirname, 'CBlogo_transparent_backgrd_1000x1000px.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 256, 50, { width: 100 });
                doc.moveDown(4);
            }
        } catch (error) {
            console.log('Logo not found, continuing without it');
            doc.moveDown(2);
        }

        // Header
        doc.fontSize(14).font('Helvetica-Bold').text('A & J CALIFORNIA BUILDERS, INC.', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('1261 Lincoln Avenue, Suite 106', { align: 'center' });
        doc.text('San José, CA 95125', { align: 'center' });
        doc.text('Office 408.988.8739', { align: 'center' });
        doc.text("California State Contractor's License # 949668", { align: 'center' });
        doc.moveDown();

        // Title
        doc.fontSize(18).font('Helvetica-Bold')
           .fillColor('#A27339')
           .text('T I M E   &   M A T E R I A L   R E P O R T', { align: 'center' });
        doc.fillColor('#000000');
        doc.moveDown(1.5);

        // Project Info Table
        const leftCol = 50;
        const rightCol = 300;
        let y = doc.y;

        doc.fontSize(10).font('Helvetica-Bold');
        
        // PROJECT NAME and PROJECT #
        doc.text('PROJECT NAME:', leftCol, y);
        doc.font('Helvetica').text(data.jobNumber.split(' - ')[1] || '', leftCol + 120, y);
        doc.font('Helvetica-Bold').text('PROJECT #:', rightCol, y);
        doc.font('Helvetica').text(data.jobNumber.split(' - ')[0] || '', rightCol + 80, y);
        y += 20;

        // DATE
        doc.font('Helvetica-Bold').text('DATE:', leftCol, y);
        doc.font('Helvetica').text(data.date, leftCol + 120, y);
        y += 20;

        // LOCATION
        doc.font('Helvetica-Bold').text('LOCATION:', leftCol, y);
        doc.font('Helvetica').text(data.projectAddress, leftCol + 120, y, { width: 400 });
        y += 25;

        // GEN. CONTRACTOR
        doc.font('Helvetica-Bold').text('GEN. CONTRACTOR:', leftCol, y);
        doc.font('Helvetica').text(data.generalContractor, leftCol + 120, y, { width: 400 });
        y += 20;

        // GC ADDRESS
        doc.font('Helvetica-Bold').text('GC ADDRESS:', leftCol, y);
        doc.font('Helvetica').text(data.gcAddress || '', leftCol + 120, y, { width: 400 });
        y += 25;

        // CREW SIZE and TOTAL HOURS
        doc.font('Helvetica-Bold').text('CREW SIZE:', leftCol, y);
        doc.font('Helvetica').text(`${data.numMen} men`, leftCol + 120, y);
        doc.font('Helvetica-Bold').text('TOTAL HOURS:', rightCol, y);
        doc.font('Helvetica').text(`${data.totalHours} hrs`, rightCol + 80, y);
        y += 20;

        // FOREMAN
        doc.font('Helvetica-Bold').text('FOREMAN:', leftCol, y);
        doc.font('Helvetica').text(data.foremanName, leftCol + 120, y);
        y += 30;

        // WORK DESCRIPTION
        doc.font('Helvetica-Bold').fontSize(12).text('WORK DESCRIPTION', leftCol, y);
        y += 15;
        doc.font('Helvetica').fontSize(10).text(data.workDescription || '', leftCol, y, { 
            width: 512,
            align: 'left'
        });
        y = doc.y + 20;

        // Labor/Materials/Equipment Table
        doc.font('Helvetica-Bold').fontSize(10);
        
        // Table header
        const tableTop = y;
        const descCol = leftCol;
        const qtyCol = leftCol + 310;
        const unitCol = leftCol + 360;
        const taxCol = leftCol + 420;
        const totalCol = leftCol + 475;

        // Draw table header
        doc.rect(leftCol, tableTop, 512, 20).stroke();
        doc.text('DESCRIPTION', descCol + 5, tableTop + 5);
        doc.text('QTY', qtyCol + 5, tableTop + 5);
        doc.text('UNIT', unitCol + 5, tableTop + 5);
        doc.text('TAX', taxCol + 5, tableTop + 5);
        doc.text('TOTAL', totalCol + 5, tableTop + 5);

        y = tableTop + 20;

        // Labor row
        doc.rect(leftCol, y, 512, 18).stroke();
        doc.font('Helvetica-Bold').text('Labor', descCol + 5, y + 4);
        y += 18;

        // Materials
        if (data.materials && data.materials.length > 0) {
            data.materials.forEach(material => {
                doc.rect(leftCol, y, 512, 18).stroke();
                doc.font('Helvetica').text(
                    `${material.desc}${material.supplier ? ` (${material.supplier})` : ''}`,
                    descCol + 5, y + 4, { width: 300 }
                );
                doc.text(material.qty || '', qtyCol + 5, y + 4);
                y += 18;
            });
        }

        // Empty rows
        for (let i = 0; i < 6; i++) {
            doc.rect(leftCol, y, 512, 18).stroke();
            y += 18;
        }

        // Equipment section
        doc.rect(leftCol, y, 512, 18).stroke();
        doc.font('Helvetica-Bold').text('Equipment', descCol + 5, y + 4);
        y += 18;

        if (data.equipment && data.equipment.length > 0) {
            data.equipment.forEach(equip => {
                doc.rect(leftCol, y, 512, 18).stroke();
                doc.font('Helvetica').text(equip.type || '', descCol + 5, y + 4);
                doc.text(`${equip.hours} hrs`, qtyCol + 5, y + 4);
                y += 18;
            });
        }

        // Totals
        doc.rect(leftCol, y, 512, 18).stroke();
        doc.font('Helvetica-Bold').text('SUBTOTAL', descCol + 5, y + 4);
        y += 18;

        doc.rect(leftCol, y, 512, 18).stroke();
        doc.font('Helvetica-Bold').text('Profit and Overhead 15%', descCol + 5, y + 4);
        y += 18;

        doc.rect(leftCol, y, 512, 18).stroke();
        doc.font('Helvetica-Bold').text('TOTAL', descCol + 5, y + 4);
        y += 30;

        // Approval line
        doc.font('Helvetica').fontSize(10);
        doc.text('APPROVED BY: ________________________________              DATE: ______________', leftCol, y);
        y += 15;
        doc.fontSize(9).font('Helvetica-Oblique').text('Superintendent', { align: 'center' });

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
