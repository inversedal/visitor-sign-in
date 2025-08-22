import jsPDF from "jspdf";

interface BadgeData {
  name: string;
  company: string;
  hostName: string;
  visitReason: string;
  signInTime: Date;
  photoData?: string;
}

export function generateBadgePDF(data: BadgeData) {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [85, 54], // Credit card size badge
    });

    // Set font
    pdf.setFont("helvetica");

    // Background
    pdf.setFillColor(249, 250, 251); // bg-gray-50
    pdf.rect(0, 0, 85, 54, "F");

    // Header section with company logo space
    pdf.setFillColor(25, 118, 210); // primary blue
    pdf.rect(0, 0, 85, 12, "F");

    // Company name/title
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255); // white text
    pdf.text("VISITOR", 42.5, 7, { align: "center" });

    // Photo section (if available)
    if (data.photoData) {
      try {
        pdf.addImage(data.photoData, "JPEG", 5, 15, 20, 20);
      } catch (photoError) {
        console.warn("Could not add photo to badge:", photoError);
        // Add placeholder for photo
        pdf.setFillColor(229, 231, 235); // gray-200
        pdf.rect(5, 15, 20, 20, "F");
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128); // gray-500
        pdf.text("PHOTO", 15, 26, { align: "center" });
      }
    } else {
      // Photo placeholder
      pdf.setFillColor(229, 231, 235); // gray-200
      pdf.rect(5, 15, 20, 20, "F");
      pdf.setFontSize(6);
      pdf.setTextColor(107, 114, 128); // gray-500
      pdf.text("PHOTO", 15, 26, { align: "center" });
    }

    // Visitor details
    pdf.setTextColor(31, 41, 55); // gray-800

    // Name (largest text)
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    const nameLines = pdf.splitTextToSize(data.name, 55);
    pdf.text(nameLines, 28, 18);

    // Company
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    const companyLines = pdf.splitTextToSize(data.company || "Guest", 55);
    pdf.text(companyLines, 28, 25);

    // Visiting
    pdf.setFontSize(6);
    pdf.setTextColor(107, 114, 128); // gray-500
    pdf.text("Visiting:", 28, 30);
    pdf.setTextColor(31, 41, 55); // gray-800
    const hostLines = pdf.splitTextToSize(data.hostName, 55);
    pdf.text(hostLines, 28, 33);

    // Purpose
    pdf.setFontSize(6);
    pdf.setTextColor(107, 114, 128); // gray-500
    pdf.text("Purpose:", 28, 38);
    pdf.setTextColor(31, 41, 55); // gray-800
    const purposeLines = pdf.splitTextToSize(data.visitReason, 55);
    pdf.text(purposeLines, 28, 41);

    // Date/Time
    pdf.setFontSize(5);
    pdf.setTextColor(107, 114, 128); // gray-500
    const dateTime = data.signInTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    pdf.text(dateTime, 42.5, 50, { align: "center" });

    // Footer border
    pdf.setDrawColor(209, 213, 219); // gray-300
    pdf.line(5, 47, 80, 47);

    // Download the PDF
    const fileName = `visitor-badge-${data.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error("Error generating PDF badge:", error);
    throw new Error("Failed to generate visitor badge PDF");
  }
}
