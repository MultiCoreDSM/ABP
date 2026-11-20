
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export async function gerarPdfCertificado(certificado, baseUrl) {
    const urlValidacao =
        `${baseUrl}/FrontEnd/Pages/validar-certificado.html?codigo=${encodeURIComponent(certificado.codigo)}`;

    const qrCode = await QRCode.toBuffer(urlValidacao, {
        type: "png",
        errorCorrectionLevel: "H",
        margin: 1,
        width: 400
    });

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            layout: "landscape",
            margin: 45
        });

        const partes = [];

        doc.on("data", parte => partes.push(parte));
        doc.on("end", () => resolve(Buffer.concat(partes)));
        doc.on("error", reject);

        const largura = doc.page.width;
        const altura = doc.page.height;

        // Fundo e borda
        doc.rect(20, 20, largura - 40, altura - 40)
            .lineWidth(3)
            .stroke("#243B64");

        doc.rect(28, 28, largura - 56, altura - 56)
            .lineWidth(1)
            .stroke("#B9A36A");

        // Título
        doc.fillColor("#243B64")
            .font("Helvetica-Bold")
            .fontSize(30)
            .text("CERTIFICADO DE CONCLUSÃO", 60, 85, {
                align: "center"
            });

        doc.moveDown(1);

        doc.fillColor("#444444")
            .font("Helvetica")
            .fontSize(15)
            .text("Certificamos que", {
                align: "center"
            });

        // Nome do candidato
        doc.moveDown(0.7);

        doc.fillColor("#243B64")
            .font("Helvetica-Bold")
            .fontSize(26)
            .text(certificado.titular.nome, {
                align: "center"
            });

        // Texto do certificado
        doc.moveDown(0.8);

        doc.fillColor("#444444")
            .font("Helvetica")
            .fontSize(14)
            .text(
                "concluiu com aproveitamento a avaliação da plataforma ABP, " +
                "cumprindo os requisitos necessários para a certificação.",
                100,
                260,
                {
                    width: largura - 200,
                    align: "center"
                }
            );

        // Resultado
        doc.font("Helvetica-Bold")
            .fontSize(16)
            .fillColor("#243B64")
            .text(
                `Aproveitamento: ${certificado.percentual}%`,
                100,
                330,
                {
                    width: largura - 200,
                    align: "center"
                }
            );

        // Dados de emissão
        const data = new Date(certificado.emitido_em)
            .toLocaleDateString("pt-BR");

        doc.font("Helvetica")
            .fontSize(10)
            .fillColor("#555555")
            .text(
                `Emitido em: ${data} | CPF: ${certificado.titular.cpf}`,
                60,
                395,
                {
                    width: largura - 200,
                    align: "center"
                }
            );

        // QR Code
        doc.image(qrCode, largura - 155, altura - 155, {
            width: 95,
            height: 95
        });

        doc.fontSize(8)
            .text("Valide este certificado", largura - 175, altura - 53, {
                width: 135,
                align: "center"
            });

        // Identificador
        doc.fontSize(7)
            .text(`Código: ${certificado.codigo}`, 60, altura - 65, {
                width: largura - 250
            });

        doc.end();
    });
}
