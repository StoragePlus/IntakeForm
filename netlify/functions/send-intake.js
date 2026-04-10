exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { pdf, fileName, firstName, lastName } = JSON.parse(event.body);

  // Strip the data URI prefix to get raw base64
  const base64Content = pdf.split(',')[1];

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'storageplusemailproxy@gmail.com',
      to:   'greenpoint@nystorage.com',
      subject: `New Intake Form — ${lastName}, ${firstName}`,
      html: `<p>New intake form submission from <strong>${firstName} ${lastName}</strong>.</p><p>Please find the completed intake form attached.</p>`,
      attachments: [
        {
          filename: fileName,
          content:  base64Content,
        }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Resend error:', error);
    return { statusCode: 500, body: 'Failed to send email' };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
