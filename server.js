const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle, ImageRun } = require('docx');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for your frontend
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Email configuration (you'll set these as environment variables)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // jordan.calbuilders@gmail.com
        pass: process.env.EMAIL_PASSWORD // App-specific password
    }
});

// Generate T&M Report Word Document
async function generateTMReport(data) {
    // Read logo image (should be in same directory as server.js when deployed)
    let logoImage = null;
    try {
        logoImage = fs.readFileSync(path.join(__dirname, 'CBlogo_transparent_backgrd_1000x1000px.png'));
    } catch (error) {
        console.log('Logo not found, generating document without logo');
    }
    
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Logo (if available)
                ...(logoImage ? [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: logoImage,
                                transformation: {
                                    width: 150,
                                    height: 150
                                }
                            })
                        ]
                    }),
                    new Paragraph({ text: "" })
                ] : []),
                
                // Header
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "A & J CALIFORNIA BUILDERS, INC.",
                            bold: true,
                            size: 28
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "1261 Lincoln Avenue, Suite 106",
                            size: 20
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "San José, CA 95125",
                            size: 20
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "Office 408.988.8739",
                            size: 20
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "California State Contractor's License # 949668",
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "T I M E   &   M A T E R I A L   R E P O R T",
                            bold: true,
                            size: 32,
                            color: "A27339"
                        })
                    ]
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                
                // Project Info Table
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "PROJECT NAME", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: data.jobNumber.split(' - ')[1] || '' })] }),
                                new TableCell({ children: [new Paragraph({ text: "PROJECT #", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: data.jobNumber.split(' - ')[0] || '' })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "DATE", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: data.date })] }),
                                new TableCell({ children: [new Paragraph({ text: "" })] }),
                                new TableCell({ children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "LOCATION", bold: true })] }),
                                new TableCell({ 
                                    columnSpan: 3,
                                    children: [new Paragraph({ text: data.projectAddress })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "GEN. CONTRACTOR / OWNER", bold: true })] }),
                                new TableCell({ 
                                    columnSpan: 3,
                                    children: [new Paragraph({ text: data.generalContractor })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "ADDRESS", bold: true })] }),
                                new TableCell({ 
                                    columnSpan: 3,
                                    children: [new Paragraph({ text: data.gcAddress || '' })] 
                                })
                            ]
                        })
                    ]
                }),
                
                new Paragraph({ text: "" }),
                
                // Work Details Table
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "DESCRIPTION", bold: true })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "DATE", bold: true })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "HOURS", bold: true })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "MATERIAL COST", bold: true })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "TOTAL", bold: true })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({ text: `Crew: ${data.numMen} men x ${data.totalHours} hours` }),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ text: data.workDescription }),
                                        ...(data.equipment && data.equipment.length > 0 ? [
                                            new Paragraph({ text: "" }),
                                            new Paragraph({ text: "EQUIPMENT:", bold: true }),
                                            ...data.equipment.map(eq => 
                                                new Paragraph({ text: `  • ${eq.type}: ${eq.hours} hours` })
                                            )
                                        ] : []),
                                        ...(data.materials && data.materials.length > 0 ? [
                                            new Paragraph({ text: "" }),
                                            new Paragraph({ text: "MATERIALS NEEDED:", bold: true }),
                                            ...data.materials.map(mat => 
                                                new Paragraph({ text: `  • ${mat.qty} ${mat.desc}${mat.supplier ? ' (' + mat.supplier + ')' : ''}` })
                                            )
                                        ] : []),
                                        new Paragraph({ text: "" }),
                                        new Paragraph({ text: `Foreman: ${data.foremanName}` })
                                    ]
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: data.date })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "" })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "" })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "" })] 
                                })
                            ]
                        }),
                        // Empty rows for additional entries with balanced widths
                        ...Array(6).fill(null).map(() => new TableRow({
                            children: [
                                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        })),
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Equipment", bold: true })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "SUBTOTAL", bold: true })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Profit and Overhead 15%", bold: true })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "TOTAL", bold: true })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        })
                    ]
                }),
                
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "APPROVED BY: ________________________________________________              DATE: ________________" })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "Superintendent", italics: true })
                    ]
                })
            ]
        }]
    });

    return await Packer.toBuffer(doc);
}

// API endpoint to submit T&M report
app.post('/api/submit-tm-report', async (req, res) => {
    try {
        const formData = req.body;
        
        console.log('Received T&M report submission');
        
        // Generate Word document
        const docBuffer = await generateTMReport(formData);
        
        // Prepare email
        const jobNumber = formData.jobNumber.split(' - ')[0];
        const projectName = formData.jobNumber.split(' - ')[1] || 'Project';
        const fileName = `TM_Report_${jobNumber}_${formData.date}.docx`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ['jordan.calbuilders@gmail.com', 'kathie.calbuilders@gmail.com'],
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
                <p><em>Please see attached Word document for complete T&M report. Add dollar amounts and finalize for submission to GC.</em></p>
            `,
            attachments: [
                {
                    filename: fileName,
                    content: docBuffer
                }
            ]
        };
        
        // Add photos if any
        if (formData.photos && formData.photos.length > 0) {
            formData.photos.forEach((photo, index) => {
                // Convert base64 to buffer
                const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
                const photoBuffer = Buffer.from(base64Data, 'base64');
                mailOptions.attachments.push({
                    filename: `photo_${index + 1}.jpg`,
                    content: photoBuffer
                });
            });
        }
        
        // Send email
        await transporter.sendMail(mailOptions);
        
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
