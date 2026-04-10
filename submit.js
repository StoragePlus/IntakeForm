
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit-form').addEventListener('click', () => {
    if (validatePage(currentPage)) {
      generateAndDownloadPDF();
    }
  });
});

async function generateAndDownloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPageBreak(needed = 20) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function sectionHeader(text) {
    checkPageBreak(32);
    doc.setFillColor(26, 86, 219);
    doc.rect(margin, y, contentW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(text.toUpperCase(), margin + 8, y + 15);
    doc.setTextColor(30, 30, 30);
    y += 30;
  }

  function field(label, value) {
    checkPageBreak(18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(90, 90, 90);
    doc.text(label + ':', margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(String(value || '—'), margin + 145, y);
    y += 18;
  }

  function spacer() { y += 8; }

  doc.setFillColor(13, 27, 42);
  doc.rect(0, 0, pageW, 62, 'F');
  // Red accent stripe
  doc.setFillColor(192, 57, 43);
  doc.rect(0, 58, pageW, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Intake Form Submission', pageW / 2, 36, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, 52, { align: 'center' });
  y = 80;


  sectionHeader('Personal Information');
  field('First Name', document.getElementById('firstname').value.trim());
  field('Last Name', document.getElementById('lastname').value.trim());
  field('Phone', document.getElementById('phone').value.trim());
  field('Email', document.getElementById('email').value.trim());
  spacer();


  sectionHeader('Address');
  field('Street Address', document.getElementById('address-street').value.trim());
  const apt = document.getElementById('address-apt').value.trim();
  if (apt) field('Apt / Unit', apt);
  field('City', document.getElementById('address-city').value.trim());
  field('State', document.getElementById('address-state').value);
  field('Zip Code', document.getElementById('address-zip').value.trim());
  spacer();


  sectionHeader('Emergency Contacts');
  emergencyContacts.forEach((ec, i) => {
    const name = [ec.firstName, ec.lastName].filter(Boolean).join(' ');
    field(`Contact ${i + 1}`, `${name} — ${ec.phone}`);
  });
  spacer();


  sectionHeader('Authorized Users');
  const selfFirst = document.getElementById('firstname').value.trim();
  const selfLast = document.getElementById('lastname').value.trim();
  const selfPhone = document.getElementById('phone').value.trim();
  field('1. You', `${[selfFirst, selfLast].filter(Boolean).join(' ')}${selfPhone ? ' — ' + selfPhone : ''}`);
  let idx = 2;
  emergencyContacts.forEach(ec => {
    const name = [ec.firstName, ec.lastName].filter(Boolean).join(' ');
    field(`${idx++}. Emergency Contact`, `${name} — ${ec.phone}`);
  });
  authorizedUsers.forEach(u => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    field(`${idx++}. Authorized User`, `${name}${u.phone ? ' — ' + u.phone : ''}`);
  });
  spacer();


  sectionHeader('How Did You Hear About Us');
  const referralEl = document.querySelector('input[name="referral"]:checked');
  const referralLabel = referralEl
    ? referralEl.value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '—';
  field('Referral Source', referralLabel);
  spacer();


  sectionHeader('Fees & Protection Plan');
  field('One-Time Admin Fee', '$25.00');
  const planEl = document.querySelector('input[name="protection-plan"]:checked');
  if (planEl) {
    if (planEl.value === 'own-insurance') {
      field('Plan Selected', 'Own Insurance');
      field('Insurance Provider', document.getElementById('insurance-provider').value.trim());
      field('Policy Number', document.getElementById('insurance-policy').value.trim());
      const agent = document.getElementById('insurance-agent').value.trim();
      if (agent) field('Agent Name', agent);
      const agentPhone = document.getElementById('insurance-phone').value.trim();
      if (agentPhone) field('Agent Phone', agentPhone);
      field('Policy Expiration', document.getElementById('insurance-expiry').value);
    } else {
      const planLabels = {
        basic:    'Basic — $11.00/mo (up to $2,500)',
        standard: 'Standard — $17.00/mo (up to $4,000)',
        premium:  'Premium — $21.00/mo (up to $5,000)',
      };
      field('Plan Selected', planLabels[planEl.value] || planEl.value);
    }
  }
  field('Fees Acknowledged', 'Yes');
  spacer();


  sectionHeader('Signature');
  checkPageBreak(110);
  const sigDataUrl = canvas.toDataURL('image/png');
  // White background box for the signature
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(margin, y, contentW, 100, 4, 4, 'FD');
  doc.addImage(sigDataUrl, 'PNG', margin + 4, y + 4, contentW - 8, 92);
  y += 110;


  const firstName = document.getElementById('firstname').value.trim() || 'form';
  const lastName = document.getElementById('lastname').value.trim() || 'submission';
  const fileName = `intake_${lastName}_${firstName}.pdf`;
  doc.save(fileName);

  const pdfBase64 = doc.output('datauristring');
  fetch('/.netlify/functions/send-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdf:       pdfBase64,
      fileName:  fileName,
      firstName: firstName,
      lastName:  lastName,
    }),
  }).catch((err) => {
    console.error('Send intake error:', err);
  });
}
