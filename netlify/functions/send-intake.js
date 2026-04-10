exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { pdf, fileName, firstName, lastName } = JSON.parse(event.body);
  const base64Content = pdf.split(',')[1];

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: 'greenpoint@nystorage.com' }] }],
      from:    { email: 'greenpoint@nystorage.com' },
      subject: `New Intake Form — ${lastName}, ${firstName}`,
      content: [{ type: 'text/html', value: `<p>New intake form submission from <strong>${firstName} ${lastName}</strong>.</p><p>Please find the completed intake form attached.</p>` }],
      attachments: [
        {
          filename:    fileName,
          content:     base64Content,
          type:        'application/pdf',
          disposition: 'attachment',
        }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('SendGrid error:', error);
    return { statusCode: 500, body: 'Failed to send email' };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
