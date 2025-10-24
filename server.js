const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, ImageRun } = require('docx');
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
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for your frontend
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Resend email configuration
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate T&M Report Word Document
async function generateTMReport(data) {
    // Read logo image
    let logoImage = null;
    try {
        logoImage = fs.readFileSync(path.join(__dirname, 'CBlogo_transparent_backgrd_1000x1000px.png'));
    } catch (error) {
        console.log('Logo not found, generating document without logo');
    }
    
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 720,
                        right: 720,
                        bottom: 720,
                        left: 720
                    }
                }
            },
            children: [
                // Logo
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
                
                // Project Info Table - Fixed widths
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 2500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "PROJECT NAME", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 2500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: data.jobNumber.split(' - ')[1] || '', size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 2000, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "PROJECT #", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: data.jobNumber.split(' - ')[0] || '', size: 20 })]
                                    })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "DATE", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 7000, type: WidthType.DXA },
                                    columnSpan: 3,
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: data.date, size: 20 })]
                                    })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 2000, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "LOCATION", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 6500, type: WidthType.DXA },
                                    columnSpan: 3,
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: data.projectAddress, size: 20 })]
                                    })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 2000, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "GEN. CONTRACTOR", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 6500, type: WidthType.DXA },
                                    columnSpan: 3,
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: data.generalContractor, size: 20 })]
                                    })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 2000, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "GC ADDRESS", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 6500, type: WidthType.DXA },
                                    columnSpan: 3,
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: data.gcAddress || '', size: 20 })]
                                    })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "CREW SIZE", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: `${data.numMen} men`, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 2000, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "TOTAL HOURS", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: `${data.totalHours} hrs`, size: 20 })]
                                    })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "FOREMAN", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 7000, type: WidthType.DXA },
                                    columnSpan: 3,
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: data.foremanName, size: 20 })]
                                    })] 
                                })
                            ]
                        })
                    ]
                }),
                
                new Paragraph({ text: "" }),
                new Paragraph({ 
                    children: [new TextRun({ text: "WORK DESCRIPTION", bold: true, size: 24 })]
                }),
                new Paragraph({ 
                    children: [new TextRun({ text: data.workDescription || '', size: 20 })]
                }),
                new Paragraph({ text: "" }),
                
                // Labor/Materials/Equipment Table - 60% Description, 10% each for other columns
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "DESCRIPTION", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "QTY", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "UNIT PRICE", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "TAX", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ 
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "TOTAL", bold: true, size: 20 })]
                                    })] 
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "Labor", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        // Materials
                        ...(data.materials && data.materials.length > 0 ? 
                            data.materials.map(material => new TableRow({
                                children: [
                                    new TableCell({ 
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ 
                                            children: [new TextRun({ text: `${material.desc}${material.supplier ? ` (${material.supplier})` : ''}`, size: 20 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        width: { size: 10, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ 
                                            children: [new TextRun({ text: material.qty || '', size: 20 })]
                                        })] 
                                    }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                                ]
                            }))
                        : []),
                        // Empty rows for additional entries
                        ...Array(6).fill(null).map(() => new TableRow({
                            children: [
                                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        })),
                        // Equipment section
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "Equipment", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        ...(data.equipment && data.equipment.length > 0 ?
                            data.equipment.map(equip => new TableRow({
                                children: [
                                    new TableCell({ 
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ 
                                            children: [new TextRun({ text: equip.type || '', size: 20 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        width: { size: 10, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ 
                                            children: [new TextRun({ text: `${equip.hours} hrs` || '', size: 20 })]
                                        })] 
                                    }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                                ]
                            }))
                        : []),
                        // Totals
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "SUBTOTAL", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "Profit and Overhead 15%", bold: true, size: 20 })]
                                    })] 
                                }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] }),
                                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "" })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "TOTAL", bold: true, size: 20 })]
                                    })] 
                                }),
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
                        new TextRun({ text: "APPROVED BY: ________________________________________________              DATE: ________________", size: 20 })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "Superintendent", italics: true, size: 20 })
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
