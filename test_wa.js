const payload = {
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'template',
  template: {
    name: 'cleanair_dispatch',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: "report.id" },
          { type: 'text', text: "priority" },
          { type: 'text', text: "report.category" },
          { type: 'text', text: `wardName` }
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          { type: 'text', text: "report.id" }
        ]
      }
    ]
  }
};
console.log(JSON.stringify(payload, null, 2));
