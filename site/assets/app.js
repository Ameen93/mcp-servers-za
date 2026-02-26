const form = document.querySelector('#waitlistForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = encodeURIComponent('MCP Servers ZA — Demo / Waitlist request');
    const body = encodeURIComponent(
`Name: ${data.name || ''}
Email: ${data.email || ''}
Company: ${data.company || ''}
Use case: ${data.usecase || ''}
Timeline: ${data.timeline || ''}

Message:
${data.message || ''}`
    );
    window.location.href = `mailto:hello@mcpserversza.dev?subject=${subject}&body=${body}`;
  });
}
